import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuizQuestionDto {
  @IsString()
  text: string;

  @IsArray()
  @IsString({ each: true })
  options: string[];

  @IsString()
  correctAnswer: string;
}

export class QuizDto {
  @IsString()
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions: QuizQuestionDto[];
}

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  contentType: string;

  @IsOptional()
  @IsString()
  contentUrl?: string;

  @IsNumber()
  order: number;

  @IsString()
  moduleId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => QuizDto)
  quiz?: QuizDto;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsString()
  contentUrl?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => QuizDto)
  quiz?: QuizDto;
}

export class CreateModuleDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  order: number;

  @IsString()
  courseId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonDto)
  lessons?: CreateLessonDto[];
}

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export interface JwtPayload {
  email: string;
  sub: string;
  role: string;
}

export interface RequestWithUser {
  user: {
    id: string;
    email: string;
    role: string;
  };
}
