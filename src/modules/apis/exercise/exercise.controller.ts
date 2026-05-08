import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';

import { ExerciseService } from 'src/modules/apis/exercise/exercise.service';
import { DtoCreateExerciseBody } from 'src/modules/apis/exercise/dto/create-exercise.dto';
import { DtoDeleteExercisesQuery } from 'src/modules/apis/exercise/dto/delete-exercises.dto';
import { DtoGetExercisesQuery } from 'src/modules/apis/exercise/dto/get-exercises.dto';
import { DtoUpdateExerciseBody } from 'src/modules/apis/exercise/dto/update-exercise.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerUploadVideoOptions } from 'src/modules/constants/upload';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Get(':courseId')
  async getExercises(
    @Param('courseId') courseId: string,
    @Query() params: DtoGetExercisesQuery,
  ) {
    return await this.exerciseService.getExercises(courseId, params);
  }

  @Get(':courseId/:id')
  async getExercise(@Param('id') id: string) {
    return await this.exerciseService.getExercise(id);
  }

  @Post()
  async createExercise(@Body() body: DtoCreateExerciseBody) {
    return await this.exerciseService.createExercise(body);
  }

  @Post(':id')
  @UseInterceptors(FileInterceptor('file', multerUploadVideoOptions))
  async uploadExerciseVideo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.exerciseService.uploadExerciseVideo(id, file);
  }

  @Patch(':id')
  async updateExercise(
    @Param('id') id: string,
    @Body() body: DtoUpdateExerciseBody,
  ) {
    return await this.exerciseService.updateExercise(id, body);
  }

  @Delete()
  async deleteExercises(@Query() params: DtoDeleteExercisesQuery) {
    const idsArray = params.ids?.split(',') || [];
    return await this.exerciseService.deleteExercises(idsArray);
  }
}
