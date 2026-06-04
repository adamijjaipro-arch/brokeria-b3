import { Module } from '@nestjs/common';
import { FormationController } from './formation.controller';
import { FormationService } from './formation.service';
import { DatabaseModule } from '../database/prisma.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FormationController],
  providers: [FormationService],
})
export class FormationModule {}
