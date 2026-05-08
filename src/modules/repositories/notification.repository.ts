import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { NotificationEntity } from 'src/modules/entities/notification.entity';

@Injectable()
export class NotificationRepository extends Repository<NotificationEntity> {
  constructor(private dataSource: DataSource) {
    super(NotificationEntity, dataSource.createEntityManager());
  }

  updateNotificationById = async (id: string, body: any) => {
    await this.update({ id }, body);
  };

  getNotificationById = async (id: string) => {
    return await this.createQueryBuilder('notification')
      .where('notification.id = :id', { id })
      .getOne();
  };
}
