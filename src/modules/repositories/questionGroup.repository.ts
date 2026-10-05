import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { QuestionGroupEntity } from 'src/modules/entities/questionGroup.entity';

@Injectable()
export class QuestionGroupRepository extends Repository<QuestionGroupEntity> {
  constructor(private dataSource: DataSource) {
    super(QuestionGroupEntity, dataSource.createEntityManager());
  }

  updateQuestionGroupById = async (id: string, body: any) => {
    await this.update({ id }, body);
  };

  getQuestionGroupById = async (id: string) => {
    return await this.createQueryBuilder('questionGroup')
      .where('questionGroup.id = :id', { id })
      .getOne();
  };
}
