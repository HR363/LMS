import { Module, forwardRef } from '@nestjs/common';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { MailerModule } from '../mailer/mailer.module';
import { CertificatesModule } from '../certificates/certificates.module';

@Module({
  imports: [forwardRef(() => CertificatesModule), MailerModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
