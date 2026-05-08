import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

import { jwtConfig } from 'src/configs/constants';
import IJwtPayload from 'src/auth/payloads/jwt-payload';
import { UserService } from 'src/modules/apis/user/user.service';
import { DtoAuthLoginBody } from 'src/auth/dto/auth-login.dto';
import { EUserStatus } from 'src/common/enums';
import { DtoUserToken } from 'src/auth/dto/token-decode.dto';
import { comparePasswordAndHashPassword } from 'src/common/functions';

import { UserEntity } from 'src/modules/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UserService,
  ) {}

  async logout(req: DtoUserToken) {
    await this.usersService.updateUserToken(req.id, { token: null });
  }

  async login(body: DtoAuthLoginBody) {
    const user = await this.usersService.getUserByUserName(body.username);

    if (!user || user.status === EUserStatus.INACTIVE) {
      throw new BadRequestException('Sai tài khoản hoặc mật khẩu.');
    }

    const isMatch = await comparePasswordAndHashPassword(
      body.password,
      user.password,
    );

    if (isMatch) {
      return await this.returnTokenForUser(user);
    } else {
      throw new BadRequestException('Sai tài khoản hoặc mật khẩu.');
    }
  }

  async returnTokenForUser(user: UserEntity) {
    const { accessToken } = await this.generateTokenLogin({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const token = [...(user.token || []), accessToken];

    await this.usersService.updateUserToken(user.id, { token });

    return { data: { accessToken, status: user.status } };
  }

  async generateTokenLogin(req: DtoUserToken) {
    const accessTokenPayload: IJwtPayload = {
      id: req.id,
      role: req.role,
      email: req.email,
      username: req.username,
      name: req.name,
    };
    const accessTokenOptions: JwtSignOptions = jwtConfig;

    const accessToken = await this.jwtService.signAsync(
      accessTokenPayload,
      accessTokenOptions,
    );

    return { accessToken };
  }
}
