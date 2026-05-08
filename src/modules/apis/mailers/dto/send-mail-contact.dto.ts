import {
  ArrayMinSize,
  IsArray,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class DtoSendMailContactBody {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  emails: string[];

  @IsString()
  name: string;

  @IsNumberString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  message?: string;
}
