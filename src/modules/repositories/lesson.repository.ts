import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { LessonEntity } from 'src/modules/entities/lesson.entity';

@Injectable()
export class LessonRepository extends Repository<LessonEntity> {
  constructor(private dataSource: DataSource) {
    super(LessonEntity, dataSource.createEntityManager());
  }

  updateLessonById = async (id: string, body: any) => {
    await this.update({ id }, body);
  };

  getLessonById = async (id: string) => {
    return await this.createQueryBuilder('lesson')
      .where('lesson.id = :id', { id })
      .getOne();
  };
}
