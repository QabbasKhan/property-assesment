import { Injectable } from '@nestjs/common';
import { execSync } from 'child_process';
import { ErrorLogService } from './shared/error-log.service';

@Injectable()
export class AppService {
  constructor(private readonly logger: ErrorLogService) {}
  getHello(): string {
    return 'Visit /docs to view swagger documentation!';
  }

  getLatestCommit(): string {
    try {
      const commit = execSync('git log -1 --pretty=format:"%h - %s"')
        .toString()
        .trim();
      return commit;
    } catch (error) {
      this.logger.logError(
        error.message,
        'Error while getting latest commit',
        error.stack,
      );
      return 'Unable to retrieve commit information';
    }
  }
}
