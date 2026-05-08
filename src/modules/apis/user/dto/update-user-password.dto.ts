import { IsString, MaxLength, MinLength } from 'class-validator';

export class DtoUpdateUserPasswordBody {
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  newPassword: string;
}
