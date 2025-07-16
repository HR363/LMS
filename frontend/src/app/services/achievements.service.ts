import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Certificate {
  courseId: string;
  courseTitle: string;
  completedAt: string;
  certificateUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AchievementsService {
  constructor(private http: HttpClient) {}

  getCertificates(): Observable<Certificate[]> {
    return this.http.get<Certificate[]>('/api/certificates');
  }
} 