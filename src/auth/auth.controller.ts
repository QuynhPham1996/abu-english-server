import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from 'src/auth/auth.service';
import { DtoAuthLoginBody } from 'src/auth/dto/auth-login.dto';

import { THeaderRequest } from 'src/common/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() data: DtoAuthLoginBody) {
    return await this.authService.login(data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Req() req: THeaderRequest) {
    return await this.authService.logout(req?.user);
  }
}
