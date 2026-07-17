import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateTagDto } from './create-tag.dto';

async function validationErrorsFor(payload: Record<string, unknown>) {
  const dto = plainToInstance(CreateTagDto, payload);
  return validate(dto);
}

describe('CreateTagDto', () => {
  it('has no validation errors for a valid payload', async () => {
    const errors = await validationErrorsFor({ name: 'Groceries' });

    expect(errors).toHaveLength(0);
  });

  it('rejects a missing name', async () => {
    const errors = await validationErrorsFor({});

    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejects an empty name', async () => {
    const errors = await validationErrorsFor({ name: '' });

    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });
});
