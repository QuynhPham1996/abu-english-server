import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { CourseEntity } from 'src/modules/entities/course.entity';

@Injectable()
export class CourseRepository extends Repository<CourseEntity> {
  constructor(private dataSource: DataSource) {
    super(CourseEntity, dataSource.createEntityManager());
  }

  updateCourseById = async (id: string, body: any) => {
    await this.update({ id }, body);
  };

  getCourseById = async (id: string) => {
    return await this.createQueryBuilder('course')
      .where('course.id = :id', { id })
      .getOne();
  };
}
