import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class RequestMagicLinkDto {
  @IsEmail({}, { message: 'Email invalide' })
  email: string;
}

export class VerifyMagicLinkDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
