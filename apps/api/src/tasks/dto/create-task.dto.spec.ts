import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateTaskDto } from './create-task.dto';

async function validationErrorsFor(payload: Record<string, unknown>) {
  const dto = plainToInstance(CreateTaskDto, payload);
  return validate(dto);
}

describe('CreateTaskDto', () => {
  it('has no validation errors for a payload with only the required title', async () => {
    const errors = await validationErrorsFor({ title: 'Buy milk' });

    expect(errors).toHaveLength(0);
  });

  it('has no validation errors for a fully populated payload', async () => {
    const errors = await validationErrorsFor({
      title: 'Buy milk',
      description: 'Whole milk, 2%',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: '2026-08-01T00:00:00.000Z',
      tagIds: ['9d1e2b1a-3a5c-4b8e-9a3a-2a6b1e2c3d4e'],
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects a missing title', async () => {
    const errors = await validationErrorsFor({});

    expect(errors.some((e) => e.property === 'title')).toBe(true);
  });

  it('rejects an empty title', async () => {
    const errors = await validationErrorsFor({ title: '' });

    expect(errors.some((e) => e.property === 'title')).toBe(true);
  });

  it('rejects an invalid status', async () => {
    const errors = await validationErrorsFor({
      title: 'Buy milk',
      status: 'NOT_A_STATUS',
    });

    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });

  it('rejects an invalid priority', async () => {
    const errors = await validationErrorsFor({
      title: 'Buy milk',
      priority: 'URGENT',
    });

    expect(errors.some((e) => e.property === 'priority')).toBe(true);
  });

  it('rejects a non-ISO8601 dueDate', async () => {
    const errors = await validationErrorsFor({
      title: 'Buy milk',
      dueDate: 'not-a-date',
    });

    expect(errors.some((e) => e.property === 'dueDate')).toBe(true);
  });

  it('rejects tagIds that are not UUIDs', async () => {
    const errors = await validationErrorsFor({
      title: 'Buy milk',
      tagIds: ['not-a-uuid'],
    });

    expect(errors.some((e) => e.property === 'tagIds')).toBe(true);
  });
});
