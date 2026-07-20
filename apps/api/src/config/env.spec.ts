import { validateEnv } from './env';

function validEnv(
  overrides: Partial<NodeJS.ProcessEnv> = {},
): NodeJS.ProcessEnv {
  return {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db?schema=public',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
    ...overrides,
  };
}

describe('validateEnv', () => {
  let exitSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('returns parsed config when all required vars are present and valid', () => {
    const env = validateEnv(validEnv());

    expect(env.DATABASE_URL).toBe(
      'postgresql://user:pass@localhost:5432/db?schema=public',
    );
    expect(env.JWT_ACCESS_SECRET).toBe('a'.repeat(32));
    expect(env.JWT_REFRESH_SECRET).toBe('b'.repeat(32));
  });

  it('applies defaults for optional vars', () => {
    const env = validateEnv(validEnv());

    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.JWT_ACCESS_EXPIRES_IN).toBe('15m');
    expect(env.JWT_REFRESH_EXPIRES_IN).toBe('7d');
    expect(env.CORS_ORIGIN).toBe('http://localhost:3001');
  });

  it('coerces PORT from a string to a number', () => {
    const env = validateEnv(validEnv({ PORT: '4000' }));

    expect(env.PORT).toBe(4000);
  });

  it('exits the process with a clear error when DATABASE_URL is missing', () => {
    expect(() => validateEnv(validEnv({ DATABASE_URL: undefined }))).toThrow(
      'process.exit called',
    );

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('exits the process when a JWT secret is too short', () => {
    expect(() =>
      validateEnv(validEnv({ JWT_ACCESS_SECRET: 'too-short' })),
    ).toThrow('process.exit called');

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits the process when DATABASE_URL is malformed', () => {
    expect(() => validateEnv(validEnv({ DATABASE_URL: 'not-a-url' }))).toThrow(
      'process.exit called',
    );

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
