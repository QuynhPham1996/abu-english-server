import { Controller } from '@nestjs/common';

import { MailersService } from 'src/modules/apis/mailers/mailers.service';

@Controller('mail')
export class MailersController {
  constructor(private readonly mailersService: MailersService) {}
}
