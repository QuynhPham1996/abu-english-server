import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AllowPermission } from 'src/common/decorator/permission.decorator';
import { EUserRole } from 'src/common/enums';
import { THeaderRequest } from 'src/common/types';
import { DtoCreateNotificationBody } from 'src/modules/apis/notification/dto/create-notification.dto';

import { DtoGetNotificationsQuery } from 'src/modules/apis/notification/dto/get-notifications.dto';
import { DtoUpdateNotificationBody } from 'src/modules/apis/notification/dto/update-notification.dto';
import { NotificationService } from 'src/modules/apis/notification/notification.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @AllowPermission([EUserRole.STUDENT])
  async getNotifications(
    @Req() req: THeaderRequest,
    @Query() params: DtoGetNotificationsQuery,
  ) {
    return await this.notificationService.getNotifications(req?.user, params);
  }

  @Post()
  async createNotification(
    @Req() req: THeaderRequest,
    @Body() body: DtoCreateNotificationBody,
  ) {
    return await this.notificationService.createNotification(req?.user, body);
  }

  @Patch(':id')
  @AllowPermission([EUserRole.STUDENT])
  async updateNotification(
    @Param('id') id: string,
    @Body() body: DtoUpdateNotificationBody,
  ) {
    return await this.notificationService.updateNotification(id, body);
  }
}
