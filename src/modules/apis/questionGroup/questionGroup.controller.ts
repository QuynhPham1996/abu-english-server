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

import { QuestionGroupService } from 'src/modules/apis/questionGroup/questionGroup.service';
import { DtoCreateQuestionGroupBody } from 'src/modules/apis/questionGroup/dto/create-question-group.dto';
import { DtoDeleteQuestionGroupsQuery } from 'src/modules/apis/questionGroup/dto/delete-question-groups.dto';
import { DtoGetQuestionGroupsQuery } from 'src/modules/apis/questionGroup/dto/get-question-groups.dto';
import { DtoUpdateQuestionGroupBody } from 'src/modules/apis/questionGroup/dto/update-question-group.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('question-groups')
export class QuestionGroupController {
  constructor(private readonly questionGroupService: QuestionGroupService) {}

  @Get()
  async getQuestionGroups(@Query() params: DtoGetQuestionGroupsQuery) {
    return await this.questionGroupService.getQuestionGroups(params);
  }

  @Get(':id')
  async getQuestionGroup(@Param('id') id: string) {
    return await this.questionGroupService.getQuestionGroup(id);
  }

  @Post()
  async createQuestionGroup(@Body() body: DtoCreateQuestionGroupBody) {
    return await this.questionGroupService.createQuestionGroup(body);
  }

  @Patch(':id')
  async updateQuestionGroup(
    @Param('id') id: string,
    @Body() body: DtoUpdateQuestionGroupBody,
  ) {
    return await this.questionGroupService.updateQuestionGroup(id, body);
  }

  @Delete()
  async deleteQuestionGroups(@Query() params: DtoDeleteQuestionGroupsQuery) {
    const idsArray = params.ids?.split(',') || [];
    return await this.questionGroupService.deleteQuestionGroups(idsArray);
  }
}
