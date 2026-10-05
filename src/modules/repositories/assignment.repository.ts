import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { AssignmentEntity } from 'src/modules/entities/assignment.entity';

@Injectable()
export class AssignmentRepository extends Repository<AssignmentEntity> {
  constructor(private dataSource: DataSource) {
    super(AssignmentEntity, dataSource.createEntityManager());
  }

  updateAssignmentById = async (id: string, body: any) => {
    await this.update({ id }, body);
  };

  getAssignmentById = async (id: string) => {
    return await this.createQueryBuilder('assignment')
      .where('assignment.id = :id', { id })
      .getOne();
  };
}
