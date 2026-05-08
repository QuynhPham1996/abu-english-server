import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';

import { UserExerciseService } from 'src/modules/apis/userExercise/userExercise.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('userExercise')
export class QuestionController {
  constructor(private readonly userExerciseService: UserExerciseService) {}
}
