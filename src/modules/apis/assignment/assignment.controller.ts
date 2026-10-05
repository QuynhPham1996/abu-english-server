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

import { AssignmentService } from 'src/modules/apis/assignment/assignment.service';
import { DtoAddAssignmentGroupBody } from 'src/modules/apis/assignment/dto/add-assignment-group.dto';
import { DtoAddAssignmentQuestionsBody } from 'src/modules/apis/assignment/dto/add-assignment-questions.dto';
import { DtoCreateAssignmentBody } from 'src/modules/apis/assignment/dto/create-assignment.dto';
import { DtoDeleteAssignmentsQuery } from 'src/modules/apis/assignment/dto/delete-assignments.dto';
import { DtoGetAssignmentsQuery } from 'src/modules/apis/assignment/dto/get-assignments.dto';
import { DtoUpdateAssignmentBody } from 'src/modules/apis/assignment/dto/update-assignment.dto';
import { DtoUpdateAssignmentQuestionsIndexBody } from 'src/modules/apis/assignment/dto/update-assignment-questions-index.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Get()
  async getAssignments(@Query() params: DtoGetAssignmentsQuery) {
    return await this.assignmentService.getAssignments(params);
  }

  @Get(':id')
  async getAssignment(@Param('id') id: string) {
    return await this.assignmentService.getAssignment(id);
  }

  @Post()
  async createAssignment(@Body() body: DtoCreateAssignmentBody) {
    return await this.assignmentService.createAssignment(body);
  }

  @Post(':id/questions')
  async addQuestions(
    @Param('id') id: string,
    @Body() body: DtoAddAssignmentQuestionsBody,
  ) {
    return await this.assignmentService.addQuestions(id, body);
  }

  @Post(':id/groups')
  async addGroup(
    @Param('id') id: string,
    @Body() body: DtoAddAssignmentGroupBody,
  ) {
    return await this.assignmentService.addGroup(id, body);
  }

  @Patch(':id/questions-index')
  async updateQuestionsIndex(
    @Param('id') id: string,
    @Body() body: DtoUpdateAssignmentQuestionsIndexBody,
  ) {
    return await this.assignmentService.updateQuestionsIndex(id, body);
  }

  @Patch(':id')
  async updateAssignment(
    @Param('id') id: string,
    @Body() body: DtoUpdateAssignmentBody,
  ) {
    return await this.assignmentService.updateAssignment(id, body);
  }

  @Delete()
  async deleteAssignments(@Query() params: DtoDeleteAssignmentsQuery) {
    const idsArray = params.ids?.split(',') || [];
    return await this.assignmentService.deleteAssignments(idsArray);
  }
}
