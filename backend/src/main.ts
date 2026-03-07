import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { MvpDataService } from './seeders/mvp-data/mvp-data.service';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const mvpDataService = app.get(MvpDataService);
  await mvpDataService.run();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

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
bootstrap();
