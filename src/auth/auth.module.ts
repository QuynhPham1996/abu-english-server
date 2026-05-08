import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { FeaturesModule } from 'src/modules/features.module';
import { jwtConfig } from 'src/configs/constants';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { UserRepository } from 'src/modules/repositories/user.repository';
import { MailersService } from 'src/modules/apis/mailers/mailers.service';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConfig.secret,
      signOptions: {
        expiresIn: jwtConfig.expiresIn,
      },
    }),
    PassportModule,
    FeaturesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, UserRepository, MailersService],
  exports: [AuthService],
})
export class AuthModule {}
