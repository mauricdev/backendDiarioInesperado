import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // HABILITAR CORS AQUÍ
  app.enableCors({
    origin: [
      'https://eldiarioinesperado.cl',
      'https://www.eldiarioinesperado.cl',
      'http://localhost:4200' // Por si usas Angular localmente
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();