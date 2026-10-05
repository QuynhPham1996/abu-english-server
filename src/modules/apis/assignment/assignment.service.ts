import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brackets } from 'typeorm';

import { commonPagination } from 'src/common/helpers/pagination';
import { parseOrderBy } from 'src/common/helpers/sorter';
import { DtoAddAssignmentGroupBody } from 'src/modules/apis/assignment/dto/add-assignment-group.dto';
import { DtoAddAssignmentQuestionsBody } from 'src/modules/apis/assignment/dto/add-assignment-questions.dto';
import { DtoCreateAssignmentBody } from 'src/modules/apis/assignment/dto/create-assignment.dto';
import { DtoGetAssignmentsQuery } from 'src/modules/apis/assignment/dto/get-assignments.dto';
import { DtoUpdateAssignmentBody } from 'src/modules/apis/assignment/dto/update-assignment.dto';
import { DtoUpdateAssignmentQuestionsIndexBody } from 'src/modules/apis/assignment/dto/update-assignment-questions-index.dto';
import {
  matchSearch,
  paginateStatic,
  staticAssignments,
} from 'src/modules/apis/library/library.fixtures';
import { AssignmentRepository } from 'src/modules/repositories/assignment.repository';
import { QuestionGroupRepository } from 'src/modules/repositories/questionGroup.repository';
import {
  nestQuestions,
  QuestionRepository,
} from 'src/modules/repositories/question.repository';
import { QuestionEntity } from 'src/modules/entities/question.entity';

@Injectable()
export class AssignmentService {
  constructor(
    private readonly assignmentRepository: AssignmentRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly questionGroupRepository: QuestionGroupRepository,
  ) {}

  private async getNextQuestionIndex(assignmentId: string) {
    const qb = await this.questionRepository
      .createQueryBuilder('question')
      .select('question.index')
      .where('question.assignment = :assignmentId', { assignmentId })
      .getRawMany();

    const indexes = qb.map((item) => item.question_index);
    return indexes.length > 0 ? Math.max(...indexes) + 1 : 1;
  }

  private async findCopiedRoots(assignmentId: string, sourceIds: string[]) {
    if (sourceIds.length === 0) return [];

    return await this.questionRepository
      .createQueryBuilder('question')
      .select(['question.id', 'question.sourceQuestionId'])
      .where('question.assignment = :assignmentId', { assignmentId })
      .andWhere('question.parentId IS NULL')
      .andWhere('question.sourceQuestionId IN (:...sourceIds)', { sourceIds })
      .getMany();
  }

  private async copyMissingChildren(
    source: QuestionEntity,
    assignmentId: string,
    parentCopyId: string,
  ) {
    const children = await this.questionRepository.findChildren([source.id]);
    if (children.length === 0) return 0;

    const existed = await this.questionRepository
      .createQueryBuilder('question')
      .select(['question.id', 'question.sourceQuestionId'])
      .where('question.assignment = :assignmentId', { assignmentId })
      .andWhere('question.sourceQuestionId IN (:...sourceIds)', {
        sourceIds: children.map((child) => child.id),
      })
      .getMany();
    const existedIds = new Set(existed.map((item) => item.sourceQuestionId));
    const missing = children.filter((child) => !existedIds.has(child.id));
    if (missing.length === 0) return 0;

    const currentChildren = await this.questionRepository.findChildren([
      parentCopyId,
    ]);
    let nextIndex = currentChildren.reduce(
      (max, item) => Math.max(max, item.index || 0),
      0,
    );

    await this.questionRepository.save(
      missing.map((child) => {
        nextIndex += 1;
        return {
          question: child.question,
          answers: child.answers,
          note: child.note,
          type: child.type,
          index: nextIndex,
          sourceQuestionId: child.id,
          parentId: parentCopyId,
          assignment: assignmentId,
        };
      }),
    );

    return missing.length;
  }

  private async copyQuestionTree(
    source: QuestionEntity,
    target: { assignment: string; index: number },
  ) {
    const parent = await this.questionRepository.save({
      question: source.question,
      answers: source.answers,
      note: source.note,
      type: source.type,
      index: target.index,
      sourceQuestionId: source.id,
      assignment: target.assignment,
    });
    const children = await this.questionRepository.findChildren([source.id]);

    if (children.length > 0) {
      await this.questionRepository.save(
        children.map((child, index) => ({
          question: child.question,
          answers: child.answers,
          note: child.note,
          type: child.type,
          index: index + 1,
          sourceQuestionId: child.id,
          parentId: parent.id,
          assignment: target.assignment,
        })),
      );
    }
  }

  async getAssignments(params: DtoGetAssignmentsQuery) {
    const total = await this.assignmentRepository.count();
    if (total === 0) {
      const filtered = staticAssignments.filter(
        (item) =>
          (!params.status || item.status === params.status) &&
          (!params.type || item.type === params.type) &&
          matchSearch(item.name, params.search),
      );
      const dataPaginate = paginateStatic(
        filtered.map(({ questions, ...item }) => item),
        params.page,
        params.pageSize,
      );
      const totalQuestions = {};
      dataPaginate.data.forEach((item) => {
        totalQuestions[item.id] =
          staticAssignments.find((assignment) => assignment.id === item.id)
            ?.questions.length || 0;
      });
      return { ...dataPaginate, totalQuestions };
    }

    const qb = this.assignmentRepository
      .createQueryBuilder('assignment')
      .select([
        'assignment.id',
        'assignment.name',
        'assignment.type',
        'assignment.arrange',
        'assignment.status',
        'assignment.createdAt',
        'assignment.updatedAt',
      ]);

    if (params.status) {
      qb.andWhere('assignment.status = :status', { status: params.status });
    }

    if (params.type) {
      qb.andWhere('assignment.type = :type', { type: params.type });
    }

    if (params.search) {
      qb.andWhere(
        new Brackets((subQ) => {
          subQ.orWhere('assignment.name LIKE :search', {
            search: `%${params.search}%`,
          });
        }),
      );
    }

    const sort = parseOrderBy(params.sort);

    if (sort) {
      const [key, dir] = sort;
      qb.addOrderBy(`assignment.${key}`, dir as any);
    } else {
      qb.orderBy('assignment.createdAt', 'DESC');
    }

    const dataPaginate = await commonPagination(params, qb);

    const totalQuestions = {};
    for await (const item of dataPaginate?.data) {
      totalQuestions[item.id] = await this.questionRepository.count({
        where: { assignment: item.id },
      });
    }

    return { ...dataPaginate, totalQuestions };
  }

  async getAssignment(id: string) {
    const total = await this.assignmentRepository.count();
    if (total === 0) {
      const data = staticAssignments.find((item) => item.id === id);
      if (!data) {
        throw new NotFoundException('Không tìm thấy bài tập trong hệ thống.');
      }
      return { data };
    }

    const data = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin('assignment.questions', 'questions')
      .select([
        'assignment.id',
        'assignment.name',
        'assignment.type',
        'assignment.arrange',
        'assignment.status',
        'assignment.createdAt',
        'assignment.updatedAt',
        'questions.id',
        'questions.question',
        'questions.index',
        'questions.note',
        'questions.answers',
        'questions.type',
        'questions.sourceQuestionId',
        'questions.parentId',
        'questions.type',
      ])
      .where('assignment.id = :id', { id })
      .orderBy('questions.index', 'ASC')
      .getOne();

    if (!data) {
      throw new NotFoundException('Không tìm thấy bài tập trong hệ thống.');
    }

    data.questions = nestQuestions(data.questions || []) as any;
    return { data };
  }

  async createAssignment(body: DtoCreateAssignmentBody) {
    const bodyParse = {
      name: body?.name,
      type: body?.type,
      arrange: body?.arrange,
      status: body?.status,
    };

    await this.assignmentRepository.save(bodyParse);
  }

  async updateAssignment(id: string, body: DtoUpdateAssignmentBody) {
    const data = await this.assignmentRepository.getAssignmentById(id);

    if (!data) {
      throw new NotFoundException('Không tìm thấy bài tập trong hệ thống.');
    }

    const bodyParse = {
      name: body?.name,
      arrange: body?.arrange,
      status: body?.status,
    };

    await this.assignmentRepository.updateAssignmentById(id, bodyParse);
  }

  async deleteAssignments(ids: string[]) {
    if (ids.length > 0) {
      await this.assignmentRepository
        .createQueryBuilder('assignment')
        .delete()
        .where('assignment.id IN (:...ids)', { ids })
        .execute();
    }
  }

  async addQuestions(id: string, body: DtoAddAssignmentQuestionsBody) {
    const assignment = await this.assignmentRepository.getAssignmentById(id);

    if (!assignment) {
      throw new NotFoundException('Không tìm thấy bài tập trong hệ thống.');
    }

    const bankQuestions = await this.questionRepository
      .createQueryBuilder('question')
      .where('question.id IN (:...ids)', { ids: body.questionIds })
      .andWhere('question.group IS NOT NULL')
      .andWhere('question.parentId IS NULL')
      .getMany();

    if (bankQuestions.length === 0) {
      throw new BadRequestException(
        'Không tìm thấy câu hỏi hợp lệ trong ngân hàng.',
      );
    }

    const matched = bankQuestions.filter(
      (item) => item.type === assignment.type,
    );

    if (matched.length === 0) {
      throw new BadRequestException(
        'Không có câu hỏi cùng loại với bài tập để thêm.',
      );
    }

    const copiedRoots = await this.findCopiedRoots(
      id,
      matched.map((item) => item.id),
    );
    const copiedRootIds = new Map(
      copiedRoots.map((item) => [item.sourceQuestionId, item.id]),
    );

    let copied = 0;
    let nextIndex = await this.getNextQuestionIndex(id);
    for (const item of matched) {
      const parentCopyId = copiedRootIds.get(item.id);
      if (!parentCopyId) {
        await this.copyQuestionTree(item, { assignment: id, index: nextIndex });
        nextIndex += 1;
        copied += 1;
        continue;
      }

      copied += await this.copyMissingChildren(item, id, parentCopyId);
    }

    return { copied };
  }

  async addGroup(id: string, body: DtoAddAssignmentGroupBody) {
    const assignment = await this.assignmentRepository.getAssignmentById(id);

    if (!assignment) {
      throw new NotFoundException('Không tìm thấy bài tập trong hệ thống.');
    }

    const group = await this.questionGroupRepository.getQuestionGroupById(
      body.groupId,
    );

    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm câu hỏi trong hệ thống.');
    }

    const groupQuestions = await this.questionRepository
      .createQueryBuilder('question')
      .where('question.group = :groupId', { groupId: body.groupId })
      .andWhere('question.type = :type', { type: assignment.type })
      .andWhere('question.parentId IS NULL')
      .orderBy('question.index', 'ASC')
      .getMany();

    if (groupQuestions.length === 0) {
      throw new BadRequestException(
        'Nhóm không có câu hỏi cùng loại với bài tập.',
      );
    }

    const copiedRoots = await this.findCopiedRoots(
      id,
      groupQuestions.map((item) => item.id),
    );
    const copiedRootIds = new Map(
      copiedRoots.map((item) => [item.sourceQuestionId, item.id]),
    );

    let copied = 0;
    let nextIndex = await this.getNextQuestionIndex(id);
    for (const item of groupQuestions) {
      const parentCopyId = copiedRootIds.get(item.id);
      if (!parentCopyId) {
        await this.copyQuestionTree(item, { assignment: id, index: nextIndex });
        nextIndex += 1;
        copied += 1;
        continue;
      }

      copied += await this.copyMissingChildren(item, id, parentCopyId);
    }

    return { copied };
  }

  async updateQuestionsIndex(
    id: string,
    body: DtoUpdateAssignmentQuestionsIndexBody,
  ) {
    const data = await this.assignmentRepository.getAssignmentById(id);

    if (!data) {
      throw new NotFoundException('Không tìm thấy bài tập trong hệ thống.');
    }

    const ids = Object.keys(body.newIndex);
    for await (const questionId of ids) {
      await this.questionRepository.updateQuestionById(questionId, {
        index: body.newIndex[questionId],
      });
    }
  }
}
