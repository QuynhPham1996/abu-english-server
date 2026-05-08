import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AllowPermission } from 'src/common/decorator/permission.decorator';
import { EUserRole } from 'src/common/enums';
import { THeaderRequest } from 'src/common/types';

import { CourseService } from 'src/modules/apis/course/course.service';
import { DtoCreateCourseBody } from 'src/modules/apis/course/dto/create-course.dto';
import { DtoDeleteCoursesQuery } from 'src/modules/apis/course/dto/delete-courses.dto';
import { DtoGetCoursesQuery } from 'src/modules/apis/course/dto/get-courses.dto';
import { DtoUpdateCourseBody } from 'src/modules/apis/course/dto/update-course.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  async getCourses(
    @Req() req: THeaderRequest,
    @Query() params: DtoGetCoursesQuery,
  ) {
    return await this.courseService.getCourses(params);
  }

  @Get('detail/:id')
  async getCourse(@Param('id') id: string) {
    return await this.courseService.getCourse(id);
  }

  @Post()
  async createCourse(@Body() body: DtoCreateCourseBody) {
    return await this.courseService.createCourse(body);
  }

  @Patch(':id')
  async updateCourse(
    @Param('id') id: string,
    @Body() body: DtoUpdateCourseBody,
  ) {
    return await this.courseService.updateCourse(id, body);
  }

  @Delete()
  async deleteCourses(@Query() params: DtoDeleteCoursesQuery) {
    const idsArray = params.ids?.split(',') || [];
    return await this.courseService.deleteCourses(idsArray);
  }

  @Get('available')
  @AllowPermission([EUserRole.STUDENT])
  async getCoursesAvailable() {
    return await this.courseService.getCoursesAvailable();
  }

  @Post('register/:id')
  @AllowPermission([EUserRole.STUDENT])
  async registerCourse(@Req() req: THeaderRequest, @Param('id') id: string) {
    return await this.courseService.registerCourse(req?.user, id);
  }

  @Get('my-courses')
  @AllowPermission([EUserRole.STUDENT])
  async getMyCourses(@Req() req: THeaderRequest) {
    return await this.courseService.getMyCourses(req?.user);
  }

  @Get('my-courses/:id')
  @AllowPermission([EUserRole.STUDENT])
  async getMyCourseExercise(
    @Req() req: THeaderRequest,
    @Param('id') id: string,
  ) {
    return await this.courseService.getMyCourseExercise(req?.user, id);
  }

  @Patch('my-courses/:id')
  @AllowPermission([EUserRole.STUDENT])
  async updateIsPassExercise(@Param('id') id: string) {
    return await this.courseService.updateIsPassExercise(id);
  }

  @Get('my-courses/lesson/:id')
  @AllowPermission([EUserRole.STUDENT])
  async getMyCourseLesson(@Req() req: THeaderRequest, @Param('id') id: string) {
    return await this.courseService.getMyCourseLesson(req?.user, id);
  }
}
