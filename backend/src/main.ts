import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './core/errors/global-exception-filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.setGlobalPrefix('api/v1', {
    exclude: ['docs', 'docs-json', 'docs-yaml'],
  });

  const origins = (JSON.parse(process.env.CORS_ORIGIN || '[]') as string[]) || [
    'http://localhost:5173',
    'http://localhost:4200',
  ];

  // Configuración de CORS
  app.enableCors({
    origin: origins,
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.use(bodyParser.json());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
