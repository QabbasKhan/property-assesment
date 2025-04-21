import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { red } from 'cli-color';
import { Response } from 'express';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  HttpErrorHandlingFn,
  MongoErrorHandlingFn,
} from '../utils/helper.util';

@Catch()
export class AnyExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let error: { status: string; message: { error: string[] } } = null;
    let httpStatusCode: number = null;

    if (exception instanceof HttpException) {
      const errors = exception.getResponse();
      const rs = HttpErrorHandlingFn(errors);
      error = rs.error;
      httpStatusCode = rs.httpStatusCode;
    } else if (
      ['MongoServerError', 'ValidationError', 'CastError'].includes(
        exception?.constructor?.name,
      )
    ) {
      const rs = MongoErrorHandlingFn(exception);
      error = rs.error;
      httpStatusCode = rs.httpStatusCode;
    } else {
      error = { status: 'error', message: { error: [exception.message] } };
      httpStatusCode = 500;
    }

    const timestamp = new Date().toISOString();
    const logMessage = `
--------------------------------------------
[${timestamp}]
${error.message.error}
    `.trim();

    if (process.env.NODE_ENV === 'production') {
      const logDirPath = join(__dirname, '..', 'logs');
      const logFilePath = join(logDirPath, 'error.log');

      if (!existsSync(logDirPath)) {
        mkdirSync(logDirPath, { recursive: true });
      }

      try {
        appendFileSync(logFilePath, logMessage + '\n');
      } catch (err) {
        console.error('Failed to write to log file:', err.message);
      }
    } else {
      console.error(logMessage);
    }

    response
      .status(httpStatusCode)
      .json({ ...error, statusCode: httpStatusCode });
  }
}
