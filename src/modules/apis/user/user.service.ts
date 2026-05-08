import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brackets } from 'typeorm';

import { DtoUserToken } from 'src/auth/dto/token-decode.dto';
import {
  ECourseStatus,
  EExerciseStatus,
  ELessonStatus,
  EUserRole,
} from 'src/common/enums';
import {
  comparePasswordAndHashPassword,
  generateHashPassword,
} from 'src/common/functions';
import { commonPagination } from 'src/common/helpers/pagination';
import { parseOrderBy } from 'src/common/helpers/sorter';
import { superAdminConfig } from 'src/configs/constants';
import { DtoCreateUserBody } from 'src/modules/apis/user/dto/create-user.dto';
import { DtoGetUsersQuery } from 'src/modules/apis/user/dto/get-users.dto';
import { DtoUpdateUserPasswordBody } from 'src/modules/apis/user/dto/update-user-password.dto';
import { DtoUpdateUserBody } from 'src/modules/apis/user/dto/update-user.dto';
import { UserRepository } from 'src/modules/repositories/user.repository';
import { DtoUpdateMyProfilePasswordBody } from 'src/modules/apis/user/dto/update-my-profile-password.dto';
import { DtoUpdateMyProfileBody } from 'src/modules/apis/user/dto/update-my-profile.dto';
import { DtoAddCoursesToUserBody } from 'src/modules/apis/user/dto/add-courses-to-user.dto';
import { CourseRepository } from 'src/modules/repositories/course.repository';
import { UserExerciseService } from 'src/modules/apis/userExercise/userExercise.service';
import { ExerciseRepository } from 'src/modules/repositories/exercise.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly courseRepository: CourseRepository,
    private readonly exerciseRepository: ExerciseRepository,
    private readonly userExerciseService: UserExerciseService,
  ) {
    this._dataDefault();
  }

  async getUsers(params: DtoGetUsersQuery) {
    const qb = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.courses', 'courses')

      .leftJoin('user.userExercises', 'userExercises')
      .leftJoin(
        'userExercises.exercise',
        'userExercise',
        'userExercise.status = :exerciseStatus',
        { exerciseStatus: EExerciseStatus.PUBLIC },
      )
      .leftJoin('userExercise.course', 'exerciseCourse')

      .leftJoin('user.userLessons', 'userLessons')
      .leftJoin(
        'userLessons.lesson',
        'userLesson',
        'userLesson.status = :lessonStatus',
        { lessonStatus: ELessonStatus.PUBLIC },
      )
      .leftJoin('userLesson.exercise', 'lessonExercise')
      .leftJoin('lessonExercise.course', 'lessonCourse')

      .select([
        'user.id',
        'user.avatar',
        'user.name',
        'user.email',
        'user.username',
        'user.phoneNumber',
        'user.status',
        'user.role',
        'user.createdAt',
        'user.updatedAt',
        'courses.id',
        'courses.name',

        'userExercises.id',
        'userExercises.isPass',
        'userExercise.id',
        'exerciseCourse.id',

        'userLessons.id',
        'userLessons.isPass',
        'userLesson.id',
        'lessonExercise.id',
        'lessonCourse.id',
      ])
      .where('user.role != :role', { role: EUserRole.SUPER_ADMIN });

    if (params.search) {
      qb.andWhere(
        new Brackets((subQ) => {
          subQ
            .orWhere('user.name LIKE :search', {
              search: `%${params.search}%`,
            })
            .orWhere('user.username LIKE :search', {
              search: `%${params.search}%`,
            })
            .orWhere('user.email LIKE :search', {
              search: `%${params.search}%`,
            })
            .orWhere('user.phoneNumber LIKE :search', {
              search: `%${params.search}%`,
            });
        }),
      );
    }

    if (params?.status) {
      qb.andWhere('user.status IN (:...statuses)', {
        statuses: params?.status?.split(','),
      });
    }

    if (params?.role) {
      qb.andWhere('user.role IN (:...roles)', {
        roles: params?.role?.split(','),
      });
    }

    const sort = parseOrderBy(params.sort);

    if (sort) {
      const [key, dir] = sort;
      const [relationField, relationKey] = key.split('.');

      if (relationField && relationKey) {
        qb.addOrderBy(`${relationField}.${relationKey}`, dir as any);
      } else {
        qb.addOrderBy(`user.${key}`, dir as any);
      }
    } else {
      qb.orderBy('user.createdAt', 'DESC');
    }

    const dataPaginate = await commonPagination(params, qb);

    return dataPaginate;
  }

  async getMyProfile(user: DtoUserToken) {
    const data = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.avatar',
        'user.name',
        'user.email',
        'user.username',
        'user.phoneNumber',
        'user.status',
        'user.role',
        'user.createdAt',
        'user.updatedAt',
      ])
      .where('user.id = :id', { id: user.id })
      .getOne();

    if (data) {
      return {
        data,
      };
    } else {
      throw new NotFoundException('Không tìm thấy người dùng trong hệ thống.');
    }
  }

  async createUser(body: DtoCreateUserBody) {
    const existedUser = await this.userRepository.getExistedUserExceptId(
      undefined,
      {
        username: body.username,
        email: body.email,
        phoneNumber: body.phoneNumber,
      },
    );

    if (existedUser) {
      throw new BadRequestException(
        'Tên đăng nhập, email hoặc số điện thoại đã có người dùng sử dụng trong hệ thống.',
      );
    }

    const hashPassword = await generateHashPassword(body.password);

    const bodyParse = {
      avatar: body?.avatar,
      username: body.username,
      email: body?.email,
      phoneNumber: body?.phoneNumber,
      name: body.name,
      password: hashPassword,
      status: body?.status,
      role: body?.role,
    };

    await this.userRepository.save(bodyParse);
  }

  async updateUser(id: string, body: DtoUpdateUserBody) {
    const data = await this.userRepository.getUserById(id);

    if (data) {
      const existedUser = await this.userRepository.getExistedUserExceptId(id, {
        username: undefined,
        email: body.email,
        phoneNumber: body.phoneNumber,
      });

      if (existedUser) {
        throw new BadRequestException(
          'Tên đăng nhập, email hoặc số điện thoại đã có người dùng sử dụng trong hệ thống.',
        );
      }

      const bodyParse = {
        avatar: body?.avatar,
        email: body?.email,
        phoneNumber: body?.phoneNumber,
        name: body?.name,
        status: body?.status,
      };

      await this.userRepository.updateUserById(id, bodyParse);
    } else {
      throw new NotFoundException('Không tìm thấy người dùng trong hệ thống.');
    }
  }

  async deleteUsers(req: DtoUserToken, ids: string[]) {
    if (ids.length > 0) {
      const idsArray = ids?.filter((id) => id !== req.id);

      const coursesEntity = await this.courseRepository
        .createQueryBuilder('course')
        .leftJoin('course.users', 'users')
        .select(['course.id', 'users'])
        .where('users.id IN (:...ids)', { ids: idsArray })
        .getMany();

      for await (const courseEntity of coursesEntity) {
        courseEntity.users = courseEntity.users.filter(
          (user) => !idsArray.includes(user.id),
        );
        await this.courseRepository.save(courseEntity);
      }

      await this.userRepository
        .createQueryBuilder('user')
        .delete()
        .where('user.id IN (:...ids)', { ids: idsArray })
        .andWhere('user.role != :role', { role: EUserRole.SUPER_ADMIN })
        .execute();
    }
  }

  async updateUserToken(id: string, body: { token: string[] | null }) {
    await this.userRepository.updateUserTokenById(id, body);
  }

  async updateMyProfile(user: DtoUserToken, body: DtoUpdateMyProfileBody) {
    const data = await this.userRepository.getUserById(user?.id);

    if (data) {
      const existedUser = await this.userRepository.getExistedUserExceptId(
        user?.id,
        {
          username: undefined,
          email: body.email,
          phoneNumber: body.phoneNumber,
        },
      );

      if (existedUser) {
        throw new BadRequestException(
          'Tên đăng nhập, email hoặc số điện thoại đã có người dùng sử dụng trong hệ thống.',
        );
      }

      const bodyParse = {
        avatar: body?.avatar,
        email: body?.email,
        phoneNumber: body?.phoneNumber,
        name: body?.name,
      };

      await this.userRepository.updateUserById(user.id, bodyParse);
    } else {
      throw new NotFoundException('Không tìm thấy người dùng trong hệ thống.');
    }
  }

  async updateMyProfilePassword(
    user: DtoUserToken,
    body: DtoUpdateMyProfilePasswordBody,
  ) {
    const data = await this.userRepository.getUserById(user?.id);

    if (data) {
      const isMatch = await comparePasswordAndHashPassword(
        body.oldPassword,
        data.password,
      );

      if (isMatch) {
        const hashPassword = await generateHashPassword(body?.newPassword);
        const bodyParse = {
          password: hashPassword,
        };
        await this.userRepository.updateUserById(data?.id, bodyParse);
      } else {
        throw new NotFoundException('Mật khẩu cũ không chính xác.');
      }
    } else {
      throw new NotFoundException('Không tìm thấy người dùng trong hệ thống.');
    }
  }

  async updateUserPassword(id: string, body: DtoUpdateUserPasswordBody) {
    const hashPassword = await generateHashPassword(body?.newPassword);
    const bodyParse = {
      password: hashPassword,
    };

    await this.userRepository.updateUserById(id, bodyParse);
  }

  async getUserByUserName(username: string) {
    return await this.userRepository.getUserByUserName(username);
  }

  async getUserByEmail(email: string) {
    return await this.userRepository.getUserByEmail(email);
  }

  async _dataDefault() {
    const isExistedSuperAdmin = await this.userRepository.findOne({
      where: { role: EUserRole.SUPER_ADMIN },
    });

    if (!isExistedSuperAdmin) {
      const hashPassword = await generateHashPassword(
        superAdminConfig.password,
      );

      const bodyDefault = {
        username: superAdminConfig.username,
        email: superAdminConfig.email,
        password: hashPassword,
        name: 'Super Admin',
        role: EUserRole.SUPER_ADMIN,
      };

      await this.userRepository.save(bodyDefault);
    }
  }

  async addCoursesToUser(id: string, body: DtoAddCoursesToUserBody) {
    const data = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.courses', 'courses')
      .select(['user.id', 'courses'])
      .where('user.id = :id', { id })
      .getOne();

    if (data) {
      const coursesEntityArray = [];

      for await (const courseId of body.courses) {
        const courseEntity = await this.courseRepository
          .createQueryBuilder('course')
          .leftJoin('course.users', 'users')
          .select(['course', 'users'])
          .where('course.id = :id', { id: courseId })
          .andWhere('course.status = :status', { status: ECourseStatus.PUBLIC })
          .getOne();

        if (courseEntity) {
          coursesEntityArray.push(courseEntity);
          courseEntity.users.push(data);
          await this.courseRepository.save(courseEntity);
        }
      }

      const existedUserCoursesId = data.courses?.map((course) => course.id);
      const removeCourses = existedUserCoursesId?.filter(
        (existedCourse) => !body?.courses?.includes(existedCourse),
      );

      if (removeCourses?.length > 0) {
        const coursesEntity = await this.courseRepository
          .createQueryBuilder('course')
          .leftJoin('course.users', 'users')
          .select(['course', 'users'])
          .where('course.id IN (:...ids)', { ids: removeCourses })
          .getMany();

        for await (const courseEntity of coursesEntity) {
          courseEntity.users = courseEntity.users.filter(
            (user) => user.id !== data?.id,
          );
          await this.courseRepository.save(courseEntity);
        }
      }

      data.courses = coursesEntityArray;
      await this.userRepository.save(data);

      for await (const coursesEntity of coursesEntityArray) {
        const exercisesInCourse = await this.exerciseRepository
          .createQueryBuilder('exercise')
          .select(['exercise.id'])
          .where('exercise.course = :courseId', { courseId: coursesEntity.id })
          .andWhere('exercise.status = :status', {
            status: EExerciseStatus.PUBLIC,
          })
          .getMany();

        for await (const exerciseEntity of exercisesInCourse) {
          const body = {
            user: data?.id,
            exercise: exerciseEntity?.id,
          };

          await this.userExerciseService.createUserExercise(body);
        }
      }
    } else {
      throw new NotFoundException('Không tìm thấy người dùng trong hệ thống.');
    }
  }
}
