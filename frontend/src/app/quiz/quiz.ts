import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizzesService, QuizSubmission, QuizSubmissionResponse } from '../services/quizzes.service';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz.html',
  styleUrls: ['./quiz.css']
})
export class QuizComponent implements OnInit {
  @Input() lessonId!: string;
  quiz: any = null;
  loading = false;
  error: string | null = null;
  answers: Record<string, string> = {};
  submitted = false;
  result: QuizSubmissionResponse | null = null;
  submitting = false;

  constructor(private quizzesService: QuizzesService) {}

  ngOnInit() {
    if (this.lessonId) {
      this.fetchQuiz();
    }
  }

  get answerCount() {
    return Object.keys(this.answers).length;
  }

  fetchQuiz() {
    this.loading = true;
    this.error = null;
    this.quizzesService.getQuiz(this.lessonId).subscribe({
      next: (quiz: any) => {
        this.quiz = quiz;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load quiz.';
        this.loading = false;
      }
    });
  }

  selectAnswer(questionId: string, option: string) {
    this.answers[questionId] = option;
  }

  submitQuiz() {
    if (!this.quiz || this.submitting) return;
    this.submitting = true;
    const submission: QuizSubmission = {
      quizId: this.quiz.id,
      answers: this.answers,
      timeSpent: 0 // Optionally track time
    };
    this.quizzesService.submitQuiz(submission).subscribe({
      next: (res) => {
        this.result = res;
        this.submitted = true;
        this.submitting = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to submit quiz.';
        this.submitting = false;
      }
    });
  }

  resetQuiz() {
    this.answers = {};
    this.submitted = false;
    this.result = null;
  }
}
