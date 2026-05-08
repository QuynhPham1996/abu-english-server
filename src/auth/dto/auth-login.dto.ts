import { IsNotEmpty, IsString } from 'class-validator';

export class DtoAuthLoginBody {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
