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

  findChildren = async (parentIds: string[]) => {
    if (parentIds.length === 0) return [];

    return await this.createQueryBuilder('question')
      .where('question.parentId IN (:...parentIds)', { parentIds })
      .orderBy('question.index', 'ASC')
      .getMany();
  };
}

export const nestQuestions = <
  T extends { id: string; parentId?: string; index?: number },
>(
  questions: T[] = [],
): Array<T & { children: T[] }> => {
  const childrenByParent = new Map<string, T[]>();
  const roots: T[] = [];

  questions.forEach((question) => {
    if (question.parentId) {
      const list = childrenByParent.get(question.parentId) || [];
      list.push(question);
      childrenByParent.set(question.parentId, list);
      return;
    }

    roots.push(question);
  });

  return roots
    .sort((left, right) => (left.index || 0) - (right.index || 0))
    .map((question) => ({
      ...question,
      children: (childrenByParent.get(question.id) || []).sort(
        (left, right) => (left.index || 0) - (right.index || 0),
      ),
    }));
};
