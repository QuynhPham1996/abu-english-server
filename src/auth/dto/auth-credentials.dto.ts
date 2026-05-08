import { IsNotEmpty, IsUUID } from 'class-validator';

export class DtoAuthTokenLogin {
  @IsUUID()
  @IsNotEmpty()
  accessToken: string;

  @IsUUID()
  @IsNotEmpty()
  refreshToken: string;
}
