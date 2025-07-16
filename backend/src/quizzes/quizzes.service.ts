import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto, SubmitQuizAttemptDto } from './dto';
import {
  QuizWithLessonResponse,
  QuizWithAttemptsResponse,
  QuizAttemptResponse,
  QuizAttemptWithQuizResponse,
} from '../common/types';

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  async createQuiz(quizData: CreateQuizDto): Promise<QuizWithLessonResponse> {
    const { questions, ...quizInfo } = quizData;
    
    // Convert questions to handle SQL Server compatibility
    const questionsWithJsonOptions = questions.map(question => ({
      ...question,
      options: JSON.stringify(question.options),
    }));

    return (await this.prisma.quiz.create({
      data: {
        ...quizInfo,
        questions: {
          create: questionsWithJsonOptions,
        },
      },
      include: {
        questions: true,
        lesson: true,
      },
    })) as QuizWithLessonResponse;
  }


  async getQuizByLesson(lessonId: string): Promise<QuizWithLessonResponse | null> {
    return (await this.prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: true,
      },
    })) as QuizWithLessonResponse | null;
  }

  async getQuiz(id: string): Promise<QuizWithLessonResponse | null> {
    return (await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: true,
      },
    })) as QuizWithLessonResponse | null;
  }

  async submitQuizAttempt(
    studentId: string,
    quizId: string,
    answers: SubmitQuizAttemptDto,
  ): Promise<QuizAttemptResponse> {
    return await this.prisma.quizAttempt.create({
      data: {
        studentId,
        quizId,
        answers: JSON.stringify(answers.answers),
        isCompleted: true,
        submittedAt: new Date(),
      },
    });
  }

  async getStudentAttempts(
    studentId: string,
    quizId: string,
  ): Promise<QuizAttemptWithQuizResponse[]> {
    return (await this.prisma.quizAttempt.findMany({
      where: {
        studentId,
        quizId,
      },
      include: {
        quiz: true,
      },
    })) as QuizAttemptWithQuizResponse[];
  }
}
