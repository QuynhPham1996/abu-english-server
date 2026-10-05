import { Injectable, NotFoundException } from '@nestjs/common';
import { Brackets } from 'typeorm';

import { ELessonType } from 'src/common/enums';
import { commonPagination } from 'src/common/helpers/pagination';
import { parseOrderBy } from 'src/common/helpers/sorter';
import { DtoCreateQuestionGroupBody } from 'src/modules/apis/questionGroup/dto/create-question-group.dto';
import { DtoGetQuestionGroupsQuery } from 'src/modules/apis/questionGroup/dto/get-question-groups.dto';
import { DtoUpdateQuestionGroupBody } from 'src/modules/apis/questionGroup/dto/update-question-group.dto';
import {
  matchSearch,
  paginateStatic,
  staticBankQuestions,
  staticQuestionGroups,
} from 'src/modules/apis/library/library.fixtures';
import { QuestionGroupRepository } from 'src/modules/repositories/questionGroup.repository';
import { QuestionRepository } from 'src/modules/repositories/question.repository';

@Injectable()
export class QuestionGroupService {
  constructor(
    private readonly questionGroupRepository: QuestionGroupRepository,
    private readonly questionRepository: QuestionRepository,
  ) {}

  private async countRootQuestions(groupId: string, type?: ELessonType) {
    const qb = this.questionRepository
      .createQueryBuilder('question')
      .where('question.group = :groupId', { groupId })
      .andWhere('question.parentId IS NULL');

    if (type) {
      qb.andWhere('question.type = :type', { type });
    }

    return qb.getCount();
  }

  async getQuestionGroups(params: DtoGetQuestionGroupsQuery) {
    const total = await this.questionGroupRepository.count();
    if (total === 0) {
      const filtered = staticQuestionGroups.filter(
        (item) =>
          (!params.status || item.status === params.status) &&
          matchSearch(item.name, params.search),
      );
      const dataPaginate = paginateStatic(filtered, params.page, params.pageSize);
      const totalQuestions = {};
      dataPaginate.data.forEach((item) => {
        totalQuestions[item.id] = staticBankQuestions.filter(
          (question) =>
            question.group.id === item.id &&
            (!params.type || question.type === params.type),
        ).length;
      });
      return { ...dataPaginate, totalQuestions };
    }

    const qb = this.questionGroupRepository
      .createQueryBuilder('questionGroup')
      .select([
        'questionGroup.id',
        'questionGroup.name',
        'questionGroup.description',
        'questionGroup.status',
        'questionGroup.createdAt',
        'questionGroup.updatedAt',
      ]);

    if (params.status) {
      qb.andWhere('questionGroup.status = :status', { status: params.status });
    }

    if (params.search) {
      qb.andWhere(
        new Brackets((subQ) => {
          subQ.orWhere('questionGroup.name LIKE :search', {
            search: `%${params.search}%`,
          });
        }),
      );
    }

    const sort = parseOrderBy(params.sort);

    if (sort) {
      const [key, dir] = sort;
      qb.addOrderBy(`questionGroup.${key}`, dir as any);
    } else {
      qb.orderBy('questionGroup.createdAt', 'DESC');
    }

    const dataPaginate = await commonPagination(params, qb);

    const totalQuestions = {};
    for await (const item of dataPaginate?.data) {
      totalQuestions[item.id] = await this.countRootQuestions(
        item.id,
        params.type,
      );
    }

    return { ...dataPaginate, totalQuestions };
  }

  async getQuestionGroup(id: string) {
    const total = await this.questionGroupRepository.count();
    if (total === 0) {
      const data = staticQuestionGroups.find((item) => item.id === id);
      if (!data) {
        throw new NotFoundException('Không tìm thấy nhóm câu hỏi trong hệ thống.');
      }
      const totalQuestions = staticBankQuestions.filter(
        (question) => question.group.id === id,
      ).length;
      return { data, totalQuestions };
    }

    const data = await this.questionGroupRepository
      .createQueryBuilder('questionGroup')
      .select([
        'questionGroup.id',
        'questionGroup.name',
        'questionGroup.description',
        'questionGroup.status',
        'questionGroup.createdAt',
        'questionGroup.updatedAt',
      ])
      .where('questionGroup.id = :id', { id })
      .getOne();

    if (!data) {
      throw new NotFoundException('Không tìm thấy nhóm câu hỏi trong hệ thống.');
    }

    const totalQuestions = await this.questionRepository.count({
      where: { group: id },
    });

    return { data, totalQuestions };
  }

  async createQuestionGroup(body: DtoCreateQuestionGroupBody) {
    const bodyParse = {
      name: body?.name,
      description: body?.description,
      status: body?.status,
    };

    const data = await this.questionGroupRepository.save(bodyParse);

    return { data };
  }

  async updateQuestionGroup(id: string, body: DtoUpdateQuestionGroupBody) {
    const data = await this.questionGroupRepository.getQuestionGroupById(id);

    if (!data) {
      throw new NotFoundException('Không tìm thấy nhóm câu hỏi trong hệ thống.');
    }

    const bodyParse = {
      name: body?.name,
      description: body?.description,
      status: body?.status,
    };

    await this.questionGroupRepository.updateQuestionGroupById(id, bodyParse);
  }

  async deleteQuestionGroups(ids: string[]) {
    if (ids.length > 0) {
      await this.questionGroupRepository
        .createQueryBuilder('questionGroup')
        .delete()
        .where('questionGroup.id IN (:...ids)', { ids })
        .execute();
    }
  }
}
