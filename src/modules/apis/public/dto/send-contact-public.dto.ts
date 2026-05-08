import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class DtoSendContactPublicBody {
  @IsString()
  name: string;

  @IsNumberString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  message?: string;
}
