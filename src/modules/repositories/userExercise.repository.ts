import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { UserExerciseEntity } from 'src/modules/entities/userExercise.entity';

@Injectable()
export class UserExerciseRepository extends Repository<UserExerciseEntity> {
  constructor(private dataSource: DataSource) {
    super(UserExerciseEntity, dataSource.createEntityManager());
  }

  getUserExerciseById = async (id: string) => {
    return await this.createQueryBuilder('userExercise')
      .where('userExercise.id = :id', { id })
      .getOne();
  };
}
