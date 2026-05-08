import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brackets } from 'typeorm';
import { orderBy, shuffle } from 'lodash';

import { commonPagination } from 'src/common/helpers/pagination';
import { parseOrderBy } from 'src/common/helpers/sorter';
import { DtoCreateCourseBody } from 'src/modules/apis/course/dto/create-course.dto';
import { DtoGetCoursesQuery } from 'src/modules/apis/course/dto/get-courses.dto';
import { CourseRepository } from 'src/modules/repositories/course.repository';
import { DtoUpdateCourseBody } from 'src/modules/apis/course/dto/update-course.dto';
import { ExerciseRepository } from 'src/modules/repositories/exercise.repository';
import {
  ECourseStatus,
  EExerciseStatus,
  ELessonArrange,
  ELessonStatus,
  ENotificationType,
  EUserRole,
  EUserStatus,
} from 'src/common/enums';
import { DtoUserToken } from 'src/auth/dto/token-decode.dto';
import { NotificationRepository } from 'src/modules/repositories/notification.repository';
import { UserRepository } from 'src/modules/repositories/user.repository';
import { MailersService } from 'src/modules/apis/mailers/mailers.service';
import { env } from 'src/configs/constants';
import { UserExerciseRepository } from 'src/modules/repositories/userExercise.repository';
import { UserLessonRepository } from 'src/modules/repositories/userLesson.repository';
import { LessonRepository } from 'src/modules/repositories/lesson.repository';
import { TestRepository } from 'src/modules/repositories/test.repository';

@Injectable()
export class CourseService {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly exerciseRepository: ExerciseRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly userRepository: UserRepository,
    private readonly userExerciseRepository: UserExerciseRepository,
    private readonly userLessonRepository: UserLessonRepository,
    private readonly mailersService: MailersService,
    private readonly testRepository: TestRepository,
  ) {}

  async getCourses(params: DtoGetCoursesQuery) {
    const qb = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoin('course.manager', 'manager')
      .select([
        'course.id',
        'course.image',
        'course.name',
        'course.description',
        'course.sellingPrice',
        'course.retailPrice',
        'course.status',
        'course.level',
        'course.createdAt',
        'course.updatedAt',
        'manager.id',
        'manager.name',
        'manager.username',
        'manager.avatar',
      ]);

    if (params.search) {
      qb.andWhere(
        new Brackets((subQ) => {
          subQ.orWhere('course.name LIKE :search', {
            search: `%${params.search}%`,
          });
        }),
      );
    }

    if (params?.status) {
      qb.andWhere('course.status IN (:...statuses)', {
        statuses: params?.status?.split(','),
      });
    }

    if (params?.level) {
      qb.andWhere('course.level IN (:...levels)', {
        levels: params?.level?.split(','),
      });
    }

    const sort = parseOrderBy(params.sort);

    if (sort) {
      const [key, dir] = sort;
      const [relationField, relationKey] = key.split('.');

      if (relationField && relationKey) {
        qb.addOrderBy(`${relationField}.${relationKey}`, dir as any);
      } else {
        qb.addOrderBy(`course.${key}`, dir as any);
      }
    } else {
      qb.orderBy('course.createdAt', 'DESC');
    }

    const dataPaginate = await commonPagination(params, qb);

    const totalExercises = {};
    for await (const item of dataPaginate?.data) {
      const totalCourseExercises = await this.exerciseRepository.count({
        where: { course: item.id, status: EExerciseStatus.PUBLIC },
      });
      totalExercises[item.id] = totalCourseExercises;
    }

    const totalDurations = {};
    for await (const item of dataPaginate?.data) {
      const exercises = await this.exerciseRepository
        .createQueryBuilder('exercise')
        .select(['exercise.videoDuration'])
        .where('exercise.course = :courseId', { courseId: item.id })
        .andWhere('exercise.status = :status', {
          status: EExerciseStatus.PUBLIC,
        })
        .getMany();

      const durations = exercises.reduce((result, item) => {
        return result + item.videoDuration || 0;
      }, 0);
      totalDurations[item.id] = durations;
    }

    const totalUsers = {};
    for await (const item of dataPaginate?.data) {
      const totalCourseUsers = await this.courseRepository
        .createQueryBuilder('course')
        .leftJoin('course.users', 'users')
        .select(['course.id', 'users.id'])
        .where('course.id = :id', { id: item.id })
        .getOne();

      totalUsers[item.id] = totalCourseUsers?.users?.length || 0;
    }

    return { ...dataPaginate, totalExercises, totalDurations, totalUsers };
  }

  async getCourse(id: string) {
    const data = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoin('course.manager', 'manager')
      .select([
        'course.id',
        'course.image',
        'course.name',
        'course.description',
        'course.sellingPrice',
        'course.retailPrice',
        'course.status',
        'course.level',
        'course.createdAt',
        'course.updatedAt',
        'manager.id',
        'manager.name',
        'manager.username',
        'manager.avatar',
      ])
      .where('course.id = :id', { id })
      .getOne();

    if (data) {
      return {
        data,
      };
    } else {
      throw new NotFoundException('Không tìm thấy khoá học trong hệ thống.');
    }
  }

  async createCourse(body: DtoCreateCourseBody) {
    const bodyParse = {
      image: body?.image,
      name: body?.name,
      description: body?.description,
      retailPrice: body?.retailPrice,
      sellingPrice: body?.sellingPrice,
      status: body?.status,
      level: body?.level,
      manager: body?.manager,
    };

    await this.courseRepository.save(bodyParse);
  }

  async updateCourse(id: string, body: DtoUpdateCourseBody) {
    const data = await this.courseRepository.getCourseById(id);

    if (data) {
      const bodyParse = {
        image: body?.image,
        name: body?.name,
        description: body?.description,
        retailPrice: body?.retailPrice,
        sellingPrice: body?.sellingPrice,
        status: body?.status,
        level: body?.level,
        manager: body?.manager,
      };

      await this.courseRepository.updateCourseById(id, bodyParse);
    } else {
      throw new NotFoundException('Không tìm thấy khoá học trong hệ thống.');
    }
  }

  async deleteCourses(ids: string[]) {
    if (ids.length > 0) {
      const idsArray = ids;

      await this.courseRepository
        .createQueryBuilder('course')
        .delete()
        .where('course.id IN (:...ids)', { ids: idsArray })
        .execute();
    }
  }

  async getCoursesAvailable() {
    const data = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoin('course.manager', 'manager')
      .select([
        'course.id',
        'course.image',
        'course.name',
        'course.description',
        'course.sellingPrice',
        'course.retailPrice',
        'course.status',
        'course.level',
        'manager.name',
        'manager.avatar',
      ])
      .where('course.status IN (:...statuses)', {
        statuses: [ECourseStatus.PUBLIC, ECourseStatus.COMING_SOON],
      })
      .addOrderBy('course.createdAt', 'ASC')
      .getMany();

    const totalExercises = {};
    for await (const item of data) {
      const totalCourseExercises = await this.exerciseRepository.count({
        where: { course: item.id, status: EExerciseStatus.PUBLIC },
      });
      totalExercises[item.id] = totalCourseExercises;
    }

    const totalDurations = {};
    for await (const item of data) {
      const exercises = await this.exerciseRepository
        .createQueryBuilder('exercise')
        .select(['exercise.videoDuration'])
        .where('exercise.course = :courseId', { courseId: item.id })
        .andWhere('exercise.status = :status', {
          status: EExerciseStatus.PUBLIC,
        })
        .getMany();

      const durations = exercises.reduce((result, item) => {
        return result + item.videoDuration || 0;
      }, 0);
      totalDurations[item.id] = durations;
    }

    const totalUsers = {};
    for await (const item of data) {
      const totalCourseUsers = await this.courseRepository
        .createQueryBuilder('course')
        .leftJoin('course.users', 'users')
        .select(['course.id', 'users.id'])
        .where('course.id = :id', { id: item.id })
        .getOne();

      totalUsers[item.id] = totalCourseUsers?.users?.length || 0;
    }

    return { data, totalDurations, totalExercises, totalUsers };
  }

  async registerCourse(user: DtoUserToken, id: string) {
    const data = await this.courseRepository.getCourseById(id);

    if (data && data.status === ECourseStatus.PUBLIC) {
      const userData = await this.userRepository.getUserById(user.id);

      if (userData) {
        const managerUsers = await this.userRepository
          .createQueryBuilder('user')
          .select(['user.id', 'user.email'])
          .where('user.status = :status', { status: EUserStatus.ACTIVE })
          .andWhere('user.role = :role', { role: EUserRole.MANAGER })
          .getMany();

        for await (const manager of managerUsers) {
          const bodyParse = {
            message: `đã gửi yêu cầu đăng ký khoá học: "${data?.name}"`,
            fromUser: userData.id,
            toUser: manager.id,
            type: ENotificationType.REGISTER_COURSE,
            data: {
              course: {
                id: data?.id,
                name: data?.name,
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
            message: `${userData?.name} đã gửi yêu cầu đăng ký khoá học: "${data?.name}"`,
            buttonLink: `${env.rootUrl}/users-management`,
          });
        }
      } else {
        throw new NotFoundException(
          'Không tìm thấy người dùng trong hệ thống.',
        );
      }
    } else {
      throw new NotFoundException('Không tìm thấy khoá học trong hệ thống.');
    }
  }

  async getMyCourses(user: DtoUserToken) {
    const data = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoin('course.users', 'users')
      .select(['course.id', 'course.name'])
      .where('users.id = :id', { id: user?.id })
      .andWhere('course.status = :status', { status: ECourseStatus.PUBLIC })
      .getMany();

    const dataWithExercises = await Promise.all(
      data.map(async (course) => {
        const userExercises = await this.userExerciseRepository
          .createQueryBuilder('userExercise')
          .leftJoin('userExercise.exercise', 'exercise')
          .leftJoin('exercise.lessons', 'lessons')
          .select([
            'userExercise.id',
            'userExercise.isPass',
            'exercise.id',
            'exercise.name',
            'exercise.description',
            'lessons.id',
          ])
          .where('exercise.course = :id', { id: course.id })
          .andWhere('userExercise.user = :userId', { userId: user.id })
          .andWhere('exercise.status = :status', {
            status: EExerciseStatus.PUBLIC,
          })
          .orderBy('exercise.createdAt', 'ASC')
          .getMany();

        const idsExercises = userExercises.map(
          (item) => (item.exercise as any)?.id,
        );

        const userLessons = await this.userLessonRepository
          .createQueryBuilder('userLesson')
          .leftJoin('userLesson.lesson', 'lesson')
          .leftJoin('lesson.exercise', 'exercise')
          .select([
            'userLesson.id',
            'userLesson.isPass',
            'lesson.id',
            'exercise.id',
          ])
          .where('exercise.id IN (:...ids)', { ids: idsExercises })
          .andWhere('userLesson.user = :userId', { userId: user.id })
          .andWhere('lesson.status = :status', {
            status: ELessonStatus.PUBLIC,
          })
          .orderBy('lesson.createdAt', 'ASC')
          .getMany();

        return {
          ...course,
          userExercises,
          userLessons,
        };
      }),
    );

    return { data: dataWithExercises };
  }

  async getMyCourseExercise(user: DtoUserToken, id: string) {
    const data = await this.userExerciseRepository
      .createQueryBuilder('userExercise')
      .leftJoin('userExercise.exercise', 'exercise')
      .select([
        'userExercise.id',
        'userExercise.isPass',
        'exercise.id',
        'exercise.name',
        'exercise.description',
        'exercise.videoUrl',
        'exercise.videoDuration',
        'exercise.course',
      ])
      .where('userExercise.user = :userId', { userId: user.id })
      .andWhere('userExercise.id = :id', { id })
      .andWhere('exercise.status = :status', { status: EExerciseStatus.PUBLIC })
      .getOne();

    if (data) {
      const userExercises = await this.userExerciseRepository
        .createQueryBuilder('userExercise')
        .leftJoin('userExercise.exercise', 'exercise')
        .leftJoin('exercise.lessons', 'lessons')
        .select([
          'userExercise.id',
          'userExercise.isPass',
          'exercise.id',
          'exercise.name',
          'exercise.description',
          'lessons.id',
        ])
        .where('exercise.course = :id', { id: (data?.exercise as any)?.course })
        .andWhere('userExercise.user = :userId', { userId: user.id })
        .andWhere('exercise.status = :status', {
          status: EExerciseStatus.PUBLIC,
        })
        .orderBy('exercise.createdAt', 'ASC')
        .getMany();

      const idsExercises = userExercises.map(
        (item) => (item.exercise as any)?.id,
      );

      const userLessons = await this.userLessonRepository
        .createQueryBuilder('userLesson')
        .leftJoin('userLesson.lesson', 'lesson')
        .leftJoin('lesson.exercise', 'exercise')
        .select([
          'userLesson.id',
          'userLesson.isPass',
          'lesson.id',
          'lesson.name',
          'lesson.type',
          'exercise.id',
        ])
        .where('exercise.id IN (:...ids)', { ids: idsExercises })
        .andWhere('userLesson.user = :userId', { userId: user.id })
        .andWhere('lesson.status = :status', {
          status: ELessonStatus.PUBLIC,
        })
        .orderBy('lesson.createdAt', 'ASC')
        .getMany();

      const lessons = await this.lessonRepository
        .createQueryBuilder('lesson')
        .leftJoin('lesson.questions', 'questions')
        .select(['lesson.id', 'questions.id'])
        .where('lesson.exercise = :exerciseId', {
          exerciseId: (data?.exercise as any)?.id,
        })
        .andWhere('lesson.status = :status', {
          status: ELessonStatus.PUBLIC,
        })
        .getMany();

      const totalQuestions = lessons?.reduce((result, item) => {
        return {
          ...result,
          [item.id]: item?.questions?.length || 0,
        };
      }, {});

      const activeIndex = userExercises?.findIndex((userExercise) => {
        const isAtLeastOneLessonNotCompleted = (
          userLessons?.filter((userLesson) =>
            (userExercise?.exercise as any)?.lessons
              ?.map((lesson) => lesson.id)
              ?.includes((userLesson?.lesson as any)?.id),
          ) || []
        )?.some((subItem) => !subItem.isPass);

        return (
          !userExercise.isPass ||
          (userExercise.isPass && isAtLeastOneLessonNotCompleted)
        );
      });

      const currentIndex =
        userExercises?.findIndex((userExercise) => userExercise?.id === id) ||
        0;

      const isLock = currentIndex > activeIndex;

      const tests = await this.testRepository
        .createQueryBuilder('test')
        .leftJoin('test.userLesson', 'userLesson')
        .select(['test.id', 'userLesson.id'])
        .where('test.userExercise = :id', { id })
        .andWhere('test.user = :userId', { userId: user?.id })
        .getMany();

      if (isLock) {
        throw new BadRequestException(
          'Bạn chưa mở được bài học này. Vui lòng hoàn thành các bài học trước đó.',
        );
      } else {
        return { data, userLessons, userExercises, totalQuestions, tests };
      }
    } else {
      throw new NotFoundException('Không tìm thấy bài học trong hệ thống.');
    }
  }

  async updateIsPassExercise(id: string) {
    const body = { isPass: true };
    await this.userExerciseRepository.update({ id }, body);
  }

  async getMyCourseLesson(user: DtoUserToken, id: string) {
    const data = await this.userLessonRepository
      .createQueryBuilder('userLesson')
      .leftJoin('userLesson.lesson', 'lesson')
      .leftJoin('lesson.exercise', 'exercise')
      .leftJoin('lesson.questions', 'questions')
      .select([
        'userLesson.id',
        'userLesson.isPass',
        'exercise.id',
        'exercise.name',
        'lesson.id',
        'lesson.name',
        'lesson.type',
        'lesson.arrange',
        'questions.id',
        'questions.question',
        'questions.index',
        'questions.answers',
      ])
      .where('userLesson.user = :userId', { userId: user.id })
      .andWhere('userLesson.id = :id', { id })
      .andWhere('lesson.status = :status', { status: EExerciseStatus.PUBLIC })
      .getOne();

    if (data) {
      const dataLesson = data?.lesson as any;

      const parseQuestionsRemoveIsCorrect = dataLesson?.questions?.map(
        (question) => ({
          ...question,
          answers: question?.answers?.map((answer) => ({
            id: answer.id,
            title: answer.title,
          })),
        }),
      );

      if ((data?.lesson as any)?.arrange === ELessonArrange.RANDOM) {
        const shuffleQuestions = shuffle(parseQuestionsRemoveIsCorrect);
        (data?.lesson as any).questions = shuffleQuestions;
      } else {
        const orderQuestions = orderBy(
          parseQuestionsRemoveIsCorrect,
          'index',
          'asc',
        );
        (data?.lesson as any).questions = orderQuestions;
      }

      const userExercise = await this.userExerciseRepository
        .createQueryBuilder('userExercise')
        .select(['userExercise.id', 'userExercise.exercise'])
        .where('userExercise.user = :userId', { userId: user?.id })
        .andWhere('userExercise.exercise = :exerciseId', {
          exerciseId: (data as any)?.lesson?.exercise?.id,
        })
        .getOne();

      const userLessons = await this.userLessonRepository
        .createQueryBuilder('userLesson')
        .leftJoin('userLesson.lesson', 'lesson')
        .leftJoin('lesson.exercise', 'exercise')
        .select([
          'userLesson.id',
          'userLesson.isPass',
          'lesson.id',
          'lesson.name',
          'lesson.type',
          'exercise.id',
        ])
        .where('exercise.id = :id', { id: userExercise?.exercise })
        .andWhere('userLesson.user = :userId', { userId: user.id })
        .andWhere('lesson.status = :status', {
          status: ELessonStatus.PUBLIC,
        })
        .orderBy('lesson.createdAt', 'ASC')
        .getMany();

      const currentIndexLesson = userLessons.findIndex(
        (item) => item.id === id,
      );

      const nextLesson = userLessons?.[currentIndexLesson + 1];

      return { data, userExercise, nextLesson };
    } else {
      throw new NotFoundException('Không tìm thấy bài tập trong hệ thống.');
    }
  }
}
