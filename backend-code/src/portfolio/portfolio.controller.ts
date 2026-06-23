import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('portfolio')
@UseGuards(JwtGuard)
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @Get('history')
  async getHistory(@Request() req: any) {
    return this.portfolioService.getHistory(req.user.id);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    return this.portfolioService.getStats(req.user.id);
  }
}
