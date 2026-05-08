import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { ExerciseEntity } from 'src/modules/entities/exercise.entity';

@Injectable()
export class ExerciseRepository extends Repository<ExerciseEntity> {
  constructor(private dataSource: DataSource) {
    super(ExerciseEntity, dataSource.createEntityManager());
  }

  updateExerciseById = async (id: string, body: any) => {
    await this.update({ id }, body);
  };

  getExerciseById = async (id: string) => {
    return await this.createQueryBuilder('exercise')
      .where('exercise.id = :id', { id })
      .getOne();
  };
}
