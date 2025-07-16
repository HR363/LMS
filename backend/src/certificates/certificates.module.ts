import { Module, forwardRef } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { CertificateController } from './certificate.controller';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [forwardRef(() => EnrollmentsModule), CoursesModule],
  providers: [CertificateService],
  controllers: [CertificateController],
  exports: [CertificateService],
})
export class CertificatesModule {} 