import { Controller, Get, Header, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  async getSitemap(@Res() res: Response) {
    const frontendUrl = 'https://www.eldiarioinesperado.cl';

    // Consultamos únicamente los artículos publicados
    const posts = await this.prisma.post.findMany({
      where: { published: true },
      select: { id: true, createdAt: true },
      orderBy: { id: 'desc' },
    });

    const urlsXml = posts
      .map(
        (post) => `
    <url>
      <loc>${frontendUrl}/noticia/${post.id}</loc>
      <lastmod>${new Date(post.createdAt).toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>`,
      )
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${frontendUrl}</loc>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>${urlsXml}
</urlset>`;

    return res.status(200).send(xml);
  }

  @Get('noticia/:id')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async getNoticiaOgHtml(@Param('id') id: string, @Res() res: Response) {
    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      throw new NotFoundException('ID de noticia inválido');
    }

    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Noticia no encontrada');
    }

    const title = `${post.title} | El Diario Inesperado`;
    const description = post.socialSummary || post.description || 'Crónicas insólitas en El Diario Inesperado.';
    const image = post.imageUrl || 'https://www.eldiarioinesperado.cl/assets/social-card-default.png';
    const frontendUrl = `https://www.eldiarioinesperado.cl/noticia/${postId}`;

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

    return res.status(200).send(html);
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
