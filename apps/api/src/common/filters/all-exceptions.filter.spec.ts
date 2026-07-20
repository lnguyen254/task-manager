import {
  ArgumentsHost,
  BadRequestException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

function mockHost() {
  const json = jest.fn<void, [Record<string, unknown>]>();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ method: 'GET', url: '/test' }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let errorLogSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    errorLogSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    errorLogSpy.mockRestore();
  });

  it('passes through a standard HttpException with its statusCode/message/error', () => {
    const { host, status, json } = mockHost();

    filter.catch(new UnauthorizedException('Invalid email or password'), host);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      statusCode: 401,
      message: 'Invalid email or password',
      error: 'Unauthorized',
    });
  });

  it('preserves an array message from validation errors', () => {
    const { host, status, json } = mockHost();

    filter.catch(
      new BadRequestException([
        'title should not be empty',
        'title must be a string',
      ]),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      message: ['title should not be empty', 'title must be a string'],
      error: 'Bad Request',
    });
  });

  it('derives the standard reason phrase for a parameterless exception (e.g. AuthGuard rejection)', () => {
    const { host, status, json } = mockHost();

    filter.catch(new UnauthorizedException(), host);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    });
  });

  it('maps a 404 HttpException correctly', () => {
    const { host, status, json } = mockHost();

    filter.catch(new NotFoundException('Task not found'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Task not found',
      error: 'Not Found',
    });
  });

  it('maps an unknown non-HTTP error to a generic 500 without leaking its message or stack', () => {
    const { host, status, json } = mockHost();

    filter.catch(
      new Error('leaked db connection string: postgres://...'),
      host,
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
    const body = json.mock.calls[0][0];
    expect(JSON.stringify(body)).not.toContain('leaked db connection string');
    expect(JSON.stringify(body)).not.toContain('.ts:');
  });

  it('falls back to the reason phrase when an HttpException carries a non-string error (e.g. Terminus health-check failure)', () => {
    const { host, status, json } = mockHost();

    filter.catch(
      new ServiceUnavailableException({
        status: 'error',
        info: {},
        error: {
          database: { status: 'down', message: 'timeout of 1000ms exceeded' },
        },
        details: {},
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({
      statusCode: 503,
      message: 'Service Unavailable Exception',
      error: 'Service Unavailable',
    });
  });

  it('maps a thrown non-Error value to the same generic 500 shape', () => {
    const { host, status, json } = mockHost();

    filter.catch('a raw string throw', host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  });

  it('logs unexpected 5xx errors server-side', () => {
    const { host } = mockHost();

    filter.catch(new Error('boom'), host);

    expect(errorLogSpy).toHaveBeenCalled();
  });

  it('does not log expected 4xx errors', () => {
    const { host } = mockHost();

    filter.catch(new UnauthorizedException('Invalid email or password'), host);

    expect(errorLogSpy).not.toHaveBeenCalled();
  });
});
