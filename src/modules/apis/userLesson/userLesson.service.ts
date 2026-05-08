import { Injectable } from '@nestjs/common';
import { DtoCreateUserLessonBody } from 'src/modules/apis/userLesson/dto/create-userLesson.dto';

import { UserLessonRepository } from 'src/modules/repositories/userLesson.repository';

@Injectable()
export class UserLessonService {
  constructor(private readonly userLessonRepository: UserLessonRepository) {}

  async createUserLesson(body: DtoCreateUserLessonBody) {
    const existedUserLesson = await this.userLessonRepository
      .createQueryBuilder('userLesson')
      .where('userLesson.user = :userId', { userId: body?.user })
      .andWhere('userLesson.lesson = :lessonId', {
        lessonId: body?.lesson,
      })
      .getOne();

    if (!existedUserLesson) {
      const bodyParse = {
        user: body?.user,
        lesson: body?.lesson,
      };
      await this.userLessonRepository.save(bodyParse);
    }
  }
}
