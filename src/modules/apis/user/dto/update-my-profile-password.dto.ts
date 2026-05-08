import { IsString, MaxLength, MinLength } from 'class-validator';

export class DtoUpdateMyProfilePasswordBody {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  newPassword: string;
}
