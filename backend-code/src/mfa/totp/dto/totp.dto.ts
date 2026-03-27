import { IsString, Length, Matches } from 'class-validator';

export class VerifyTotpDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Le code TOTP doit être exactement 6 chiffres' })
  code: string;
}

export class DisableTotpDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Le code TOTP doit être exactement 6 chiffres' })
  code: string;
}
