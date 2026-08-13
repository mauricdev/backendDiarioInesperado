import { Controller, Get, Header, Res } from '@nestjs/common';
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
}
