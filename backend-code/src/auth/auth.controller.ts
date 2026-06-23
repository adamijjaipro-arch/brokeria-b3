import {
  Controller, Post, Get, Body, Req, Res,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestMagicLinkDto, VerifyMagicLinkDto } from './dto/magic-link.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
import { SetupPinDto } from './dto/setup-pin.dto';
import { GithubProfile } from './strategies/github.strategy';

const getIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]) ?? req.ip ?? 'unknown';
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.register(dto, res, getIp(req));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, res, getIp(req));
  }

  @Post('magic-link/request')
  @HttpCode(HttpStatus.OK)
  async requestMagicLink(@Body() dto: RequestMagicLinkDto, @Req() req: Request) {
    await this.authService.requestMagicLink(dto.email, getIp(req));
    return { message: 'Si cet email existe, un lien de connexion vous a été envoyé.' };
  }

  @Post('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  async verifyMagicLink(@Body() dto: VerifyMagicLinkDto, @Req() req: Request) {
    return this.authService.verifyMagicLink(dto.token, getIp(req));
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubLogin() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: Request & { user: GithubProfile }, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3006';
    try {
      const result = await this.authService.handleGithubCallback(req.user, getIp(req));
      if (typeof result === 'string') {
        if (result.startsWith('no-email:')) {
          res.redirect(`${frontendUrl}/login?error=no_email`);
        } else {
          res.redirect(`${frontendUrl}/auth/2fa?token=${result}`);
        }
        return;
      }
      // 2FA désactivé — redirection directe avec le token dans l'URL
      res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
    } catch {
      res.redirect(`${frontendUrl}/login?error=github_failed`);
    }
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async verify2FA(@Body() dto: Verify2FADto, @Req() req: Request) {
    return this.authService.verify2FA(dto.preAuthToken, dto.otp, getIp(req));
  }

  @Post('pin/verify')
  @HttpCode(HttpStatus.OK)
  async verifyPin(@Body() dto: VerifyPinDto, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
    return this.authService.verifyPin(dto.pinAuthToken, dto.pin, res, getIp(req));
  }

  @Post('pin/setup')
  @HttpCode(HttpStatus.OK)
  async setupPin(@Body() dto: SetupPinDto, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
    return this.authService.setupPin(dto.pinAuthToken, dto.pin, res, getIp(req));
  }

  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  async setPassword(@Body() dto: SetPasswordDto, @Req() req: Request) {
    return this.authService.setPassword(dto.preAuthToken, dto.password, getIp(req));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(req, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req, res);
  }

  @Post('dev-login')
  @HttpCode(HttpStatus.OK)
  async devLogin(@Body() body: { email: string }, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.devLogin(body.email, res, getIp(req));
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request & { user: { id: string } }) {
    return this.authService.getProfile(req.user.id);
  }
}
