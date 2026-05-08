import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { DtoSendContactPublicBody } from 'src/modules/apis/public/dto/send-contact-public.dto';
import { PublicService } from 'src/modules/apis/public/public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('courses')
  async getCourses() {
    return await this.publicService.getCourses();
  }

  @UseGuards(ThrottlerGuard)
  @Throttle(1, 30)
  @Post('contact')
  async sendContact(@Body() body: DtoSendContactPublicBody) {
    return await this.publicService.sendContact(body);
  }
}
