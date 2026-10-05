import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as bodyParser from 'body-parser';

import { appConfig, env } from 'src/configs/constants';
import { AppModule } from 'src/app.module';

process.on('uncaughtException', (error) => {
  console.error(error);
});

process.on('unhandledRejection', (error) => {
  console.error(error);
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const { port } = appConfig;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // the next two lines did the trick
  app.use(bodyParser.json({ limit: '500000mb' }));
  app.use(bodyParser.urlencoded({ limit: '500000mb', extended: true }));

  app.enableCors({
    // origin: env.rootUrl,
    origin: '*',
    methods: 'GET,PUT,POST,PATCH,DELETE',
    credentials: true,
  });

  await app.listen(port || 8000, '0.0.0.0');
  console.log(`App is listening on port ${port || 8000}`);
}
bootstrap();
