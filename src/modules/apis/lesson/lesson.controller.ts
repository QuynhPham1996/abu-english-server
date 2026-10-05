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

import { LessonService } from 'src/modules/apis/lesson/lesson.service';
import { DtoCreateLessonBody } from 'src/modules/apis/lesson/dto/create-lesson.dto';
import { DtoDeleteLessonsQuery } from 'src/modules/apis/lesson/dto/delete-lessons.dto';
import { DtoUpdateLessonBody } from 'src/modules/apis/lesson/dto/update-lesson.dto';
import { DtoUpdateLessonQuestionsIndexBody } from 'src/modules/apis/lesson/dto/update-lesson-questions-index.dto';
import { DtoAddLessonQuestionsBody } from 'src/modules/apis/lesson/dto/add-lesson-questions.dto';
import { DtoAddLessonGroupBody } from 'src/modules/apis/lesson/dto/add-lesson-group.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Get(':exerciseId')
  async getLessons(@Param('exerciseId') exerciseId: string) {
    return await this.lessonService.getLessons(exerciseId);
  }

  @Post()
  async createLesson(@Body() body: DtoCreateLessonBody) {
    return await this.lessonService.createLesson(body);
  }

  @Post(':id/questions')
  async addQuestions(
    @Param('id') id: string,
    @Body() body: DtoAddLessonQuestionsBody,
  ) {
    return await this.lessonService.addQuestions(id, body);
  }

  @Post(':id/groups')
  async addGroup(@Param('id') id: string, @Body() body: DtoAddLessonGroupBody) {
    return await this.lessonService.addGroup(id, body);
  }

  @Patch(':id')
  async updateLesson(
    @Param('id') id: string,
    @Body() body: DtoUpdateLessonBody,
  ) {
    return await this.lessonService.updateLesson(id, body);
  }

  @Patch(':id/questions-index')
  async updateLessonQuestionsIndex(
    @Param('id') id: string,
    @Body() body: DtoUpdateLessonQuestionsIndexBody,
  ) {
    return await this.lessonService.updateLessonQuestionsIndex(id, body);
  }

  @Delete()
  async deleteLessons(@Query() params: DtoDeleteLessonsQuery) {
    const idsArray = params.ids?.split(',') || [];
    return await this.lessonService.deleteLessons(idsArray);
  }
}
