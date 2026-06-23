import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PortfolioScheduler {
  private readonly logger = new Logger(PortfolioScheduler.name);

  constructor(private prisma: PrismaService) {}

  /**
   * S'exécute le 1er de chaque mois à minuit.
   * Pour chaque utilisateur, insère un PortfolioSnapshot avec son dernier capital connu.
   *
   * Source du capital : dernier snapshot existant (carry-forward).
   * En production, remplacer par un appel à l'API broker pour obtenir le solde réel.
   */
  @Cron('0 0 1 * *', { name: 'monthly-portfolio-snapshot', timeZone: 'Europe/Paris' })
  async takeMonthlySnapshot() {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    this.logger.log(`Démarrage snapshot mensuel — ${month}/${year}`);

    const users = await this.prisma.user.findMany({ select: { id: true } });

    let created = 0;
    let skipped = 0;

    for (const user of users) {
      const lastSnapshot = await this.prisma.portfolioSnapshot.findFirst({
        where: { userId: user.id },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        select: { capital: true },
      });

      if (!lastSnapshot) {
        // Pas de données historiques : impossible de déduire un capital de référence
        skipped++;
        continue;
      }

      await this.prisma.portfolioSnapshot.upsert({
        where: { userId_month_year: { userId: user.id, month, year } },
        create: { userId: user.id, capital: lastSnapshot.capital, month, year },
        // Si le snapshot du mois existe déjà, on ne l'écrase pas
        update: {},
      });

      created++;
    }

    this.logger.log(
      `Snapshot mensuel terminé — ${created} créé(s), ${skipped} ignoré(s) (pas de données initiales)`,
    );
  }
}
