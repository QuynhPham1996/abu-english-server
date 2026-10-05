import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';

import { QuestionBankService } from 'src/modules/apis/questionBank/questionBank.service';
import { DtoCreateQuestionBankBody } from 'src/modules/apis/questionBank/dto/create-question-bank.dto';
import { DtoDeleteQuestionBankQuery } from 'src/modules/apis/questionBank/dto/delete-question-bank.dto';
import { DtoGetQuestionBankQuery } from 'src/modules/apis/questionBank/dto/get-question-bank.dto';
import { DtoUpdateQuestionBankBody } from 'src/modules/apis/questionBank/dto/update-question-bank.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('question-bank')
export class QuestionBankController {
  constructor(private readonly questionBankService: QuestionBankService) {}

  @Get()
  async getQuestions(@Query() params: DtoGetQuestionBankQuery) {
    return await this.questionBankService.getQuestions(params);
  }

  @Get(':id')
  async getQuestion(@Param('id') id: string) {
    return await this.questionBankService.getQuestion(id);
  }

  @Post()
  async createQuestion(@Body() body: DtoCreateQuestionBankBody) {
    return await this.questionBankService.createQuestion(body);
  }

  @Patch(':id')
  async updateQuestion(
    @Param('id') id: string,
    @Body() body: DtoUpdateQuestionBankBody,
  ) {
    return await this.questionBankService.updateQuestion(id, body);
  }

  @Delete()
  async deleteQuestions(@Query() params: DtoDeleteQuestionBankQuery) {
    const idsArray = params.ids?.split(',') || [];
    return await this.questionBankService.deleteQuestions(idsArray);
  }
}
