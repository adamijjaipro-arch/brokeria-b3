import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { TotpService } from './totp.service';
import { VerifyTotpDto, DisableTotpDto } from './dto/totp.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

const getIp = (req: Request): string => {
  const fwd = req.headers['x-forwarded-for'];
  return (Array.isArray(fwd) ? fwd[0] : fwd?.split(',')[0]) ?? req.ip ?? 'unknown';
};

@Controller('mfa/totp')
@UseGuards(JwtAuthGuard)
export class TotpController {
  constructor(private readonly totpService: TotpService) {}

  /** GET /mfa/totp/status — TOTP activé sur ce compte ? */
  @Get('status')
  getStatus(@Req() req: Request & { user: { id: string } }) {
    return this.totpService.getStatus(req.user.id);
  }

  /**
   * POST /mfa/totp/enroll/init
   * Génère un secret temporaire + retourne le QR code (data URL).
   * L'utilisateur doit scanner avec Google Authenticator / Authy.
   */
  @Post('enroll/init')
  enrollInit(@Req() req: Request & { user: { id: string } }) {
    return this.totpService.enrollInit(req.user.id);
  }

  /**
   * POST /mfa/totp/enroll/confirm
   * Body : { code: "123456" }
   * Valide le premier code TOTP → active TOTP et chiffre le secret en base.
   */
  @Post('enroll/confirm')
  @HttpCode(HttpStatus.OK)
  enrollConfirm(
    @Body() dto: VerifyTotpDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.totpService.enrollConfirm(req.user.id, dto.code, getIp(req));
  }

  /**
   * POST /mfa/totp/verify
   * Body : { code: "123456" }
   * Vérifie un code TOTP (appelé depuis le flux d'auth secondaire).
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  verify(
    @Body() dto: VerifyTotpDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.totpService.verify(req.user.id, dto.code, getIp(req));
  }

  /**
   * POST /mfa/totp/disable
   * Body : { code: "123456" }
   * Désactive TOTP après vérification du code courant.
   */
  @Post('disable')
  @HttpCode(HttpStatus.OK)
  disable(
    @Body() dto: DisableTotpDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.totpService.disable(req.user.id, dto.code, getIp(req));
  }
}
