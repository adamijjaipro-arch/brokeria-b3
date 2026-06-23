import { Controller, Get, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('reports')
@UseGuards(JwtGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * GET /reports/monthly/:year/:month
   * Retourne les stats agrégées du mois pour l'utilisateur authentifié.
   * Aucune persistance — lecture seule depuis la table Signal.
   * Retourne des stats à zéro si aucune donnée pour la période.
   */
  @Get('monthly/:year/:month')
  getMonthlyStats(
    @Param('year',  ParseIntPipe) year:  number,
    @Param('month', ParseIntPipe) month: number,
    @Request() req: any,
  ) {
    return this.reportsService.getMonthlyStats(req.user.id, year, month);
  }
}
