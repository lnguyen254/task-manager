import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './login.dto';

async function validationErrorsFor(payload: Record<string, unknown>) {
  const dto = plainToInstance(LoginDto, payload);
  return validate(dto);
}

describe('LoginDto', () => {
  it('has no validation errors for a valid payload', async () => {
    const errors = await validationErrorsFor({
      email: 'a@example.com',
      password: 'anything',
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid email', async () => {
    const errors = await validationErrorsFor({
      email: 'not-an-email',
      password: 'anything',
    });

    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('rejects an empty password', async () => {
    const errors = await validationErrorsFor({
      email: 'a@example.com',
      password: '',
    });

    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
});
