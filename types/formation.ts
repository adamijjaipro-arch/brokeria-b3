export type CourseLevel = 'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE' | 'EXPERT';
export type LessonType = 'VIDEO' | 'ARTICLE' | 'QUIZ';

export interface Course {
  id: string;
  title: string;
  description: string;
  level: CourseLevel;
  category: string;
  thumbnail: string | null;
  duration: number;
  totalLessons: number;
  order: number;
  isPublished: boolean;
  createdAt: string;
  completedLessons: number;
  progressPercent: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl: string | null;
  content: string;
  duration: number;
  order: number;
  type: LessonType;
  createdAt: string;
  completed?: boolean;
}

export interface CourseDetail extends Course {
  lessons: Lesson[];
}

export interface LessonDetail extends Lesson {
  course: {
    id: string;
    title: string;
    totalLessons: number;
  };
}

export interface CourseProgress {
  courseId: string;
  title: string;
  level: CourseLevel;
  thumbnail: string | null;
  lessonCount: number;
  completedCount: number;
  progressPercent: number;
}

export interface UserProgress {
  globalPercent: number;
  totalLessons: number;
  totalCompleted: number;
  courseStats: CourseProgress[];
}
