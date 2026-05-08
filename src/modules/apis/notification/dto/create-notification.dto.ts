import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ENotificationType } from 'src/common/enums';

export class DtoCreateNotificationBody {
  @IsString()
  message: string;

  @IsUUID()
  toUser: string;

  @IsEnum(ENotificationType)
  type: ENotificationType;

  @IsOptional()
  @IsBoolean()
  isSendEmail?: boolean;
}
