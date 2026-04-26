import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Activer CORS pour toutes les origines (ou restreindre à ton frontend)
  app.enableCors({
    origin: 'http://localhost:5173', // autorise uniquement ton frontend Vite
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // si tu utilises cookies / auth
  });
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
