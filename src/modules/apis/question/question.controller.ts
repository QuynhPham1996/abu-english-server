import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';

import { QuestionService } from 'src/modules/apis/question/question.service';
import { DtoCreateQuestionBody } from 'src/modules/apis/question/dto/create-question.dto';
import { DtoDeleteQuestionsQuery } from 'src/modules/apis/question/dto/delete-questions.dto';
import { DtoUpdateQuestionBody } from 'src/modules/apis/question/dto/update-question.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  async createQuestion(@Body() body: DtoCreateQuestionBody) {
    return await this.questionService.createQuestion(body);
  }

  @Patch(':id')
  async updateQuestion(
    @Param('id') id: string,
    @Body() body: DtoUpdateQuestionBody,
  ) {
    return await this.questionService.updateQuestion(id, body);
  }

  @Delete()
  async deleteQuestions(@Query() params: DtoDeleteQuestionsQuery) {
    const idsArray = params.ids?.split(',') || [];
    return await this.questionService.deleteQuestions(idsArray);
  }
}
