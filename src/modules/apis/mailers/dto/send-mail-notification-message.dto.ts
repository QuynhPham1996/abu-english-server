import { ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';

export class DtoSendMailNotificationMessageBody {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  emails: string[];

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  buttonLink?: string;
}
