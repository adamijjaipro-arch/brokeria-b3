import { IsString, IsNotEmpty } from 'class-validator';

export class CreateProgressDto {
  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @IsString()
  @IsNotEmpty()
  courseId: string;
}
