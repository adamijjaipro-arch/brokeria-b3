import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService {
  private prisma: any;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  get user() {
    return this.prisma.user;
  }

  get signal() {
    return this.prisma.signal;
  }

  get strategy() {
    return this.prisma.strategy;
  }

  get report() {
    return this.prisma.report;
  }

  get authLog() {
    return this.prisma.authLog;
  }

  get webAuthnCredential() {
    return this.prisma.webAuthnCredential;
  }

  get course() {
    return this.prisma.course;
  }

  get lesson() {
    return this.prisma.lesson;
  }

  get userProgress() {
    return this.prisma.userProgress;
  }

  get portfolioSnapshot() {
    return this.prisma.portfolioSnapshot;
  }

  get simulationResult() {
    return this.prisma.simulationResult;
  }
}
