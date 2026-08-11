import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar Helmet para cabeceras HTTP defensivas
  app.use(helmet());

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