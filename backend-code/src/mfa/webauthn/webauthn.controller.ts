import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { WebAuthnService } from './webauthn.service';
import {
  WebAuthnRegistrationResponseDto,
  WebAuthnAuthenticationResponseDto,
  RemoveCredentialDto,
} from './dto/webauthn.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';

const getIp = (req: Request): string => {
  const fwd = req.headers['x-forwarded-for'];
  return (Array.isArray(fwd) ? fwd[0] : fwd?.split(',')[0]) ?? req.ip ?? 'unknown';
};

@Controller('mfa/webauthn')
@UseGuards(JwtAuthGuard)
export class WebAuthnController {
  constructor(private readonly webAuthnService: WebAuthnService) {}

  /** GET /mfa/webauthn/credentials — liste les clés enregistrées */
  @Get('credentials')
  listCredentials(@Req() req: Request & { user: { id: string } }) {
    return this.webAuthnService.listCredentials(req.user.id);
  }

  /** POST /mfa/webauthn/register/options — génère les options d'enrôlement */
  @Post('register/options')
  registrationOptions(@Req() req: Request & { user: { id: string } }) {
    return this.webAuthnService.registrationOptions(req.user.id);
  }

  /** POST /mfa/webauthn/register/verify — valide la réponse de l'authenticateur */
  @Post('register/verify')
  @HttpCode(HttpStatus.OK)
  registrationVerify(
    @Body() dto: WebAuthnRegistrationResponseDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.webAuthnService.registrationVerify(
      req.user.id,
      dto.response as unknown as RegistrationResponseJSON,
      getIp(req),
    );
  }

  /** POST /mfa/webauthn/auth/options — génère les options d'authentification */
  @Post('auth/options')
  authenticationOptions(@Req() req: Request & { user: { id: string } }) {
    return this.webAuthnService.authenticationOptions(req.user.id);
  }

  /** POST /mfa/webauthn/auth/verify — valide l'assertion */
  @Post('auth/verify')
  @HttpCode(HttpStatus.OK)
  authenticationVerify(
    @Body() dto: WebAuthnAuthenticationResponseDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.webAuthnService.authenticationVerify(
      req.user.id,
      dto.response as unknown as AuthenticationResponseJSON,
      getIp(req),
    );
  }

  /** DELETE /mfa/webauthn/credentials/:id — supprime une clé enregistrée */
  @Delete('credentials/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCredential(
    @Param('id') credentialId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.webAuthnService.removeCredential(req.user.id, credentialId, getIp(req));
  }
}
