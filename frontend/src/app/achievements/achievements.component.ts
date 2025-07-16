import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AchievementsService, Certificate } from '../services/achievements.service';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-3xl mx-auto py-8 px-4">
      <h1 class="text-3xl font-bold mb-6 text-blue-700">Achievements & Certificates</h1>
      <div *ngIf="certificates.length === 0" class="text-gray-500 text-center py-12">
        You have not completed any courses yet.
      </div>
      <div *ngFor="let cert of certificates" class="bg-white rounded-lg shadow p-6 mb-6 flex items-center justify-between">
        <div>
          <div class="text-lg font-semibold text-gray-800">{{ cert.courseTitle }}</div>
          <div class="text-sm text-gray-500">Completed: {{ cert.completedAt | date:'mediumDate' }}</div>
        </div>
        <a [href]="cert.certificateUrl" target="_blank" download class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
          Download Certificate
        </a>
      </div>
    </div>
  `,
  styles: [``]
})
export class AchievementsComponent implements OnInit {
  certificates: Certificate[] = [];

  constructor(private achievementsService: AchievementsService) {}

  ngOnInit() {
    this.achievementsService.getCertificates().subscribe({
      next: (certs) => this.certificates = certs,
      error: () => this.certificates = []
    });
  }
} 