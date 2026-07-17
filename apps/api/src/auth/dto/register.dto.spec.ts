import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from './register.dto';

async function validationErrorsFor(payload: Record<string, unknown>) {
  const dto = plainToInstance(RegisterDto, payload);
  return validate(dto);
}

describe('RegisterDto', () => {
  it('has no validation errors for a valid payload', async () => {
    const errors = await validationErrorsFor({
      email: 'a@example.com',
      password: 'correct-horse-battery-staple',
      name: 'Ada',
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid email', async () => {
    const errors = await validationErrorsFor({
      email: 'not-an-email',
      password: 'correct-horse-battery-staple',
      name: 'Ada',
    });

    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('rejects a password shorter than 8 characters', async () => {
    const errors = await validationErrorsFor({
      email: 'a@example.com',
      password: 'short',
      name: 'Ada',
    });

    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('rejects a missing name', async () => {
    const errors = await validationErrorsFor({
      email: 'a@example.com',
      password: 'correct-horse-battery-staple',
    });

    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });
});
