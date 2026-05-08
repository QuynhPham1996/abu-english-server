import {
  Body,
  Controller,
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
import { DtoCreateTestBody } from 'src/modules/apis/test/dto/create-test.dto';
import { DtoGetTestsQuery } from 'src/modules/apis/test/dto/get-tests.dto';
import { DtoGradedTestBody } from 'src/modules/apis/test/dto/graded-test.dto';

import { TestService } from 'src/modules/apis/test/test.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('tests')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Get('user')
  @AllowPermission([EUserRole.STUDENT])
  async getUserTests(
    @Req() req: THeaderRequest,
    @Query() params: DtoGetTestsQuery,
  ) {
    return await this.testService.getUserTests(req?.user, params);
  }

  @Get('user/:id')
  @AllowPermission([EUserRole.STUDENT])
  async getUserTest(@Req() req: THeaderRequest, @Param('id') id: string) {
    return await this.testService.getUserTest(req?.user, id);
  }

  @Get()
  async getTests(@Query() params: DtoGetTestsQuery) {
    return await this.testService.getTests(params);
  }

  @Post()
  @AllowPermission([EUserRole.STUDENT])
  async createTest(
    @Req() req: THeaderRequest,
    @Body() body: DtoCreateTestBody,
  ) {
    return await this.testService.createTest(req?.user, body);
  }

  @Patch(':id')
  async gradedTest(
    @Req() req: THeaderRequest,
    @Param('id') id: string,
    @Body() body: DtoGradedTestBody,
  ) {
    return await this.testService.gradedTest(req?.user, id, body);
  }
}
