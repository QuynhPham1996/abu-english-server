import { Injectable, NotFoundException } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { getVideoDurationInSeconds } from 'get-video-duration';

import { commonPagination } from 'src/common/helpers/pagination';
import { parseOrderBy } from 'src/common/helpers/sorter';
import { DtoCreateExerciseBody } from 'src/modules/apis/exercise/dto/create-exercise.dto';
import { DtoGetExercisesQuery } from 'src/modules/apis/exercise/dto/get-exercises.dto';
import { ExerciseRepository } from 'src/modules/repositories/exercise.repository';
import { DtoUpdateExerciseBody } from 'src/modules/apis/exercise/dto/update-exercise.dto';
import { DtoAttachAssignmentsBody } from 'src/modules/apis/exercise/dto/attach-assignments.dto';
import { EExerciseStatus, ELessonStatus } from 'src/common/enums';
import { LessonRepository } from 'src/modules/repositories/lesson.repository';
import { UploadService } from 'src/modules/apis/upload/upload.service';
import { getFullPath } from 'src/common/functions';
import { CourseRepository } from 'src/modules/repositories/course.repository';
import { UserExerciseService } from 'src/modules/apis/userExercise/userExercise.service';
import { AssignmentRepository } from 'src/modules/repositories/assignment.repository';
import { QuestionRepository } from 'src/modules/repositories/question.repository';
import { UserLessonService } from 'src/modules/apis/userLesson/userLesson.service';

@Injectable()
export class ExerciseService {
  constructor(
    private readonly exerciseRepository: ExerciseRepository,
    private readonly courseRepository: CourseRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly uploadService: UploadService,
    private readonly userExerciseService: UserExerciseService,
    private readonly assignmentRepository: AssignmentRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly userLessonService: UserLessonService,
  ) {}

  async getExercises(courseId: string, params: DtoGetExercisesQuery) {
    const qb = await this.exerciseRepository
      .createQueryBuilder('exercise')
      .leftJoin('exercise.course', 'course')
      .select([
        'exercise.id',
        'exercise.name',
        'exercise.description',
        'exercise.videoUrl',
        'exercise.videoDuration',
        'exercise.status',
        'exercise.createdAt',
        'exercise.updatedAt',
        'course.id',
        'course.name',
      ])
      .where('course.id = :courseId', { courseId });

    if (params.search) {
      qb.andWhere(
        new Brackets((subQ) => {
          subQ.orWhere('exercise.name LIKE :search', {
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
        qb.addOrderBy(`exercise.${key}`, dir as any);
      }
    } else {
      qb.orderBy('exercise.createdAt', 'ASC');
    }

    const dataPaginate = await commonPagination(params, qb);

    const totalLessons = {};
    for await (const item of dataPaginate?.data) {
      const totalCourseLessons = await this.lessonRepository.count({
        where: { exercise: item.id, status: ELessonStatus.PUBLIC },
      });
      totalLessons[item.id] = totalCourseLessons;
    }

    const totalExercises = await this.exerciseRepository.count({
      where: { status: EExerciseStatus.PUBLIC, course: courseId },
    });

    const totalQuestions = {};
    for await (const item of dataPaginate?.data) {
      const lessons = await this.lessonRepository
        .createQueryBuilder('lesson')
        .leftJoin('lesson.questions', 'questions')
        .select(['lesson.id', 'questions.id'])
        .where('lesson.exercise = :exerciseId', { exerciseId: item.id })
        .andWhere('lesson.status = :status', {
          status: ELessonStatus.PUBLIC,
        })
        .getMany();

      const total = lessons
        ?.map((item) => item?.questions?.length || 0)
        ?.reduce((result, item) => {
          return result + item;
        }, 0);

      totalQuestions[item.id] = total;
    }

    const exercises = await this.exerciseRepository
      .createQueryBuilder('exercise')
      .select(['exercise.videoDuration'])
      .where('exercise.course = :courseId', { courseId })
      .andWhere('exercise.status = :status', { status: EExerciseStatus.PUBLIC })
      .getMany();

    const totalDurations = exercises.reduce((result, item) => {
      return result + item.videoDuration || 0;
    }, 0);

    return {
      ...dataPaginate,
      totalLessons,
      totalExercises,
      totalQuestions,
      totalDurations,
    };
  }

  async getExercise(id: string) {
    const data = await this.exerciseRepository
      .createQueryBuilder('exercise')
      .select([
        'exercise.id',
        'exercise.name',
        'exercise.description',
        'exercise.videoUrl',
        'exercise.videoDuration',
        'exercise.status',
        'exercise.createdAt',
        'exercise.updatedAt',
      ])
      .where('exercise.id = :id', { id })
      .getOne();

    if (data) {
      return {
        data,
      };
    } else {
      throw new NotFoundException('Không tìm thấy bài học trong hệ thống.');
    }
  }

  async createExercise(body: DtoCreateExerciseBody) {
    const bodyParse = {
      name: body?.name,
      description: body?.description,
      status: body?.status,
      course: body?.course,
    };

    const exerciseCreated = await this.exerciseRepository.save(bodyParse);

    const usersInCourse = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoin('course.users', 'users')
      .select(['course.id', 'users.id'])
      .where('course.id = :id', { id: body?.course })
      .getOne();

    for await (const user of usersInCourse?.users) {
      const bodyUserExercises = {
        user: user?.id,
        exercise: exerciseCreated?.id,
      };

      await this.userExerciseService.createUserExercise(bodyUserExercises);
    }
  }

  async updateExercise(id: string, body: DtoUpdateExerciseBody) {
    const data = await this.exerciseRepository.getExerciseById(id);

    if (data) {
      const bodyParse = {
        name: body?.name,
        description: body?.description,
        status: body?.status,
      };

      await this.exerciseRepository.updateExerciseById(id, bodyParse);
    } else {
      throw new NotFoundException('Không tìm thấy bài học trong hệ thống.');
    }
  }

  async deleteExercises(ids: string[]) {
    if (ids.length > 0) {
      const idsArray = ids;

      await this.exerciseRepository
        .createQueryBuilder('exercise')
        .delete()
        .where('exercise.id IN (:...ids)', { ids: idsArray })
        .execute();
    }
  }

  async uploadExerciseVideo(id: string, file: Express.Multer.File) {
    const data = await this.exerciseRepository.getExerciseById(id);

    if (data) {
      if (data.videoUrl) {
        await this.uploadService.deleteFiles([data.videoUrl]);
      }

      const fileUpload = await this.uploadService.uploadVideo(file);

      if (fileUpload) {
        const duration = await getVideoDurationInSeconds(
          getFullPath(fileUpload.url),
        );

        const body = {
          videoUrl: fileUpload.url,
          videoDuration: duration,
        };
        await this.exerciseRepository.updateExerciseById(id, body);
      }
    } else {
      throw new NotFoundException('Không tìm thấy bài học trong hệ thống.');
    }
  }

  async attachAssignments(id: string, body: DtoAttachAssignmentsBody) {
    const exercise = await this.exerciseRepository.getExerciseById(id);

    if (!exercise) {
      throw new NotFoundException('Không tìm thấy bài học trong hệ thống.');
    }

    const assignments = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.questions', 'questions')
      .where('assignment.id IN (:...ids)', { ids: body.assignmentIds })
      .orderBy('questions.index', 'ASC')
      .getMany();

    if (assignments.length === 0) {
      throw new NotFoundException('Không tìm thấy bài tập trong hệ thống.');
    }

    const existingLessons = await this.lessonRepository
      .createQueryBuilder('lesson')
      .select(['lesson.id', 'lesson.index', 'lesson.sourceAssignment'])
      .where('lesson.exercise = :exerciseId', { exerciseId: id })
      .getMany();

    const attachedSourceIds = new Set(
      existingLessons
        .map((item) => item.sourceAssignment)
        .filter((item) => !!item),
    );

    const indexes = existingLessons.map((item) => item.index || 0);
    let nextIndex = indexes.length > 0 ? Math.max(...indexes) + 1 : 1;

    const exerciseEntity = await this.exerciseRepository
      .createQueryBuilder('exercise')
      .leftJoin('exercise.course', 'course')
      .select(['exercise.id', 'course.id'])
      .where('exercise.id = :id', { id })
      .getOne();

    const courseId = (exerciseEntity?.course as any)?.id || exerciseEntity?.course;

    const usersInCourse = courseId
      ? await this.courseRepository
          .createQueryBuilder('course')
          .leftJoin('course.users', 'users')
          .select(['course.id', 'users.id'])
          .where('course.id = :id', { id: courseId })
          .getOne()
      : null;

    let attached = 0;
    let skipped = 0;

    for (const assignment of assignments) {
      if (attachedSourceIds.has(assignment.id)) {
        skipped += 1;
        continue;
      }

      const lessonCreated = await this.lessonRepository.save({
        name: assignment.name,
        type: assignment.type,
        arrange: assignment.arrange,
        status: assignment.status as any,
        exercise: id,
        index: nextIndex++,
        sourceAssignment: assignment.id,
      });

      const assignmentQuestions = (assignment.questions || []).sort(
        (a, b) => (a.index || 0) - (b.index || 0),
      );

      const roots = assignmentQuestions.filter((question) => !question.parentId);
      const children = assignmentQuestions.filter((question) => question.parentId);

      for (const [questionIndex, question] of roots.entries()) {
        const parent = await this.questionRepository.save({
          question: question.question,
          answers: question.answers,
          note: question.note,
          type: question.type || assignment.type,
          index: question.index || questionIndex + 1,
          sourceQuestionId: question.id,
          lesson: lessonCreated.id,
        });
        const childQuestions = children.filter((child) => child.parentId === question.id);

        if (childQuestions.length > 0) {
          await this.questionRepository.save(
            childQuestions.map((child, index) => ({
              question: child.question,
              answers: child.answers,
              note: child.note,
              type: child.type || assignment.type,
              index: index + 1,
              sourceQuestionId: child.id,
              parentId: parent.id,
              lesson: lessonCreated.id,
            })),
          );
        }
      }

      if (usersInCourse?.users?.length) {
        for await (const user of usersInCourse.users) {
          await this.userLessonService.createUserLesson({
            user: user?.id,
            lesson: lessonCreated.id,
          });
        }
      }

      attached += 1;
    }

    return { attached, skipped };
  }
}
