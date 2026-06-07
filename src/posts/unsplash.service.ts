import { Injectable } from '@nestjs/common';

@Injectable()
export class UnsplashService {
  async buscarImagenes(query: string, page: number = 1, perPage: number = 6) {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY || '';
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Client-ID ${accessKey}`
        }
      });
      const data = await response.json();
      if (!data.results) return [];
      return data.results.map((img: any) => ({
        id: img.id,
        url: img.urls.regular,
        credit: img.user.name
      }));
    } catch (error) {
      console.error('Error fetching from Unsplash:', error);
      return [];
    }
  }
}
