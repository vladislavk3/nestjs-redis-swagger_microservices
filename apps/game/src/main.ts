import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthGuard } from './auth.guard';

async function bootstrap() {
  // Set error on prod
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DNS,
    });
  }

  const app = await NestFactory.create(AppModule);
  app.useGlobalGuards(new AuthGuard());
  app.enableShutdownHooks();

  await app.listenAsync(3000);
}
bootstrap();
