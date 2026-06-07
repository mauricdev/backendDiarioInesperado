import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  async generarNoticia(tema: string, contextoAutor: string): Promise<any> {
    const modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    const model = this.genAI.getGenerativeModel({ model: modelName });

    const prompt = `Eres un escritor para un diario. Tu biografía y personalidad es: ${contextoAutor}. Escribe una noticia completa sobre este tema: ${tema}. Debes responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura: { "title": "título llamativo", "content": "contenido detallado en formato Markdown respetando tu personalidad", "socialSummary": "un párrafo corto y gancho para redes sociales", "imageKeyword": "2 o 3 palabras clave en inglés muy visuales y precisas que representen la noticia, optimizadas para buscar en Unsplash" }. No incluyas comillas invertidas de Markdown en tu respuesta JSON, solo el objeto puro.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Limpieza por si Gemini incluye bloques de código markdown JSON
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }

    return JSON.parse(text);
  }
}
