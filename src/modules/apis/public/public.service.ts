import { Injectable } from '@nestjs/common';
import { EUserRole, EUserStatus } from 'src/common/enums';
import { CourseService } from 'src/modules/apis/course/course.service';

import { MailersService } from 'src/modules/apis/mailers/mailers.service';
import { DtoSendContactPublicBody } from 'src/modules/apis/public/dto/send-contact-public.dto';
import { UserRepository } from 'src/modules/repositories/user.repository';

@Injectable()
export class PublicService {
  constructor(
    private readonly mailersService: MailersService,
    private readonly userRepository: UserRepository,
    private readonly courseService: CourseService,
  ) {}

  async getCourses() {
    return await this.courseService.getCoursesAvailable();
  }

  async sendContact(body: DtoSendContactPublicBody) {
    const managerUsers = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.email'])
      .where('user.status = :status', { status: EUserStatus.ACTIVE })
      .andWhere('user.role = :role', { role: EUserRole.MANAGER })
      .getMany();

    const managersEmail =
      managerUsers?.filter((item) => item.email)?.map((item) => item.email) ||
      [];

    const bodyParses = {
      ...body,
      emails: managersEmail,
    };

    this.mailersService.sendMailContact(bodyParses);
  }
}
