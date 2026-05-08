import { Injectable, NotFoundException } from '@nestjs/common';
import { DtoUserToken } from 'src/auth/dto/token-decode.dto';

import { commonPagination } from 'src/common/helpers/pagination';
import { env } from 'src/configs/constants';
import { MailersService } from 'src/modules/apis/mailers/mailers.service';

import { DtoCreateNotificationBody } from 'src/modules/apis/notification/dto/create-notification.dto';
import { DtoGetNotificationsQuery } from 'src/modules/apis/notification/dto/get-notifications.dto';
import { DtoUpdateNotificationBody } from 'src/modules/apis/notification/dto/update-notification.dto';
import { NotificationRepository } from 'src/modules/repositories/notification.repository';
import { UserRepository } from 'src/modules/repositories/user.repository';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly userRepository: UserRepository,
    private readonly mailersService: MailersService,
  ) {}

  async getNotifications(user: DtoUserToken, params: DtoGetNotificationsQuery) {
    const qb = await this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoin('notification.fromUser', 'fromUser')
      .leftJoin('notification.toUser', 'toUser')
      .leftJoin('fromUser.courses', 'fromUserCourses')
      .select([
        'notification.id',
        'notification.message',
        'notification.type',
        'notification.isRead',
        'notification.createdAt',
        'notification.updatedAt',
        'notification.data',
        'fromUser.id',
        'fromUser.name',
        'fromUser.avatar',
        'toUser.id',
        'toUser.name',
        'toUser.avatar',
        'fromUserCourses.id',
        'fromUserCourses.name',
      ])
      .where('toUser.id = :id', { id: user.id })
      .orderBy('notification.createdAt', 'DESC');

    const totalUnread = await this.notificationRepository
      .createQueryBuilder('notification')
      .where('toUser = :id', { id: user.id })
      .andWhere('notification.isRead = :isRead', {
        isRead: false,
      })
      .getCount();

    const dataPaginate = await commonPagination(params, qb);

    return {
      ...dataPaginate,
      totalUnread,
    };
  }

  async createNotification(
    user: DtoUserToken,
    body: DtoCreateNotificationBody,
  ) {
    const bodyParse = {
      message: body.message,
      fromUser: user.id,
      toUser: body.toUser,
      type: body.type,
    };

    await this.notificationRepository.save(bodyParse);

    if (body?.isSendEmail) {
      const toUserData = await this.userRepository.getUserById(
        bodyParse.toUser,
      );

      if (toUserData && toUserData.email) {
        this.mailersService.sendMailNotificationMessage({
          emails: [toUserData.email],
          message: bodyParse.message,
          buttonLink: `${env.rootUrl}`,
        });
      }
    }
  }

  async updateNotification(id: string, body: DtoUpdateNotificationBody) {
    const data = await this.notificationRepository.getNotificationById(id);

    if (data) {
      const bodyParse = {
        isRead: body.isRead,
      };
      await this.notificationRepository.updateNotificationById(
        data?.id,
        bodyParse,
      );
    } else {
      throw new NotFoundException('Không tìm thấy thông báo trong hệ thống.');
    }
  }
}
