import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AllowPermission } from 'src/common/decorator/permission.decorator';
import { EUserRole } from 'src/common/enums';
import { THeaderRequest } from 'src/common/types';
import { DtoAddCoursesToUserBody } from 'src/modules/apis/user/dto/add-courses-to-user.dto';

import { DtoCreateUserBody } from 'src/modules/apis/user/dto/create-user.dto';
import { DtoDeleteUsersQuery } from 'src/modules/apis/user/dto/delete-users.dto';
import { DtoGetUsersQuery } from 'src/modules/apis/user/dto/get-users.dto';
import { DtoUpdateMyProfilePasswordBody } from 'src/modules/apis/user/dto/update-my-profile-password.dto';
import { DtoUpdateMyProfileBody } from 'src/modules/apis/user/dto/update-my-profile.dto';
import { DtoUpdateUserPasswordBody } from 'src/modules/apis/user/dto/update-user-password.dto';
import { DtoUpdateUserBody } from 'src/modules/apis/user/dto/update-user.dto';
import { UserService } from 'src/modules/apis/user/user.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers(@Query() params: DtoGetUsersQuery) {
    return await this.userService.getUsers(params);
  }

  @Post()
  async createUser(@Body() body: DtoCreateUserBody) {
    return await this.userService.createUser(body);
  }

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() body: DtoUpdateUserBody) {
    return await this.userService.updateUser(id, body);
  }

  @Delete()
  async deleteUsers(
    @Req() req: THeaderRequest,
    @Query() params: DtoDeleteUsersQuery,
  ) {
    const idsArray = params.ids?.split(',') || [];
    return await this.userService.deleteUsers(req?.user, idsArray);
  }

  @Patch(':id/change-password')
  async updateUserPassword(
    @Param('id') id: string,
    @Body() body: DtoUpdateUserPasswordBody,
  ) {
    return await this.userService.updateUserPassword(id, body);
  }

  @Get('my-profile')
  @AllowPermission([EUserRole.STUDENT])
  async getMyProfile(@Req() req: THeaderRequest) {
    return await this.userService.getMyProfile(req?.user);
  }

  @Put('my-profile')
  @AllowPermission([EUserRole.STUDENT])
  async updateMyProfile(
    @Req() header: THeaderRequest,
    @Body() body: DtoUpdateMyProfileBody,
  ) {
    return await this.userService.updateMyProfile(header?.user, body);
  }

  @Put('my-profile/password')
  @AllowPermission([EUserRole.STUDENT])
  async updateMyProfilePassword(
    @Req() header: THeaderRequest,
    @Body() body: DtoUpdateMyProfilePasswordBody,
  ) {
    return await this.userService.updateMyProfilePassword(header?.user, body);
  }

  @Post(':id/add-courses')
  async addCoursesToUser(
    @Param('id') id: string,
    @Body() body: DtoAddCoursesToUserBody,
  ) {
    return await this.userService.addCoursesToUser(id, body);
  }
}
