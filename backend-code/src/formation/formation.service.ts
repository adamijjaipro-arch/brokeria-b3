import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateProgressDto } from './dto/create-progress.dto';

interface CourseRow {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  thumbnail: string | null;
  duration: number;
  totalLessons: number;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  lessons: Array<{ id: string }>;
  progress: Array<{ completed: boolean; lessonId: string | null }>;
}

interface LessonRow {
  id: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl: string | null;
  content: string;
  duration: number;
  order: number;
  type: string;
  createdAt: Date;
}

@Injectable()
export class FormationService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Cours publiés avec progression user ─────────────────────────────────────
  async getCourses(userId: string) {
    const courses = await this.prisma.course.findMany({
      where: { isPublished: true },
      include: {
        lessons: { select: { id: true }, orderBy: { order: 'asc' } },
        progress: { where: { userId, lessonId: { not: null } } },
      },
      orderBy: { order: 'asc' },
    });

    return (courses as CourseRow[]).map((course) => {
      const totalLessons = course.lessons.length;
      const completedLessons = course.progress.filter((p) => p.completed).length;
      const progressPercent =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      const { progress, ...rest } = course;
      return { ...rest, completedLessons, progressPercent };
    });
  }

  // ── Détail d'un cours + ses leçons + progression ────────────────────────────
  async getCourseById(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: { orderBy: { order: 'asc' } },
        progress: { where: { userId, lessonId: { not: null } } },
      },
    });

    if (!course) return null;

    const typedCourse = course as CourseRow & { lessons: LessonRow[] };
    const completedLessonIds = new Set(
      typedCourse.progress.filter((p) => p.completed).map((p) => p.lessonId),
    );

    const lessons = typedCourse.lessons.map((lesson) => ({
      ...lesson,
      completed: completedLessonIds.has(lesson.id),
    }));

    const completedLessons = completedLessonIds.size;
    const progressPercent =
      lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;

    const { progress, ...rest } = typedCourse;
    return { ...rest, lessons, completedLessons, progressPercent };
  }

  // ── Détail d'une leçon ───────────────────────────────────────────────────────
  async getLessonById(lessonId: string) {
    return this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          select: { id: true, title: true, totalLessons: true },
        },
      },
    });
  }

  // ── Marquer une leçon comme complétée (upsert) ───────────────────────────────
  async markLessonComplete(userId: string, dto: CreateProgressDto) {
    const { lessonId, courseId } = dto;

    await this.prisma.userProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, courseId, completed: true },
      update: { completed: true },
    });

    // Recalcule la progression du cours et la retourne
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: { select: { id: true } },
        progress: { where: { userId, lessonId: { not: null }, completed: true } },
      },
    });

    if (!course) return { success: true, progressPercent: 0 };

    const progressPercent = Math.round(
      (course.progress.length / course.lessons.length) * 100,
    );

    return { success: true, progressPercent, completedLessons: course.progress.length };
  }

  // ── Progression globale de l'utilisateur ────────────────────────────────────
  async getUserProgress(userId: string) {
    const courses = await this.prisma.course.findMany({
      where: { isPublished: true },
      include: {
        lessons: { select: { id: true } },
        progress: { where: { userId, completed: true, lessonId: { not: null } } },
      },
      orderBy: { order: 'asc' },
    });

    let totalLessons = 0;
    let totalCompleted = 0;

    const courseStats = (courses as CourseRow[]).map((course) => {
      const lessonCount = course.lessons.length;
      const completedCount = course.progress.length;
      totalLessons += lessonCount;
      totalCompleted += completedCount;

      return {
        courseId: course.id,
        title: course.title,
        level: course.level,
        thumbnail: course.thumbnail,
        lessonCount,
        completedCount,
        progressPercent:
          lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0,
      };
    });

    const globalPercent =
      totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

    return {
      globalPercent,
      totalLessons,
      totalCompleted,
      courseStats,
    };
  }
}
