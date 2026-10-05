import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { DtoCreateLessonBody } from 'src/modules/apis/lesson/dto/create-lesson.dto';
import { LessonRepository } from 'src/modules/repositories/lesson.repository';
import { DtoUpdateLessonBody } from 'src/modules/apis/lesson/dto/update-lesson.dto';
import { EAssignmentStatus, ELessonStatus } from 'src/common/enums';
import { DtoUpdateLessonQuestionsIndexBody } from 'src/modules/apis/lesson/dto/update-lesson-questions-index.dto';
import { DtoAddLessonQuestionsBody } from 'src/modules/apis/lesson/dto/add-lesson-questions.dto';
import { DtoAddLessonGroupBody } from 'src/modules/apis/lesson/dto/add-lesson-group.dto';
import {
  nestQuestions,
  QuestionRepository,
} from 'src/modules/repositories/question.repository';
import { QuestionGroupRepository } from 'src/modules/repositories/questionGroup.repository';
import { QuestionEntity } from 'src/modules/entities/question.entity';
import { UserLessonService } from 'src/modules/apis/userLesson/userLesson.service';
import { CourseRepository } from 'src/modules/repositories/course.repository';
import { TestRepository } from 'src/modules/repositories/test.repository';
import { AssignmentRepository } from 'src/modules/repositories/assignment.repository';
import { AssignmentService } from 'src/modules/apis/assignment/assignment.service';

@Injectable()
export class LessonService {
  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly questionGroupRepository: QuestionGroupRepository,
    private readonly courseRepository: CourseRepository,
    private readonly userLessonService: UserLessonService,
    private readonly testRepository: TestRepository,
    private readonly assignmentRepository: AssignmentRepository,
    private readonly assignmentService: AssignmentService,
  ) {}

  async getLessons(exerciseId: string) {
    const qb = await this.lessonRepository
      .createQueryBuilder('lesson')
      .leftJoin('lesson.questions', 'questions')
      .select([
        'lesson.id',
        'lesson.name',
        'lesson.type',
        'lesson.arrange',
        'lesson.status',
        'lesson.index',
        'lesson.sourceAssignment',
        'lesson.createdAt',
        'lesson.updatedAt',
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
      .where('lesson.exercise = :exerciseId', { exerciseId })
      .orderBy('lesson.index', 'ASC')
      .addOrderBy('lesson.createdAt', 'ASC');

    const lessons = (await qb.getMany()).map((lesson) => ({
      ...lesson,
      questions: nestQuestions(lesson.questions || []),
    }));

    const assignmentIds = [
      ...new Set(lessons.map((lesson) => lesson.sourceAssignment).filter(Boolean)),
    ];
    const bankSourceByCopyId = new Map<string, string>();
    if (assignmentIds.length > 0) {
      const copies = await this.questionRepository
        .createQueryBuilder('question')
        .select(['question.id', 'question.sourceQuestionId'])
        .where('question.assignment IN (:...ids)', { ids: assignmentIds })
        .getMany();
      copies.forEach((item) => {
        if (item.sourceQuestionId) bankSourceByCopyId.set(item.id, item.sourceQuestionId);
      });
    }

    const data = lessons.map((lesson) => ({
      ...lesson,
      questions: lesson.sourceAssignment
        ? (lesson.questions || []).map((question) => {
            const bankId = question.sourceQuestionId
              ? bankSourceByCopyId.get(question.sourceQuestionId)
              : undefined;
            return {
              ...question,
              sourceQuestionId: bankId || question.sourceQuestionId,
              children: (question.children || []).map((child) => {
                const childBankId = child.sourceQuestionId
                  ? bankSourceByCopyId.get(child.sourceQuestionId)
                  : undefined;
                return {
                  ...child,
                  sourceQuestionId: childBankId || child.sourceQuestionId,
                };
              }),
            };
          })
        : lesson.questions,
    }));

    const totalLessons = await this.lessonRepository.count({
      where: { status: ELessonStatus.PUBLIC, exercise: exerciseId },
    });

    const filterLessons = await this.lessonRepository
      .createQueryBuilder('lesson')
      .leftJoin('lesson.questions', 'questions')
      .select(['lesson.id', 'questions.id'])
      .where('lesson.status = :status', { status: ELessonStatus.PUBLIC })
      .andWhere('lesson.exercise = :exerciseId', { exerciseId })
      .getMany();

    const totalQuestions = filterLessons
      ?.map((item) => item?.questions?.length || 0)
      ?.reduce((result, item) => {
        return result + item;
      }, 0);

    return { data, totalLessons, totalQuestions };
  }

  async createLesson(body: DtoCreateLessonBody) {
    if (!body?.exercise && !body?.course) {
      throw new BadRequestException('Bài tập phải thuộc khoá học hoặc bài học.');
    }

    const existingQuery = this.lessonRepository
      .createQueryBuilder('lesson')
      .select(['lesson.id', 'lesson.index', 'lesson.name']);

    if (body.course) {
      existingQuery.where('lesson.course = :courseId', { courseId: body.course });
    } else {
      existingQuery.where('lesson.exercise = :exerciseId', {
        exerciseId: body.exercise,
      });
    }

    const existingLessons = await existingQuery.getMany();
    const duplicated = existingLessons.some(
      (item) => item.name?.trim().toLowerCase() === body.name?.trim().toLowerCase(),
    );

    if (duplicated) {
      throw new BadRequestException('Bài tập đã có trong danh sách.');
    }

    const indexes = existingLessons.map((item) => item.index || 0);
    const nextIndex = indexes.length > 0 ? Math.max(...indexes) + 1 : 1;

    const assignment = await this.assignmentRepository.save({
      name: body?.name,
      type: body?.type,
      arrange: body?.arrange,
      status: body?.status as unknown as EAssignmentStatus,
    });

    const bodyParse = {
      name: body?.name,
      type: body?.type,
      arrange: body?.arrange,
      status: body?.status,
      exercise: body?.exercise,
      course: body?.course,
      index: nextIndex,
      sourceAssignment: assignment.id,
    };

    const lessonCreated = await this.lessonRepository.save(bodyParse);

    const lessonCreatedEntity = await this.lessonRepository
      .createQueryBuilder('lesson')
      .leftJoin('lesson.exercise', 'exercise')
      .leftJoin('exercise.course', 'course')
      .select(['lesson.id', 'lesson.course', 'exercise.id', 'course.id'])
      .where('lesson.id = :id', { id: lessonCreated?.id })
      .getOne();

    const courseId =
      body.course || (lessonCreatedEntity?.exercise as any)?.course?.id;

    const usersInCourse = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoin('course.users', 'users')
      .select(['course.id', 'users.id'])
      .where('course.id = :id', { id: courseId })
      .getOne();

    for await (const user of usersInCourse?.users || []) {
      const bodyUserLessons = {
        user: user?.id,
        lesson: lessonCreated?.id,
      };

      await this.userLessonService.createUserLesson(bodyUserLessons);
    }
  }

  async updateLesson(id: string, body: DtoUpdateLessonBody) {
    const data = await this.lessonRepository.getLessonById(id);

    if (data) {
      const bodyParse = {
        name: body?.name,
        arrange: body?.arrange,
        status: body?.status,
      };

      await this.lessonRepository.updateLessonById(id, bodyParse);
    } else {
      throw new NotFoundException('Không tìm thấy bài tập trong hệ thống.');
    }
  }

  async deleteLessons(ids: string[]) {
    if (ids.length > 0) {
      const idsArray = ids;

      const testsCount = await this.testRepository
        .createQueryBuilder('test')
        .where('test.lesson IN (:...ids)', { ids: idsArray })
        .getCount();

      if (testsCount > 0) {
        throw new BadRequestException(
          'Không thể gỡ bài tập đã có bài nộp của học viên.',
        );
      }

      await this.lessonRepository
        .createQueryBuilder('lesson')
        .delete()
        .where('lesson.id IN (:...ids)', { ids: idsArray })
        .execute();
    }
  }

  private async getNextQuestionIndex(lessonId: string) {
    const qb = await this.questionRepository
      .createQueryBuilder('question')
      .select('question.index')
      .where('question.lesson = :lessonId', { lessonId })
      .getRawMany();

    const indexes = qb.map((item) => item.question_index);
    return indexes.length > 0 ? Math.max(...indexes) + 1 : 1;
  }

  private async copyQuestionTree(
    source: QuestionEntity,
    target: { lesson: string; index: number },
  ) {
    const parent = await this.questionRepository.save({
      question: source.question,
      answers: source.answers,
      note: source.note,
      type: source.type,
      index: target.index,
      sourceQuestionId: source.id,
      lesson: target.lesson,
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
          lesson: target.lesson,
        })),
      );
    }
  }

  private async copyMissingLessonChildren(
    source: QuestionEntity,
    lessonId: string,
    parentCopyId: string,
  ) {
    const children = await this.questionRepository.findChildren([source.id]);
    if (children.length === 0) return 0;

    const existed = await this.questionRepository
      .createQueryBuilder('question')
      .select(['question.id', 'question.sourceQuestionId'])
      .where('question.lesson = :lessonId', { lessonId })
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
          lesson: lessonId,
        };
      }),
    );

    return missing.length;
  }

  private async syncAssignmentQuestions(lessonId: string, assignmentId: string) {
    const roots = await this.questionRepository
      .createQueryBuilder('question')
      .where('question.assignment = :assignmentId', { assignmentId })
      .andWhere('question.parentId IS NULL')
      .orderBy('question.index', 'ASC')
      .getMany();

    const lessonRoots = await this.questionRepository
      .createQueryBuilder('question')
      .select(['question.id', 'question.sourceQuestionId'])
      .where('question.lesson = :lessonId', { lessonId })
      .andWhere('question.parentId IS NULL')
      .getMany();
    const lessonRootBySource = new Map(
      lessonRoots.map((item) => [item.sourceQuestionId, item.id]),
    );

    let copied = 0;
    let nextIndex = await this.getNextQuestionIndex(lessonId);
    for (const root of roots) {
      const lessonParentId = lessonRootBySource.get(root.id);
      if (!lessonParentId) {
        await this.copyQuestionTree(root, { lesson: lessonId, index: nextIndex });
        nextIndex += 1;
        copied += 1;
        continue;
      }

      copied += await this.copyMissingLessonChildren(
        root,
        lessonId,
        lessonParentId,
      );
    }

    return copied;
  }

  async addQuestions(id: string, body: DtoAddLessonQuestionsBody) {
    const lesson = await this.lessonRepository.getLessonById(id);

    if (!lesson) {
      throw new NotFoundException('Không tìm thấy bài tập trong hệ thống.');
    }

    if (lesson.sourceAssignment) {
      const result = await this.assignmentService.addQuestions(
        lesson.sourceAssignment,
        body,
      );
      const synced = await this.syncAssignmentQuestions(
        id,
        lesson.sourceAssignment,
      );
      return { copied: Math.max(result.copied, synced) };
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

    const matched = bankQuestions.filter((item) => item.type === lesson.type);

    if (matched.length === 0) {
      throw new BadRequestException(
        'Không có câu hỏi cùng loại với bài tập để thêm.',
      );
    }

    const existed = await this.questionRepository
      .createQueryBuilder('question')
      .select(['question.id', 'question.sourceQuestionId'])
      .where('question.lesson = :lessonId', { lessonId: id })
      .andWhere('question.parentId IS NULL')
      .andWhere('question.sourceQuestionId IN (:...sourceIds)', {
        sourceIds: matched.map((item) => item.id),
      })
      .getMany();

    const existedIds = new Set(existed.map((item) => item.sourceQuestionId));
    const toCopy = matched.filter((item) => !existedIds.has(item.id));

    if (toCopy.length === 0) {
      return { copied: 0 };
    }

    let nextIndex = await this.getNextQuestionIndex(id);
    for (const item of toCopy) {
      await this.copyQuestionTree(item, { lesson: id, index: nextIndex });
      nextIndex += 1;
    }

    return { copied: toCopy.length };
  }

  async addGroup(id: string, body: DtoAddLessonGroupBody) {
    const lesson = await this.lessonRepository.getLessonById(id);

    if (!lesson) {
      throw new NotFoundException('Không tìm thấy bài tập trong hệ thống.');
    }

    const group = await this.questionGroupRepository.getQuestionGroupById(
      body.groupId,
    );

    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm câu hỏi trong hệ thống.');
    }

    if (lesson.sourceAssignment) {
      const result = await this.assignmentService.addGroup(
        lesson.sourceAssignment,
        body,
      );
      const synced = await this.syncAssignmentQuestions(
        id,
        lesson.sourceAssignment,
      );
      return { copied: Math.max(result.copied, synced) };
    }

    const groupQuestions = await this.questionRepository
      .createQueryBuilder('question')
      .where('question.group = :groupId', { groupId: body.groupId })
      .andWhere('question.type = :type', { type: lesson.type })
      .andWhere('question.parentId IS NULL')
      .orderBy('question.index', 'ASC')
      .getMany();

    if (groupQuestions.length === 0) {
      throw new BadRequestException(
        'Nhóm không có câu hỏi cùng loại với bài tập.',
      );
    }

    const existed = await this.questionRepository
      .createQueryBuilder('question')
      .select(['question.id', 'question.sourceQuestionId'])
      .where('question.lesson = :lessonId', { lessonId: id })
      .andWhere('question.parentId IS NULL')
      .andWhere('question.sourceQuestionId IN (:...sourceIds)', {
        sourceIds: groupQuestions.map((item) => item.id),
      })
      .getMany();

    const existedIds = new Set(existed.map((item) => item.sourceQuestionId));
    const toCopy = groupQuestions.filter((item) => !existedIds.has(item.id));

    if (toCopy.length === 0) {
      return { copied: 0 };
    }

    let nextIndex = await this.getNextQuestionIndex(id);
    for (const item of toCopy) {
      await this.copyQuestionTree(item, { lesson: id, index: nextIndex });
      nextIndex += 1;
    }

    return { copied: toCopy.length };
  }

  async updateLessonQuestionsIndex(
    id: string,
    body: DtoUpdateLessonQuestionsIndexBody,
  ) {
    const data = await this.lessonRepository.getLessonById(id);

    if (data) {
      const ids = Object.keys(body.newIndex);
      for await (const id of ids) {
        await this.questionRepository.updateQuestionById(id, {
          index: body.newIndex[id],
        });
      }
    } else {
      throw new NotFoundException('Không tìm thấy bài tập trong hệ thống.');
    }
  }
}
