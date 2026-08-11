import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);

  constructor(private readonly httpService: HttpService) {}

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
   * PUBLICACIÓN EN INSTAGRAM GRAPH API (Proceso obligatorio de 2 pasos)
   * @param caption Texto del post / pie de foto en Instagram
   * @param imageUrl URL pública directa de la imagen de Cloudinary
   */
  async publishToInstagram(caption: string, imageUrl: string): Promise<any> {
    const igUserId = process.env.INSTAGRAM_USER_ID;
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!igUserId || !accessToken) {
      this.logger.warn(
        'INSTAGRAM_USER_ID o Access Token no están configurados en .env. Se omite publicación en Instagram.',
      );
      return null;
    }

    try {
      // PASO A: Crear el contenedor de contenido para Instagram
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
        throw new Error('No se recibió el creation_id al crear el contenedor de Instagram.');
      }

      this.logger.log(`Contenedor de Instagram creado exitosamente. Creation ID: ${creationId}`);

      // PASO B: Publicar el contenedor creado
      const publishUrl = `https://graph.facebook.com/v20.0/${igUserId}/media_publish`;
      const publishPayload = {
        creation_id: creationId,
        access_token: accessToken,
      };

      const publishRes = await firstValueFrom(
        this.httpService.post(publishUrl, publishPayload),
      );

      this.logger.log(
        `Publicación en Instagram realizada con éxito. Media ID: ${publishRes.data?.id}`,
      );
      return publishRes.data;
    } catch (error: any) {
      this.logger.error(
        'Error durante el proceso de publicación en Instagram Graph API:',
        error?.response?.data || error.message,
      );
      return null;
    }
  }
}
