import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { TestEntity } from 'src/modules/entities/test.entity';

@Injectable()
export class TestRepository extends Repository<TestEntity> {
  constructor(private dataSource: DataSource) {
    super(TestEntity, dataSource.createEntityManager());
  }

  updateTestById = async (id: string, body: any) => {
    await this.update({ id }, body);
  };

  getTestById = async (id: string) => {
    return await this.createQueryBuilder('test')
      .where('test.id = :id', { id })
      .getOne();
  };
}
