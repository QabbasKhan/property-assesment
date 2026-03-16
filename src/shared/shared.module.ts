import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ErrorLogService } from './error-log.service';
// import { S3Service } from './s3.service';
import { SharedController } from './shared.controller';
import { SharedService } from './shared.service';
import { StripeService } from './stripe.service';

@Global()
@Module({
  controllers: [SharedController],
  providers: [
    SharedService,
    EmailService,
    ErrorLogService,
    StripeService,
    // S3Service,
  ],
  exports: [
    SharedService,
    EmailService,
    ErrorLogService,
    StripeService,
    // S3Service,
  ],
})
export class SharedModule {}
