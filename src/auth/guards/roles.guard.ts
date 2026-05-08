import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EUserRole } from 'src/common/enums';
import { UserRepository } from 'src/modules/repositories/user.repository';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const { user } = req;

    const arrBearer = req?.headers?.authorization?.split(' ');

    const token = arrBearer[1];

    const iUser = await this.userRepository.getUserById(user.id);

    if (!iUser || !iUser?.token?.includes(token)) {
      throw new UnauthorizedException('Token đã hết hạn');
    }

    const allowPermission =
      this.reflector.get<EUserRole[]>('permissions', context.getHandler()) ||
      [];

    if (
      ![EUserRole.SUPER_ADMIN, EUserRole.MANAGER, ...allowPermission].includes(
        iUser.role,
      )
    ) {
      throw new ForbiddenException(
        'Người dùng không có quyền truy cập tính năng này',
      );
    }

    return true;
  }
}
