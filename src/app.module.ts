import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

import { databaseConfig, mailConfig } from 'src/configs/constants';
import { AuthModule } from 'src/auth/auth.module';
import { FeaturesModule } from 'src/modules/features.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    MailerModule.forRoot({
      transport: {
        host: mailConfig.host,
        port: Number(mailConfig.port),
        auth: {
          type: 'OAuth2',
          user: mailConfig.user,
          pass: mailConfig.pass,
          clientId: mailConfig.clientId,
          clientSecret: mailConfig.clientSecret,
          refreshToken: mailConfig.refreshToken,
        },
      },
      template: {
        dir: 'templates',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 50,
    }),
    AuthModule,
    FeaturesModule,
  ],
})
export class AppModule {}
