/**
 * MetricsController — expose /metrics pour Prometheus
 *
 * Sécurité : IP whitelist configurée via METRICS_ALLOWED_IPS (.env)
 * Défaut : 127.0.0.1, ::1 (localhost uniquement)
 */
import {
  Controller,
  Get,
  Req,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  private readonly allowedIPs: string[];

  constructor(
    private readonly metricsService: MetricsService,
    private readonly config: ConfigService,
  ) {
    const raw = this.config.get<string>('METRICS_ALLOWED_IPS') ?? '127.0.0.1,::1,::ffff:127.0.0.1';
    this.allowedIPs = raw.split(',').map((ip) => ip.trim());
  }

  @Get()
  async getMetrics(@Req() req: Request, @Res() res: Response): Promise<void> {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.socket.remoteAddress ??
      '';

    if (!this.allowedIPs.includes(clientIp)) {
      throw new ForbiddenException('Access denied: metrics endpoint is restricted');
    }

    const metrics = await this.metricsService.getMetrics();
    res.setHeader('Content-Type', this.metricsService.getContentType());
    res.end(metrics);
  }
}
