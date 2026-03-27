import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class SetPasswordDto {
  @IsString() @IsNotEmpty()
  preAuthToken: string;

  @IsString() @MinLength(6)
  password: string;
}
