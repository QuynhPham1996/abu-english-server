import { Injectable } from '@nestjs/common';
import { EExerciseStatus } from 'src/common/enums';
import { DtoCreateUserExerciseBody } from 'src/modules/apis/userExercise/dto/create-userExercise.dto';
import { UserLessonService } from 'src/modules/apis/userLesson/userLesson.service';
import { LessonRepository } from 'src/modules/repositories/lesson.repository';

import { UserExerciseRepository } from 'src/modules/repositories/userExercise.repository';

@Injectable()
export class UserExerciseService {
  constructor(
    private readonly userExerciseRepository: UserExerciseRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly userLessonService: UserLessonService,
  ) {}

  async createUserExercise(body: DtoCreateUserExerciseBody) {
    const existedUserExercise = await this.userExerciseRepository
      .createQueryBuilder('userExercise')
      .where('userExercise.user = :userId', { userId: body?.user })
      .andWhere('userExercise.exercise = :exerciseId', {
        exerciseId: body?.exercise,
      })
      .getOne();

    if (!existedUserExercise) {
      const bodyParse = {
        user: body?.user,
        exercise: body?.exercise,
      };
      await this.userExerciseRepository.save(bodyParse);
    }

    const lessonsInExercise = await this.lessonRepository
      .createQueryBuilder('lesson')
      .select(['lesson.id'])
      .where('lesson.exercise = :exerciseId', { exerciseId: body?.exercise })
      .andWhere('lesson.status = :status', {
        status: EExerciseStatus.PUBLIC,
      })
      .getMany();

    for await (const lessonEntity of lessonsInExercise) {
      const bodyUserLesson = {
        user: body?.user,
        lesson: lessonEntity?.id,
      };
      await this.userLessonService.createUserLesson(bodyUserLesson);
    }
  }
}
