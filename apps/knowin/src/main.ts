import * as Sentry from '@sentry/node';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as rateLimit from 'express-rate-limit';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { TransformInterceptor, StatusCodesService } from 'knowin/status-codes';

// @ts-ignore
import * as helmet from 'helmet';

import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ValidationFilter } from './validation.filter';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // Set error on prod
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DNS,
    });
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new ValidationFilter());
  app.useWebSocketAdapter(new WsAdapter(app));

  app.enableCors();
  app.use(helmet());

  // Our response code transform interceptor add at last
  app.useGlobalInterceptors(new TransformInterceptor(new StatusCodesService()));

  app.use(
    '/public',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
    }),
  );

  //app.use(
  //'/auth/login',
  //rateLimit({
  //windowMs: 15 * 60 * 1000,
  //max: 5,
  //}),
  //);

  const options = new DocumentBuilder()
    .setTitle('Quiz Backend')
    .setDescription('The Quiz api description')
    .addBearerAuth()
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(8000);
}
bootstrap();
