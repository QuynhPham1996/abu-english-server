import { IsBoolean, IsOptional } from 'class-validator';

export class DtoUpdateNotificationBody {
  @IsOptional()
  @IsBoolean()
  isRead: boolean;
}
