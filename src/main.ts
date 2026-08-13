import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar Helmet para cabeceras HTTP defensivas
  app.use(helmet());

  // Aumentar el límite del payload de Express (JSON y URL-Encoded) a 50MB
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Configuración dinámica de CORS según entorno
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://eldiarioinesperado.cl', 'https://www.eldiarioinesperado.cl']
    : ['https://eldiarioinesperado.cl', 'https://www.eldiarioinesperado.cl', 'http://localhost:4200'];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();