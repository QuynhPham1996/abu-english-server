import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { UserLessonEntity } from 'src/modules/entities/userLesson.entity';

@Injectable()
export class UserLessonRepository extends Repository<UserLessonEntity> {
  constructor(private dataSource: DataSource) {
    super(UserLessonEntity, dataSource.createEntityManager());
  }

  updateUserLessonById = async (id: string, body: any) => {
    await this.update({ id }, body);
  };

  getUserLessonById = async (id: string) => {
    return await this.createQueryBuilder('userLesson')
      .where('userLesson.id = :id', { id })
      .getOne();
  };
}
