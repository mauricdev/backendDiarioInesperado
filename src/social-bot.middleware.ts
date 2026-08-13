import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from './prisma.service';

@Injectable()
export class SocialBotMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const userAgent = req.headers['user-agent'] || '';
    const isSocialBot = /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Pinterest|TelegramBot/i.test(userAgent);

    // Búsqueda de coincidencia exacta con /noticia/:id o /posts/:id
    const match = req.path.match(/\/noticia\/(\d+)/) || req.path.match(/\/posts\/(\d+)/);

    if (isSocialBot && match) {
      const postId = parseInt(match[1], 10);
      const post = await this.prisma.post.findUnique({ where: { id: postId } });

      if (post) {
        const title = `${post.title} | El Diario Inesperado`;
        const description = post.socialSummary || post.description || 'Crónicas insólitas en El Diario Inesperado.';
        const image = post.imageUrl || 'https://www.eldiarioinesperado.cl/assets/social-card-default.png';
        const frontendUrl = `https://www.eldiarioinesperado.cl/noticia/${postId}`;

        // Generamos la respuesta de precarga HTML exclusiva para el Crawler
        const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(title)}</title>
  <meta name="description" content="${this.escapeHtml(description)}">
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="El Diario Inesperado">
  <meta property="og:title" content="${this.escapeHtml(title)}">
  <meta property="og:description" content="${this.escapeHtml(description)}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${frontendUrl}">

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${this.escapeHtml(title)}">
  <meta name="twitter:description" content="${this.escapeHtml(description)}">
  <meta name="twitter:image" content="${image}">
</head>
<body>
  <h1>${this.escapeHtml(post.title)}</h1>
  <p>${this.escapeHtml(description)}</p>
  <img src="${image}" alt="${this.escapeHtml(post.title)}" />
</body>
</html>`;

        return res.status(200).header('Content-Type', 'text/html; charset=utf-8').send(html);
      }
    }

    next();
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
