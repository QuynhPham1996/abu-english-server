import { Injectable, NotFoundException } from '@nestjs/common';

import { DtoCreateLessonBody } from 'src/modules/apis/lesson/dto/create-lesson.dto';
import { LessonRepository } from 'src/modules/repositories/lesson.repository';
import { DtoUpdateLessonBody } from 'src/modules/apis/lesson/dto/update-lesson.dto';
import { ELessonStatus } from 'src/common/enums';
import { DtoUpdateLessonQuestionsIndexBody } from 'src/modules/apis/lesson/dto/update-lesson-questions-index.dto';
import { QuestionRepository } from 'src/modules/repositories/question.repository';
import { UserLessonService } from 'src/modules/apis/userLesson/userLesson.service';
import { CourseRepository } from 'src/modules/repositories/course.repository';

@Injectable()
export class LessonService {
  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly courseRepository: CourseRepository,
    private readonly userLessonService: UserLessonService,
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
        'lesson.createdAt',
        'lesson.updatedAt',
        'questions.id',
        'questions.question',
        'questions.index',
        'questions.note',
        'questions.answers',
      ])
      .where('lesson.exercise = :exerciseId', { exerciseId })
      .orderBy('lesson.createdAt', 'ASC');

    const data = await qb.getMany();

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
    const bodyParse = {
      name: body?.name,
      type: body?.type,
      arrange: body?.arrange,
      status: body?.status,
      exercise: body?.exercise,
    };

    const lessonCreated = await this.lessonRepository.save(bodyParse);

    const lessonCreatedEntity = await this.lessonRepository
      .createQueryBuilder('lesson')
      .leftJoin('lesson.exercise', 'exercise')
      .leftJoin('exercise.course', 'course')
      .select(['lesson.id', 'exercise.id', 'course.id'])
      .where('lesson.id = :id', { id: lessonCreated?.id })
      .getOne();

    const courseId = (lessonCreatedEntity?.exercise as any)?.course?.id;

    const usersInCourse = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoin('course.users', 'users')
      .select(['course.id', 'users.id'])
      .where('course.id = :id', { id: courseId })
      .getOne();

    for await (const user of usersInCourse?.users) {
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

      await this.lessonRepository
        .createQueryBuilder('lesson')
        .delete()
        .where('lesson.id IN (:...ids)', { ids: idsArray })
        .execute();
    }
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
