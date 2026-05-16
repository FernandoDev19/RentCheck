import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './core/errors/global-exception-filter';
import cookieParser from 'cookie-parser';

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

  app.use(cookieParser());

  app.setGlobalPrefix('api/v1', {
    exclude: ['docs', 'docs-json', 'docs-yaml'],
  });

  const corsOrigin = process.env.CORS_ORIGIN;
  let origins: string[] | string = [
    "http://localhost:5173",
    "http://localhost:4200",
  ];

  if (corsOrigin) {
    try {
      origins = JSON.parse(corsOrigin);
    } catch {
      origins = corsOrigin.split(",").map((o) => o.trim());
    }
  }

  // Configuración de CORS
  app.enableCors({
    origin: origins,
    allowedHeaders: "Content-Type, Authorization",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set("trust proxy", 1);

  app.use(bodyParser.json());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
