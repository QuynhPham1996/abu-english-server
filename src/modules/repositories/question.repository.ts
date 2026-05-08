import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { QuestionEntity } from 'src/modules/entities/question.entity';

@Injectable()
export class QuestionRepository extends Repository<QuestionEntity> {
  constructor(private dataSource: DataSource) {
    super(QuestionEntity, dataSource.createEntityManager());
  }

  updateQuestionById = async (id: string, body: any) => {
    await this.update({ id }, body);
  };

  getQuestionById = async (id: string) => {
    return await this.createQueryBuilder('question')
      .where('question.id = :id', { id })
      .getOne();
  };
}
