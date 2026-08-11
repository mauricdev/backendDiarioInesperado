import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Transforma una URL de Cloudinary a un formato de aspecto vertical 9:16 para Historias (Stories).
   */
  private getStoryImageUrl(url: string): string {
    if (url && url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/ar_9:16,c_fill,g_auto/');
    }
    return url;
  }

  /**
   * OPCIÓN 1: Publica un enlace/tarjeta en el muro de Facebook (/feed).
   */
  async publishToPage(message: string, link?: string): Promise<any> {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageId || !accessToken) {
      this.logger.warn(
        'Facebook Page ID o Access Token no están configurados en .env. Se omite la publicación.',
      );
      return null;
    }

    const url = `https://graph.facebook.com/v20.0/${pageId}/feed`;
    const payload: any = {
      message,
      access_token: accessToken,
    };

    if (link) {
      payload.link = link;
    }

    try {
      const response = await firstValueFrom(this.httpService.post(url, payload));
      this.logger.log(`Publicación (Link Card) en Facebook exitosa. ID: ${response.data?.id}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Error publicando Link Card en Facebook Graph API:',
        error?.response?.data || error.message,
      );
      return null;
    }
  }

  /**
   * OPCIÓN 2 (RECOMENDADA): Publica una imagen nativa (Cloudinary) grande en el muro de Facebook (/photos).
   * @param caption Texto de la publicación (incluye título, resumen y link)
   * @param imageUrl URL pública directa de la imagen (ej: Cloudinary)
   */
  async publishPhotoToPage(caption: string, imageUrl: string): Promise<any> {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageId || !accessToken) {
      this.logger.warn(
        'Facebook Page ID o Access Token no están configurados en .env. Se omite la foto en Facebook.',
      );
      return null;
    }

    const url = `https://graph.facebook.com/v20.0/${pageId}/photos`;
    const payload = {
      url: imageUrl,
      caption: caption,
      access_token: accessToken,
    };

    try {
      const response = await firstValueFrom(this.httpService.post(url, payload));
      this.logger.log(
        `Foto nativa publicada exitosamente en Facebook Fanpage. Post ID: ${response.data?.id}`,
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Error publicando foto nativa en Facebook Graph API:',
        error?.response?.data || error.message,
      );
      return null;
    }
  }

  /**
   * PUBLICACIÓN EN FEED DE INSTAGRAM GRAPH API (Proceso de 3 pasos con Polling de status_code)
   * @param caption Texto del post / pie de foto en Instagram
   * @param imageUrl URL pública directa de la imagen de Cloudinary
   */
  async publishToInstagram(caption: string, imageUrl: string): Promise<any> {
    const igUserId = process.env.INSTAGRAM_USER_ID;
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!igUserId || !accessToken) {
      this.logger.warn(
        'INSTAGRAM_USER_ID o Access Token no están configurados en .env. Se omite publicación en Feed de Instagram.',
      );
      return null;
    }

    try {
      // PASO 1: Crear el contenedor de contenido para el Feed de Instagram
      const createMediaUrl = `https://graph.facebook.com/v20.0/${igUserId}/media`;
      const containerPayload = {
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken,
      };

      const containerRes = await firstValueFrom(
        this.httpService.post(createMediaUrl, containerPayload),
      );
      const creationId = containerRes.data?.id;

      if (!creationId) {
        throw new Error('No se recibió el creation_id al crear el contenedor de Feed de Instagram.');
      }

      this.logger.log(`Contenedor de Feed de Instagram creado exitosamente. Creation ID: ${creationId}`);

      // PASO 2: Polling - Esperar hasta que Instagram procese la imagen (status_code === 'FINISHED')
      let isReady = false;
      let attempts = 0;
      const maxAttempts = 10; // Hasta 10 intentos (máx ~30 segundos)
      const delayMs = 3000;  // 3 segundos entre consulta

      while (!isReady && attempts < maxAttempts) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        const statusUrl = `https://graph.facebook.com/v20.0/${creationId}?fields=status_code,status&access_token=${accessToken}`;
        const statusRes = await firstValueFrom(this.httpService.get(statusUrl));
        const statusCode = statusRes.data?.status_code;

        this.logger.log(
          `Verificando estado del contenedor de Feed de Instagram (Intento ${attempts}/${maxAttempts}): ${statusCode}`,
        );

        if (statusCode === 'FINISHED') {
          isReady = true;
        } else if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
          throw new Error(
            `El procesamiento del contenedor en Instagram falló con estado: ${statusCode}`,
          );
        }
      }

      if (!isReady) {
        throw new Error(
          'Timeout: Instagram no completó el procesamiento de la imagen para el Feed a tiempo.',
        );
      }

      // PASO 3: Publicar el contenedor una vez listo
      const publishUrl = `https://graph.facebook.com/v20.0/${igUserId}/media_publish`;
      const publishPayload = {
        creation_id: creationId,
        access_token: accessToken,
      };

      const publishRes = await firstValueFrom(
        this.httpService.post(publishUrl, publishPayload),
      );

      this.logger.log(
        `Publicación en Feed de Instagram realizada con éxito. Media ID: ${publishRes.data?.id}`,
      );
      return publishRes.data;
    } catch (error: any) {
      this.logger.error(
        'Error durante el proceso de publicación en Feed de Instagram:',
        error?.response?.data || error.message,
      );
      return null;
    }
  }

  /**
   * PUBLICACIÓN DE HISTORIAS (STORIES) EN INSTAGRAM GRAPH API
   * @param imageUrl URL pública de Cloudinary
   */
  async publishStoryToInstagram(imageUrl: string): Promise<any> {
    const igUserId = process.env.INSTAGRAM_USER_ID;
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!igUserId || !accessToken) {
      this.logger.warn(
        'INSTAGRAM_USER_ID o Access Token no están configurados en .env. Se omite publicación de Historia en Instagram.',
      );
      return null;
    }

    try {
      // 1. Transformación dinámica a aspecto 9:16 vertical para Historias en Cloudinary
      const storyImageUrl = this.getStoryImageUrl(imageUrl);

      this.logger.log(`Iniciando creación de Historia en Instagram. URL transformada 9:16: ${storyImageUrl}`);

      // 2. Crear contenedor de Historia (media_type: 'STORIES', SIN parámetro caption)
      const createMediaUrl = `https://graph.facebook.com/v20.0/${igUserId}/media`;
      const containerPayload = {
        image_url: storyImageUrl,
        media_type: 'STORIES',
        access_token: accessToken,
      };

      const containerRes = await firstValueFrom(
        this.httpService.post(createMediaUrl, containerPayload),
      );
      const creationId = containerRes.data?.id;

      if (!creationId) {
        throw new Error('No se obtuvo creation_id para la Historia de Instagram.');
      }

      this.logger.log(`Contenedor de Historia creado exitosamente. Creation ID: ${creationId}`);

      // 3. Polling de status_code
      let isReady = false;
      let attempts = 0;
      const maxAttempts = 10;
      const delayMs = 3000;

      while (!isReady && attempts < maxAttempts) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        const statusUrl = `https://graph.facebook.com/v20.0/${creationId}?fields=status_code,status&access_token=${accessToken}`;
        const statusRes = await firstValueFrom(this.httpService.get(statusUrl));
        const statusCode = statusRes.data?.status_code;

        this.logger.log(
          `Verificando estado de la Historia en Instagram (Intento ${attempts}/${maxAttempts}): ${statusCode}`,
        );

        if (statusCode === 'FINISHED') {
          isReady = true;
        } else if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
          throw new Error(
            `El procesamiento de la Historia en Instagram falló con estado: ${statusCode}`,
          );
        }
      }

      if (!isReady) {
        throw new Error(
          'Timeout: Instagram no completó el procesamiento de la Historia a tiempo.',
        );
      }

      // 4. Publicar la Historia
      const publishUrl = `https://graph.facebook.com/v20.0/${igUserId}/media_publish`;
      const publishPayload = {
        creation_id: creationId,
        access_token: accessToken,
      };

      const publishRes = await firstValueFrom(
        this.httpService.post(publishUrl, publishPayload),
      );

      this.logger.log(
        `Historia publicada en Instagram con éxito. Media ID: ${publishRes.data?.id}`,
      );
      return publishRes.data;
    } catch (error: any) {
      this.logger.error(
        'Error durante la publicación de la Historia en Instagram Graph API:',
        error?.response?.data || error.message,
      );
      return null;
    }
  }
}
