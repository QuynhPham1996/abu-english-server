import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brackets } from 'typeorm';
import { orderBy, shuffle } from 'lodash';
import { nestQuestions } from 'src/modules/repositories/question.repository';

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
  ETestStatus,
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
import { AssignmentRepository } from 'src/modules/repositories/assignment.repository';
import { QuestionRepository } from 'src/modules/repositories/question.repository';
import { UserLessonService } from 'src/modules/apis/userLesson/userLesson.service';
import { DtoAttachAssignmentsBody } from 'src/modules/apis/exercise/dto/attach-assignments.dto';

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
    private readonly assignmentRepository: AssignmentRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly userLessonService: UserLessonService,
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

    const gradedTests = await this.testRepository
      .createQueryBuilder('test')
      .leftJoin('test.lesson', 'lesson')
      .select(['test.id', 'lesson.id'])
      .where('test.user = :userId', { userId: user.id })
      .andWhere('test.status = :status', { status: ETestStatus.SUCCESS })
      .getMany();
    const gradedLessonIds = gradedTests
      .map((item) => (item.lesson as any)?.id)
      .filter((item) => !!item);

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

        const idsExercises = userExercises
          .map((item) => (item.exercise as any)?.id)
          .filter((item) => !!item);

        const userLessons =
          idsExercises.length === 0
            ? []
            : await this.userLessonRepository
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

        const courseLessons = await this.userLessonRepository
          .createQueryBuilder('userLesson')
          .leftJoin('userLesson.lesson', 'lesson')
          .select([
            'userLesson.id',
            'userLesson.isPass',
            'lesson.id',
            'lesson.name',
            'lesson.type',
          ])
          .where('lesson.course = :courseId', { courseId: course.id })
          .andWhere('userLesson.user = :userId', { userId: user.id })
          .andWhere('lesson.status = :status', {
            status: ELessonStatus.PUBLIC,
          })
          .orderBy('lesson.index', 'ASC')
          .getMany();

        return {
          ...course,
          userExercises,
          userLessons: [...userLessons, ...courseLessons],
          courseLessons,
          gradedLessonIds,
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

      const courseId = (data?.exercise as any)?.course;
      const courseLessons = courseId
        ? await this.userLessonRepository
            .createQueryBuilder('userLesson')
            .leftJoin('userLesson.lesson', 'lesson')
            .select([
              'userLesson.id',
              'userLesson.isPass',
              'lesson.id',
              'lesson.name',
              'lesson.type',
            ])
            .where('lesson.course = :courseId', { courseId })
            .andWhere('userLesson.user = :userId', { userId: user.id })
            .andWhere('lesson.status = :status', {
              status: ELessonStatus.PUBLIC,
            })
            .getMany()
        : [];

      const lessons = await this.lessonRepository
        .createQueryBuilder('lesson')
        .leftJoin('lesson.questions', 'questions')
        .select(['lesson.id', 'questions.id'])
        .where('lesson.exercise IN (:...ids)', { ids: idsExercises })
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

      const foundIndex = userExercises?.findIndex(
        (userExercise) => userExercise?.id === id,
      );
      const currentIndex = foundIndex > -1 ? foundIndex : 0;

      const isLock = activeIndex !== -1 && currentIndex > activeIndex;

      const lessonNames = [
        ...new Set(
          [...userLessons, ...courseLessons]
            .map((item) => (item.lesson as any)?.name)
            .filter((name) => !!name),
        ),
      ];
      const testsQuery = this.testRepository
        .createQueryBuilder('test')
        .leftJoin('test.userLesson', 'userLesson')
        .leftJoin('test.lesson', 'lesson')
        .select([
          'test.id',
          'test.status',
          'userLesson.id',
          'lesson.id',
          'lesson.name',
        ])
        .where('test.user = :userId', { userId: user?.id });

      if (lessonNames.length) {
        testsQuery.andWhere(
          new Brackets((qb) => {
            qb.where('test.userExercise = :id', { id }).orWhere(
              'lesson.name IN (:...lessonNames)',
              { lessonNames },
            );
          }),
        );
      } else {
        testsQuery.andWhere('test.userExercise = :id', { id });
      }

      const tests = await testsQuery.getMany();
      const gradedLessonIds = tests
        .filter((item) => item.status === ETestStatus.SUCCESS)
        .map((item) => (item.lesson as any)?.id)
        .filter((item) => !!item);

      if (isLock) {
        throw new BadRequestException(
          'Bạn chưa mở được bài học này. Vui lòng hoàn thành các bài học trước đó.',
        );
      } else {
        return {
          data,
          userLessons: [...userLessons, ...courseLessons],
          userExercises,
          totalQuestions,
          tests,
          gradedLessonIds,
        };
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
        'lesson.course',
        'questions.id',
        'questions.question',
        'questions.index',
        'questions.answers',
        'questions.type',
        'questions.parentId',
      ])
      .where('userLesson.user = :userId', { userId: user.id })
      .andWhere('userLesson.id = :id', { id })
      .andWhere('lesson.status = :status', { status: EExerciseStatus.PUBLIC })
      .getOne();

    if (data) {
      const dataLesson = data?.lesson as any;

      const parseQuestionsRemoveIsCorrect = nestQuestions(
        dataLesson?.questions?.map((question) => ({
          ...question,
          answers: question?.answers?.map((answer) => ({
            id: answer.id,
            title: answer.title,
          })),
        })) || [],
      );

      if ((data?.lesson as any)?.arrange === ELessonArrange.RANDOM) {
        (data?.lesson as any).questions = shuffle(parseQuestionsRemoveIsCorrect);
      } else {
        (data?.lesson as any).questions = orderBy(
          parseQuestionsRemoveIsCorrect,
          'index',
          'asc',
        );
      }

      const userExercise = await this.userExerciseRepository
        .createQueryBuilder('userExercise')
        .select(['userExercise.id', 'userExercise.exercise'])
        .where('userExercise.user = :userId', { userId: user?.id })
        .andWhere('userExercise.exercise = :exerciseId', {
          exerciseId: (data as any)?.lesson?.exercise?.id,
        })
        .getOne();

      const lessonCourseId = (data as any)?.lesson?.course;
      const userLessons = lessonCourseId
        ? await this.userLessonRepository
            .createQueryBuilder('userLesson')
            .leftJoin('userLesson.lesson', 'lesson')
            .select([
              'userLesson.id',
              'userLesson.isPass',
              'lesson.id',
              'lesson.name',
              'lesson.type',
            ])
            .where('lesson.course = :id', { id: lessonCourseId })
            .andWhere('userLesson.user = :userId', { userId: user.id })
            .andWhere('lesson.status = :status', {
              status: ELessonStatus.PUBLIC,
            })
            .orderBy('lesson.index', 'ASC')
            .getMany()
        : await this.userLessonRepository
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

  async getCourseAssignments(id: string) {
    const course = await this.courseRepository.getCourseById(id);

    if (!course) {
      throw new NotFoundException('Không tìm thấy khoá học trong hệ thống.');
    }

    const data = await this.lessonRepository
      .createQueryBuilder('lesson')
      .leftJoin('lesson.questions', 'questions')
      .select([
        'lesson.id',
        'lesson.name',
        'lesson.type',
        'lesson.status',
        'lesson.index',
        'lesson.sourceAssignment',
        'questions.id',
      ])
      .where('lesson.course = :id', { id })
      .orderBy('lesson.index', 'ASC')
      .getMany();

    return { data };
  }

  async attachCourseAssignments(id: string, body: DtoAttachAssignmentsBody) {
    const course = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoin('course.users', 'users')
      .select(['course.id', 'users.id'])
      .where('course.id = :id', { id })
      .getOne();

    if (!course) {
      throw new NotFoundException('Không tìm thấy khoá học trong hệ thống.');
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
      .select(['lesson.id', 'lesson.index', 'lesson.name', 'lesson.sourceAssignment'])
      .where('lesson.course = :id', { id })
      .getMany();

    const attachedSourceIds = new Set(
      existingLessons
        .map((item) => item.sourceAssignment)
        .filter((item) => !!item),
    );
    const attachedNames = new Set(
      existingLessons
        .map((item) => item.name?.trim().toLowerCase())
        .filter((item) => !!item),
    );
    const indexes = existingLessons.map((item) => item.index || 0);
    let nextIndex = indexes.length > 0 ? Math.max(...indexes) + 1 : 1;
    let attached = 0;
    let skipped = 0;

    for (const assignment of assignments) {
      if (
        attachedSourceIds.has(assignment.id) ||
        attachedNames.has(assignment.name?.trim().toLowerCase())
      ) {
        skipped += 1;
        continue;
      }

      const lessonCreated = await this.lessonRepository.save({
        name: assignment.name,
        type: assignment.type,
        arrange: assignment.arrange,
        status: assignment.status as any,
        course: id,
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
        const childQuestions = children.filter(
          (child) => child.parentId === question.id,
        );

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

      for await (const user of course.users || []) {
        await this.userLessonService.createUserLesson({
          user: user.id,
          lesson: lessonCreated.id,
        });
      }

      attachedSourceIds.add(assignment.id);
      attachedNames.add(assignment.name?.trim().toLowerCase());
      attached += 1;
    }

    return { attached, skipped };
  }
}
