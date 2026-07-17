import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RefreshDto } from './refresh.dto';

async function validationErrorsFor(payload: Record<string, unknown>) {
  const dto = plainToInstance(RefreshDto, payload);
  return validate(dto);
}

describe('RefreshDto', () => {
  it('has no validation errors for a valid payload', async () => {
    const errors = await validationErrorsFor({
      refreshToken: 'some.jwt.token',
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects a missing refresh token', async () => {
    const errors = await validationErrorsFor({});

    expect(errors.some((e) => e.property === 'refreshToken')).toBe(true);
  });

  it('rejects an empty refresh token', async () => {
    const errors = await validationErrorsFor({ refreshToken: '' });

    expect(errors.some((e) => e.property === 'refreshToken')).toBe(true);
  });
});
