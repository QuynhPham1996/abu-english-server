import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';

import { UserLessonService } from 'src/modules/apis/userLesson/userLesson.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('userLesson')
export class QuestionController {
  constructor(private readonly userLessonService: UserLessonService) {}
}
