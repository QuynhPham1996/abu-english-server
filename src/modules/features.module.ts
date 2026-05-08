import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { jwtConfig } from 'src/configs/constants';

import { UploadController } from 'src/modules/apis/upload/upload.controller';
import { MailersController } from 'src/modules/apis/mailers/mailers.controller';
import { PublicController } from 'src/modules/apis/public/public.controller';

import { UserController } from 'src/modules/apis/user/user.controller';
import { NotificationController } from 'src/modules/apis/notification/notification.controller';
import { CourseController } from 'src/modules/apis/course/course.controller';
import { ExerciseController } from 'src/modules/apis/exercise/exercise.controller';
import { LessonController } from 'src/modules/apis/lesson/lesson.controller';
import { QuestionController } from 'src/modules/apis/question/question.controller';
import { TestController } from 'src/modules/apis/test/test.controller';

import { AuthService } from 'src/auth/auth.service';
import { UploadService } from 'src/modules/apis/upload/upload.service';
import { MailersService } from 'src/modules/apis/mailers/mailers.service';
import { PublicService } from 'src/modules/apis/public/public.service';

import { UserService } from 'src/modules/apis/user/user.service';
import { NotificationService } from 'src/modules/apis/notification/notification.service';
import { CourseService } from 'src/modules/apis/course/course.service';
import { ExerciseService } from 'src/modules/apis/exercise/exercise.service';
import { LessonService } from 'src/modules/apis/lesson/lesson.service';
import { QuestionService } from 'src/modules/apis/question/question.service';
import { UserExerciseService } from 'src/modules/apis/userExercise/userExercise.service';
import { UserLessonService } from 'src/modules/apis/userLesson/userLesson.service';
import { TestService } from 'src/modules/apis/test/test.service';

import { UserEntity } from 'src/modules/entities/user.entity';
import { NotificationEntity } from 'src/modules/entities/notification.entity';
import { CourseEntity } from 'src/modules/entities/course.entity';
import { ExerciseEntity } from 'src/modules/entities/exercise.entity';
import { LessonEntity } from 'src/modules/entities/lesson.entity';
import { QuestionEntity } from 'src/modules/entities/question.entity';
import { UserExerciseEntity } from 'src/modules/entities/userExercise.entity';
import { UserLessonEntity } from 'src/modules/entities/userLesson.entity';
import { TestEntity } from 'src/modules/entities/test.entity';

import { UserRepository } from 'src/modules/repositories/user.repository';
import { NotificationRepository } from 'src/modules/repositories/notification.repository';
import { CourseRepository } from 'src/modules/repositories/course.repository';
import { ExerciseRepository } from 'src/modules/repositories/exercise.repository';
import { LessonRepository } from 'src/modules/repositories/lesson.repository';
import { QuestionRepository } from 'src/modules/repositories/question.repository';
import { UserExerciseRepository } from 'src/modules/repositories/userExercise.repository';
import { UserLessonRepository } from 'src/modules/repositories/userLesson.repository';
import { TestRepository } from 'src/modules/repositories/test.repository';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConfig.secret,
      signOptions: {
        expiresIn: jwtConfig.expiresIn,
      },
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      NotificationEntity,
      CourseEntity,
      ExerciseEntity,
      LessonEntity,
      QuestionEntity,
      UserExerciseEntity,
      UserLessonEntity,
      TestEntity,
    ]),
  ],
  controllers: [
    UploadController,
    MailersController,
    PublicController,
    UserController,
    NotificationController,
    CourseController,
    ExerciseController,
    LessonController,
    QuestionController,
    TestController,
  ],
  providers: [
    AuthService,
    UploadService,
    MailersService,
    PublicService,

    UserRepository,
    UserService,

    NotificationRepository,
    NotificationService,

    CourseRepository,
    CourseService,

    ExerciseRepository,
    ExerciseService,

    LessonRepository,
    LessonService,

    QuestionRepository,
    QuestionService,

    UserExerciseRepository,
    UserExerciseService,

    UserLessonRepository,
    UserLessonService,

    TestRepository,
    TestService,
  ],
  exports: [UserService],
})
export class FeaturesModule {}
