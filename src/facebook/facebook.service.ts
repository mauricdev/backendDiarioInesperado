import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Publica un mensaje (y link opcional) en la Fanpage de Facebook mediante la Graph API.
   * @param message Texto del post (título, descripción, emojis)
   * @param link URL opcional hacia la noticia en el sitio web
   */
  async publishToPage(message: string, link?: string): Promise<any> {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageId || !accessToken) {
      this.logger.warn(
        'Facebook Page ID o Access Token no están configurados en el archivo .env. Se omite la publicación automática.',
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
      this.logger.log(
        `Noticia publicada con éxito en la Fanpage de Facebook. ID del post: ${response.data?.id}`,
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Falló la publicación en Facebook Graph API:',
        error?.response?.data || error.message,
      );
      // No lanzamos la excepción para evitar que el fallo de Facebook impida guardar la noticia en NestJS
      return null;
    }
  }
}
