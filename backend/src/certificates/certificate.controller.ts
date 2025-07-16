import { Controller, Get, Param, Req, Res, UseGuards, ForbiddenException } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserResponse } from '../common/types';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CoursesService } from '../courses/courses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class CertificateController {
  constructor(
    private readonly certificateService: CertificateService,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly coursesService: CoursesService,
  ) {}

  // @UseGuards(AuthGuard) // Uncomment if you have an AuthGuard
  @Get()
  async listCertificates(@CurrentUser() currentUser: UserResponse) {
    // Get all completed enrollments with a certificate for the current user
    const enrollments = await this.enrollmentsService['prisma'].courseEnrollment.findMany({
      where: {
        studentId: currentUser.id,
        completed: true,
        certificateUrl: { not: null },
      },
      include: {
        course: { select: { id: true, title: true } },
      },
      orderBy: { completedAt: 'desc' },
    });
    return enrollments.map(e => ({
      courseId: e.courseId,
      courseTitle: e.course.title,
      completedAt: e.completedAt,
      certificateUrl: e.certificateUrl,
    }));
  }

  @Get(':courseId')
  async getCertificate(
    @Param('courseId') courseId: string,
    @CurrentUser() currentUser: UserResponse,
    @Res() res: Response
  ) {
    // Check if user has completed the course
    const enrollment = await this.enrollmentsService.getCompletedEnrollment(currentUser.id, courseId);
    if (!enrollment) {
      throw new ForbiddenException('You have not completed this course.');
    }
    // Fetch course name
    const courseName = await this.coursesService.getCourseTitle(courseId);
    const studentName = `${currentUser.firstName} ${currentUser.lastName}`;
    const date = new Date().toLocaleDateString();
    const pdfBuffer = await this.certificateService.generateCertificate(studentName, courseName || 'Course', date);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificate-${courseId}.pdf"`,
    });
    res.send(pdfBuffer);
  }
} 