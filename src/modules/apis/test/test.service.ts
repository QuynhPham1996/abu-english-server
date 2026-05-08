import { Injectable, NotFoundException } from '@nestjs/common';
import { DtoUserToken } from 'src/auth/dto/token-decode.dto';
import {
  ELessonType,
  ENotificationType,
  ETestStatus,
  EUserRole,
  EUserStatus,
} from 'src/common/enums';
import { commonPagination } from 'src/common/helpers/pagination';
import { parseOrderBy } from 'src/common/helpers/sorter';
import { TUserAnswer } from 'src/common/types';
import { env } from 'src/configs/constants';
import { MailersService } from 'src/modules/apis/mailers/mailers.service';
import { DtoCreateTestBody } from 'src/modules/apis/test/dto/create-test.dto';
import { DtoGetTestsQuery } from 'src/modules/apis/test/dto/get-tests.dto';
import { DtoGradedTestBody } from 'src/modules/apis/test/dto/graded-test.dto';
import { LessonEntity } from 'src/modules/entities/lesson.entity';
import { LessonRepository } from 'src/modules/repositories/lesson.repository';
import { NotificationRepository } from 'src/modules/repositories/notification.repository';
import { QuestionRepository } from 'src/modules/repositories/question.repository';
import { TestRepository } from 'src/modules/repositories/test.repository';
import { UserRepository } from 'src/modules/repositories/user.repository';
import { UserLessonRepository } from 'src/modules/repositories/userLesson.repository';
import { Brackets } from 'typeorm';

@Injectable()
export class TestService {
  constructor(
    private readonly testRepository: TestRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly userLessonRepository: UserLessonRepository,
    private readonly userRepository: UserRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly mailersService: MailersService,
  ) {}

  async getUserTests(user: DtoUserToken, params: DtoGetTestsQuery) {
    const qb = await this.testRepository
      .createQueryBuilder('test')
      .leftJoin('test.lesson', 'lesson')
      .leftJoin('lesson.exercise', 'exercise')
      .leftJoin('exercise.course', 'course')
      .leftJoin('test.userLesson', 'userLesson')
      .leftJoin('test.userExercise', 'userExercise')
      .select([
        'test.id',
        'test.result',
        'test.status',
        'test.duration',
        'test.createdAt',
        'test.updatedAt',
        'lesson.id',
        'lesson.name',
        'lesson.type',
        'exercise.id',
        'exercise.name',
        'course.id',
        'course.name',
        'userLesson.id',
        'userExercise.id',
      ])
      .where('test.user = :userId', { userId: user?.id });

    const sort = parseOrderBy(params.sort);

    if (sort) {
      const [key, dir] = sort;
      const [relationField, relationKey] = key.split('.');

      if (relationField && relationKey) {
        qb.addOrderBy(`${relationField}.${relationKey}`, dir as any);
      } else {
        qb.addOrderBy(`test.${key}`, dir as any);
      }
    } else {
      qb.orderBy('test.createdAt', 'DESC');
    }

    const dataPaginate = await commonPagination(params, qb);

    const testsSuccess = await this.testRepository
      .createQueryBuilder('test')
      .select(['test.id', 'test.result'])
      .where('test.user = :userId', { userId: user?.id })
      .andWhere('test.status = :status', { status: ETestStatus.SUCCESS })
      .getMany();

    const arrayResults = testsSuccess?.map((test) => test.result);

    const averageScore =
      arrayResults.reduce((a, b) => a + b, 0) / arrayResults.length;

    const userLessons = await this.userLessonRepository
      .createQueryBuilder('userLesson')
      .select(['userLesson.id', 'userLesson.isPass'])
      .where('userLesson.user = :userId', { userId: user?.id })
      .getMany();

    const passUserLessons = userLessons.filter(
      (userLesson) => userLesson.isPass,
    ).length;

    return {
      ...dataPaginate,
      averageScore,
      totalUserLessons: userLessons.length,
      passUserLessons,
    };
  }

  async getUserTest(user: DtoUserToken, id: string) {
    const qb = await this.testRepository
      .createQueryBuilder('test')
      .leftJoin('test.lesson', 'lesson')
      .select([
        'test.id',
        'test.result',
        'test.userAnswers',
        'test.duration',
        'test.status',
        'lesson.id',
        'lesson.name',
        'lesson.type',
      ])
      .where('test.id = :id', { id });

    if ([EUserRole.STUDENT].includes(user?.role)) {
      qb.andWhere('test.user = :userId', { userId: user?.id }).andWhere(
        'test.status = :status',
        { status: ETestStatus.SUCCESS },
      );
    }

    const data = await qb.getOne();

    if (data) {
      const questionsIds = data?.userAnswers?.map(
        (userAnswer) => userAnswer.question,
      );
      const questions = await this.questionRepository
        .createQueryBuilder('question')
        .select([
          'question.id',
          'question.note',
          'question.question',
          'question.answers',
        ])
        .where('question.id IN (:...ids)', { ids: questionsIds })
        .getMany();

      const parseQuestions = questions.map((question) => {
        return {
          ...question,
        };
      });

      return {
        data,
        questions: parseQuestions,
      };
    } else {
      throw new NotFoundException('Không tìm thấy bài tập trong hệ thống.');
    }
  }

  async getTests(params: DtoGetTestsQuery) {
    const qb = await this.testRepository
      .createQueryBuilder('test')
      .leftJoin('test.lesson', 'lesson')
      .leftJoin('test.user', 'user')
      .leftJoin('lesson.exercise', 'exercise')
      .leftJoin('exercise.course', 'course')
      .leftJoin('course.manager', 'manager')
      .select([
        'test.id',
        'test.result',
        'test.status',
        'test.duration',
        'test.createdAt',
        'test.updatedAt',
        'lesson.id',
        'lesson.name',
        'lesson.type',
        'exercise.id',
        'exercise.name',
        'course.id',
        'course.name',
        'user.id',
        'user.name',
        'user.username',
        'user.avatar',
        'manager.id',
        'manager.name',
      ]);

    if (params.search) {
      qb.andWhere(
        new Brackets((subQ) => {
          subQ
            .orWhere('exercise.name LIKE :search', {
              search: `%${params.search}%`,
            })
            .orWhere('lesson.name LIKE :search', {
              search: `%${params.search}%`,
            })
            .orWhere('user.name LIKE :search', {
              search: `%${params.search}%`,
            })
            .orWhere('course.name LIKE :search', {
              search: `%${params.search}%`,
            });
        }),
      );
    }

    if (params?.status) {
      qb.andWhere('test.status IN (:...statuses)', {
        statuses: params?.status?.split(','),
      });
    }

    if (params?.type) {
      qb.andWhere('lesson.type IN (:...types)', {
        types: params?.type?.split(','),
      });
    }

    const sort = parseOrderBy(params.sort);

    if (sort) {
      const [key, dir] = sort;
      const [relationField, relationKey] = key.split('.');

      if (relationField && relationKey) {
        qb.addOrderBy(`${relationField}.${relationKey}`, dir as any);
      } else {
        qb.addOrderBy(`test.${key}`, dir as any);
      }
    } else {
      qb.orderBy('test.createdAt', 'DESC');
    }

    const data = await commonPagination(params, qb);

    return data;
  }

  async createTest(user: DtoUserToken, body: DtoCreateTestBody) {
    const lesson = await this.lessonRepository.getLessonById(body?.lesson);

    if (lesson) {
      const userLesson = await this.userLessonRepository.getUserLessonById(
        body?.userLesson,
      );

      if (userLesson) {
        const isEssayType = lesson?.type === ELessonType.ESSAY;
        const result = await this.caculateResultMultipleChoiceLesson(
          lesson,
          body?.userAnswers,
        );

        const bodyParse = {
          lesson: lesson?.id,
          duration: body?.duration,
          userAnswers: body?.userAnswers,
          userLesson: body?.userLesson,
          userExercise: body?.userExercise,
          result,
          user: user.id,
          status: isEssayType ? ETestStatus.PENDING : ETestStatus.SUCCESS,
        };

        const test = await this.testRepository.save(bodyParse);

        if (!userLesson.isPass) {
          await this.userLessonRepository.updateUserLessonById(userLesson.id, {
            isPass: true,
          });
        }

        if (isEssayType) {
          const managerUsers = await this.userRepository
            .createQueryBuilder('user')
            .select(['user.id', 'user.email'])
            .where('user.status = :status', { status: EUserStatus.ACTIVE })
            .andWhere('user.role = :role', { role: EUserRole.MANAGER })
            .getMany();

          for await (const manager of managerUsers) {
            const bodyParse = {
              message: `đã nộp bài tập tự luận: "${lesson?.name}". Vui lòng chấm điểm cho học viên để trả kết quả.`,
              fromUser: user.id,
              toUser: manager.id,
              type: ENotificationType.SUBMIT_EXERCISE,
              data: {
                test: {
                  id: test?.id,
                },
              },
            };

            await this.notificationRepository.save(bodyParse);
          }

          const managersEmail =
            managerUsers
              ?.filter((item) => item.email)
              ?.map((item) => item.email) || [];

          if (managersEmail.length > 0) {
            this.mailersService.sendMailNotificationMessage({
              emails: managersEmail,
              message: `${user?.name} đã nộp bài tập tự luận: "${lesson?.name}". Vui lòng chấm điểm cho học viên để trả kết quả.`,
              buttonLink: `${env.rootUrl}/exercises/${test?.id}`,
            });
          }
        }
      } else {
        throw new NotFoundException('Không tìm thấy bài tập trong hệ thống.');
      }
    } else {
      throw new NotFoundException('Không tìm thấy bài học trong hệ thống.');
    }
  }

  async caculateResultMultipleChoiceLesson(
    lesson: LessonEntity,
    data: TUserAnswer[],
  ) {
    if (lesson.type === ELessonType.MULTIPLE_CHOICE) {
      const questionsIds = data?.map((userAnswer) => userAnswer.question);
      const questions = await this.questionRepository
        .createQueryBuilder('question')
        .where('question.id IN (:...ids)', { ids: questionsIds })
        .getMany();

      let result = 0;

      for await (const question of questions) {
        const correctAnswer = question.answers.find(
          (answer) => answer.isCorrect,
        );
        const userAnswer = data?.find(
          (answer) => answer.question === question.id,
        );
        const isCorrect = correctAnswer.id === userAnswer?.answer;
        if (isCorrect) result = result + 1;
      }

      return Math.floor((result / questions.length) * 100);
    } else {
      return 0;
    }
  }

  async gradedTest(user: DtoUserToken, id: string, body: DtoGradedTestBody) {
    const data = await this.testRepository
      .createQueryBuilder('test')
      .leftJoin('test.user', 'user')
      .leftJoin('test.lesson', 'lesson')
      .select([
        'test.id',
        'lesson.id',
        'lesson.name',
        'user.id',
        'user.email',
        'test.userAnswers',
      ])
      .where('test.id = :id', { id })
      .getOne();

    if (data) {
      const totalQuestions = body?.userAnswers?.length || 0;
      const totalQuestionsSuccess =
        body?.userAnswers?.filter((item) => item.isCorrect)?.length || 0;
      const result = (totalQuestionsSuccess / totalQuestions) * 100;

      const bodyParse = {
        userAnswers: body?.userAnswers,
        status: ETestStatus.SUCCESS,
        result,
      };

      const bodyNotificationParse = {
        message: `đã chấm xong bài tập: "${
          (data?.lesson as any)?.name
        }" của bạn. Bạn đã có thể kiểm tra kết quả của bài tập này.`,
        fromUser: user.id,
        toUser: (data?.user as any)?.id,
        type: ENotificationType.RETURN_EXERCISE,
        data: {
          test: {
            id,
          },
        },
      };

      await this.notificationRepository.save(bodyNotificationParse);

      const userEmail = (data?.user as any)?.email;

      if (userEmail) {
        this.mailersService.sendMailNotificationMessage({
          emails: [userEmail],
          message: `${user?.name} đã chấm xong bài tập: "${
            (data?.lesson as any)?.name
          }" của bạn. Bạn đã có thể kiểm tra kết quả của bài tập này.`,
          buttonLink: `${env.rootUrl}/exercises`,
        });
      }

      await this.testRepository.updateTestById(data?.id, bodyParse);
    } else {
      throw new NotFoundException('Không tìm thấy bài tập trong hệ thống.');
    }
  }
}
