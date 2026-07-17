import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateTaskDto } from './update-task.dto';

async function validationErrorsFor(payload: Record<string, unknown>) {
  const dto = plainToInstance(UpdateTaskDto, payload);
  return validate(dto);
}

describe('UpdateTaskDto', () => {
  it('has no validation errors for an empty payload', async () => {
    const errors = await validationErrorsFor({});

    expect(errors).toHaveLength(0);
  });

  it('has no validation errors when only one field is provided', async () => {
    const errors = await validationErrorsFor({ status: 'DONE' });

    expect(errors).toHaveLength(0);
  });

  it('rejects an empty title when title is provided', async () => {
    const errors = await validationErrorsFor({ title: '' });

    expect(errors.some((e) => e.property === 'title')).toBe(true);
  });

  it('rejects an invalid status', async () => {
    const errors = await validationErrorsFor({ status: 'NOT_A_STATUS' });

    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });

  it('rejects an invalid priority', async () => {
    const errors = await validationErrorsFor({ priority: 'URGENT' });

    expect(errors.some((e) => e.property === 'priority')).toBe(true);
  });

  it('rejects a non-ISO8601 dueDate', async () => {
    const errors = await validationErrorsFor({ dueDate: 'not-a-date' });

    expect(errors.some((e) => e.property === 'dueDate')).toBe(true);
  });

  it('rejects tagIds that are not UUIDs', async () => {
    const errors = await validationErrorsFor({ tagIds: ['not-a-uuid'] });

    expect(errors.some((e) => e.property === 'tagIds')).toBe(true);
  });
});
