import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { FormationService } from './formation.service';
import { JwtGuard } from '../auth/jwt.guard';
import { CreateProgressDto } from './dto/create-progress.dto';

@Controller('formation')
@UseGuards(JwtGuard)
export class FormationController {
  constructor(private readonly formationService: FormationService) {}

  /** GET /formation/courses — liste les cours publiés avec progression user */
  @Get('courses')
  getCourses(@Request() req: { user: { id: string } }) {
    return this.formationService.getCourses(req.user.id);
  }

  /** GET /formation/courses/:id — détail d'un cours + leçons + progression */
  @Get('courses/:id')
  async getCourseById(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    const course = await this.formationService.getCourseById(id, req.user.id);
    if (!course) throw new NotFoundException(`Cours ${id} introuvable`);
    return course;
  }

  /** GET /formation/lessons/:id — détail d'une leçon */
  @Get('lessons/:id')
  async getLessonById(@Param('id') id: string) {
    const lesson = await this.formationService.getLessonById(id);
    if (!lesson) throw new NotFoundException(`Leçon ${id} introuvable`);
    return lesson;
  }

  /** POST /formation/progress — marquer une leçon comme complétée */
  @Post('progress')
  markLessonComplete(
    @Body() dto: CreateProgressDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.formationService.markLessonComplete(req.user.id, dto);
  }

  /** GET /formation/my-progress — progression globale de l'utilisateur */
  @Get('my-progress')
  getUserProgress(@Request() req: { user: { id: string } }) {
    return this.formationService.getUserProgress(req.user.id);
  }
}
