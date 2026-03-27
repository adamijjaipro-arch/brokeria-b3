import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyPinDto {
  @IsString() @IsNotEmpty()
  pinAuthToken: string;

  @IsString() @Length(4, 6)
  pin: string;
}
