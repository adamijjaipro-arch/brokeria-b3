import { IsString, IsOptional, IsObject } from 'class-validator';

export class WebAuthnRegistrationResponseDto {
  @IsObject()
  response: Record<string, unknown>;
}

export class WebAuthnAuthenticationResponseDto {
  @IsObject()
  response: Record<string, unknown>;
}

export class RemoveCredentialDto {
  @IsString()
  credentialId: string;
}
