import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { DtoSendMailContactBody } from 'src/modules/apis/mailers/dto/send-mail-contact.dto';

import { DtoSendMailNotificationMessageBody } from 'src/modules/apis/mailers/dto/send-mail-notification-message.dto';

@Injectable()
export class MailersService {
  constructor(private readonly mailersService: MailerService) {}

  async sendMailNotificationMessage(body: DtoSendMailNotificationMessageBody) {
    this.mailersService.sendMail({
      to: body.emails,
      subject: 'Abu English Club Thông Báo',
      context: {
        message: body.message,
        buttonLink: body.buttonLink,
      },
      template: 'send-mail-notification',
    });
  }

  async sendMailContact(body: DtoSendMailContactBody) {
    this.mailersService.sendMail({
      to: body.emails,
      subject: 'Abu English Club Thông Báo',
      context: {
        name: body?.name,
        phoneNumber: body?.phoneNumber,
        message: body?.message,
      },
      template: 'send-mail-contact',
    });
  }
}
