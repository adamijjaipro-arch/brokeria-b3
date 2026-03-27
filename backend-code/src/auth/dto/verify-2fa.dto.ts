import { IsString, IsNotEmpty, Length } from 'class-validator';

export class Verify2FADto {
  @IsString() @IsNotEmpty()
  preAuthToken: string;

  @IsString() @Length(6, 6)
  otp: string;
}
