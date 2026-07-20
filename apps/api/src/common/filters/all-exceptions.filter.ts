import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { STATUS_CODES } from 'node:http';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

/**
 * Normalizes every thrown error into a consistent
 * `{ statusCode, message, error }` JSON shape. Nest's built-in HttpException
 * subclasses (UnauthorizedException, NotFoundException, ValidationPipe's
 * BadRequestException, ...) already produce this shape via their own
 * `getResponse()` and are passed through unchanged. Anything else — a bug,
 * a driver error, anything not deliberately thrown as an HttpException — is
 * collapsed to a generic 500 so its message/stack (which may contain
 * internal details like a connection string or file path) never reaches the
 * client; the real error is logged server-side instead.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.buildBody(exception);

    // Compared against the plain numeric threshold (not the HttpStatus enum
    // member) since body.statusCode is a plain number here, and comparing
    // a number against an enum member trips @typescript-eslint's
    // no-unsafe-enum-comparison rule.
    if (body.statusCode >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : exception,
      );
    }

    response.status(body.statusCode).json(body);
  }

  private buildBody(exception: unknown): ErrorBody {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const httpResponse = exception.getResponse();

      // A parameterless exception (e.g. AuthGuard's default `new
      // UnauthorizedException()`) has no `error` key in its response body
      // — fall back to the standard HTTP reason phrase for the status
      // code, not `exception.name` (the JS class name, e.g.
      // "UnauthorizedException", which isn't a valid `error` value).
      const reasonPhrase = STATUS_CODES[status] ?? exception.name;

      if (typeof httpResponse === 'object' && httpResponse !== null) {
        const { message, error } = httpResponse as Record<string, unknown>;
        // `error` is only usable if it's actually a string — some
        // HttpException subclasses (e.g. Terminus's health-check failure)
        // put a per-check details object there instead, which would
        // otherwise violate this filter's own `{statusCode, message, error}`
        // string-only contract.
        return {
          statusCode: status,
          message:
            typeof message === 'string' || Array.isArray(message)
              ? (message as string | string[])
              : exception.message,
          error: typeof error === 'string' ? error : reasonPhrase,
        };
      }

      return {
        statusCode: status,
        message: String(httpResponse),
        error: reasonPhrase,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }
}
