import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brackets } from 'typeorm';

import { ELessonType } from 'src/common/enums';
import { commonPagination } from 'src/common/helpers/pagination';
import { parseOrderBy } from 'src/common/helpers/sorter';
import {
  DtoCreateQuestionBankBody,
  DtoQuestionBankChildBody,
} from 'src/modules/apis/questionBank/dto/create-question-bank.dto';
import { DtoGetQuestionBankQuery } from 'src/modules/apis/questionBank/dto/get-question-bank.dto';
import { DtoUpdateQuestionBankBody } from 'src/modules/apis/questionBank/dto/update-question-bank.dto';
import { QuestionGroupRepository } from 'src/modules/repositories/questionGroup.repository';
import { QuestionRepository } from 'src/modules/repositories/question.repository';

@Injectable()
export class QuestionBankService {
  constructor(
    private readonly questionRepository: QuestionRepository,
    private readonly questionGroupRepository: QuestionGroupRepository,
  ) {}

  private async getNextIndex(groupId: string) {
    const qb = await this.questionRepository
      .createQueryBuilder('question')
      .select('question.index')
      .where('question.group = :groupId', { groupId })
      .andWhere('question.parentId IS NULL')
      .getRawMany();

    const indexes = qb.map((item) => item.question_index);
    return indexes.length > 0 ? Math.max(...indexes) + 1 : 1;
  }

  async getQuestions(params: DtoGetQuestionBankQuery) {
    const qb = this.questionRepository
      .createQueryBuilder('question')
      .leftJoin('question.group', 'questionGroup')
      .select([
        'question.id',
        'question.question',
        'question.index',
        'question.answers',
        'question.note',
        'question.type',
        'question.createdAt',
        'question.updatedAt',
        'questionGroup.id',
        'questionGroup.name',
      ])
      .where('question.group IS NOT NULL')
      .andWhere('question.parentId IS NULL');

    if (params.groupId) {
      qb.andWhere('question.group = :groupId', { groupId: params.groupId });
    }

    if (params.type) {
      qb.andWhere('question.type = :type', { type: params.type });
    }

    if (params.search) {
      qb.andWhere(
        new Brackets((subQ) => {
          subQ.orWhere('question.question LIKE :search', {
            search: `%${params.search}%`,
          });
        }),
      );
    }

    const sort = parseOrderBy(params.sort);

    if (sort) {
      const [key, dir] = sort;
      const [relationField, relationKey] = key.split('.');

      if (relationField && relationKey) {
        qb.addOrderBy(`${relationField}.${relationKey}`, dir as any);
      } else {
        qb.addOrderBy(`question.${key}`, dir as any);
      }
    } else {
      qb.orderBy('question.createdAt', 'DESC');
    }

    const page = await commonPagination(params, qb);
    page.data = await this.attachChildren(page.data);
    return page;
  }

  async getQuestion(id: string) {
    const data = await this.questionRepository
      .createQueryBuilder('question')
      .leftJoin('question.group', 'questionGroup')
      .select([
        'question.id',
        'question.question',
        'question.index',
        'question.answers',
        'question.note',
        'question.type',
        'question.createdAt',
        'question.updatedAt',
        'questionGroup.id',
        'questionGroup.name',
      ])
      .where('question.id = :id', { id })
      .andWhere('question.group IS NOT NULL')
      .andWhere('question.parentId IS NULL')
      .getOne();

    if (!data) {
      throw new NotFoundException('Không tìm thấy câu hỏi trong ngân hàng.');
    }

    const [question] = await this.attachChildren([data]);
    return { data: question };
  }

  async createQuestion(body: DtoCreateQuestionBankBody) {
    const group = await this.questionGroupRepository.getQuestionGroupById(
      body.group,
    );

    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm câu hỏi trong hệ thống.');
    }

    this.assertChildren(body.children, body.type, body.answers);

    const saved = await this.questionRepository.save({
      question: body?.question,
      answers: body.children?.length ? null : body?.answers,
      note: body?.note,
      type: body?.type,
      group: body?.group,
      index: await this.getNextIndex(body.group),
    });

    await this.replaceChildren(saved.id, body.group, body.children || []);
  }

  async updateQuestion(id: string, body: DtoUpdateQuestionBankBody) {
    const data = await this.questionRepository
      .createQueryBuilder('question')
      .where('question.id = :id', { id })
      .andWhere('question.group IS NOT NULL')
      .getOne();

    if (!data) {
      throw new NotFoundException('Không tìm thấy câu hỏi trong ngân hàng.');
    }

    if (body.group) {
      const group = await this.questionGroupRepository.getQuestionGroupById(
        body.group,
      );
      if (!group) {
        throw new NotFoundException(
          'Không tìm thấy nhóm câu hỏi trong hệ thống.',
        );
      }
    }

    const nextType = body.type || data.type;
    const nextAnswers = body.children?.length ? null : body.answers ?? data.answers;
    this.assertChildren(body.children, nextType, nextAnswers);

    await this.questionRepository.updateQuestionById(id, {
      question: body?.question,
      answers: body.children?.length ? null : body?.answers,
      note: body?.note,
      type: body?.type,
      group: body?.group,
    });

    if (body.children) {
      await this.replaceChildren(id, body.group || (data.group as any), body.children);
    }
  }

  async deleteQuestions(ids: string[]) {
    if (ids.length === 0) return;

    await this.questionRepository
      .createQueryBuilder()
      .delete()
      .where('id IN (:...ids) OR parentId IN (:...ids)', { ids })
      .execute();
  }

  private assertChildren(
    children: DtoQuestionBankChildBody[] = [],
    parentType?: ELessonType,
    parentAnswers?: DtoCreateQuestionBankBody['answers'],
  ) {
    if (children.length === 0 && parentType === ELessonType.MULTIPLE_CHOICE) {
      const hasCorrect = parentAnswers?.some((answer) => answer.isCorrect);
      if (!parentAnswers || parentAnswers.length < 2 || !hasCorrect) {
        throw new BadRequestException(
          'Câu trắc nghiệm cần ít nhất 2 đáp án và 1 đáp án đúng.',
        );
      }
    }

    children.forEach((child, index) => {
      if (child.type === ELessonType.MULTIPLE_CHOICE) {
        const hasCorrect = child.answers?.some((answer) => answer.isCorrect);
        if (!child.answers || child.answers.length < 2 || !hasCorrect) {
          throw new BadRequestException(
            `Câu hỏi con ${index + 1} cần ít nhất 2 đáp án và 1 đáp án đúng.`,
          );
        }
      }
    });
  }

  private async attachChildren(questions: any[]) {
    if (!questions?.length) return questions || [];

    const children = await this.questionRepository.findChildren(
      questions.map((item) => item.id),
    );
    const childrenByParent = new Map<string, any[]>();
    children.forEach((child) => {
      const list = childrenByParent.get(child.parentId) || [];
      list.push(child);
      childrenByParent.set(child.parentId, list);
    });

    return questions.map((question) => ({
      ...question,
      children: childrenByParent.get(question.id) || [],
    }));
  }

  private async replaceChildren(
    parentId: string,
    groupId: string,
    children: DtoQuestionBankChildBody[],
  ) {
    const current = await this.questionRepository.findChildren([parentId]);
    const keepIds = new Set(children.map((child) => child.id).filter(Boolean));
    const removedIds = current
      .map((child) => child.id)
      .filter((id) => !keepIds.has(id));

    if (removedIds.length > 0) {
      await this.questionRepository.delete(removedIds);
    }

    for (const [index, child] of children.entries()) {
      const payload = {
        question: child.question,
        answers: child.type === ELessonType.MULTIPLE_CHOICE ? child.answers : null,
        note: child.note,
        type: child.type,
        index: index + 1,
        group: groupId,
        parentId,
      };

      if (child.id && current.some((item) => item.id === child.id)) {
        await this.questionRepository.updateQuestionById(child.id, payload);
      } else {
        await this.questionRepository.save(payload);
      }
    }
  }
}
