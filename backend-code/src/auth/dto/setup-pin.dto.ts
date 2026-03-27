import { IsString, IsNotEmpty, Length } from 'class-validator';

export class SetupPinDto {
  @IsString() @IsNotEmpty()
  pinAuthToken: string;

  @IsString() @Length(4, 6)
  pin: string;
}
