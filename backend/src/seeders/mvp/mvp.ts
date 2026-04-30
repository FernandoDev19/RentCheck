import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { MvpDataService } from './mvp-data.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const seedService = app.get(MvpDataService);

  await seedService.run();

  await app.close();
}

void bootstrap();
