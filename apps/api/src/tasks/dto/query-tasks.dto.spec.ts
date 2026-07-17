import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { QueryTasksDto } from './query-tasks.dto';

async function validationErrorsFor(payload: Record<string, unknown>) {
  const dto = plainToInstance(QueryTasksDto, payload);
  return validate(dto);
}

describe('QueryTasksDto', () => {
  it('has no validation errors for an empty payload', async () => {
    const errors = await validationErrorsFor({});

    expect(errors).toHaveLength(0);
  });

  it('defaults sortBy to createdAt, sortOrder to desc, page to 1, and limit to 20', () => {
    const dto = plainToInstance(QueryTasksDto, {});

    expect(dto.sortBy).toBe('createdAt');
    expect(dto.sortOrder).toBe('desc');
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
  });

  it('transforms page and limit query strings into numbers', () => {
    const dto = plainToInstance(QueryTasksDto, { page: '2', limit: '50' });

    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(50);
  });

  it('rejects an invalid status', async () => {
    const errors = await validationErrorsFor({ status: 'NOT_A_STATUS' });

    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });

  it('rejects an invalid priority', async () => {
    const errors = await validationErrorsFor({ priority: 'URGENT' });

    expect(errors.some((e) => e.property === 'priority')).toBe(true);
  });

  it('rejects a non-UUID tagId', async () => {
    const errors = await validationErrorsFor({ tagId: 'not-a-uuid' });

    expect(errors.some((e) => e.property === 'tagId')).toBe(true);
  });

  it('rejects an invalid sortBy field', async () => {
    const errors = await validationErrorsFor({ sortBy: 'notAField' });

    expect(errors.some((e) => e.property === 'sortBy')).toBe(true);
  });

  it('rejects an invalid sortOrder', async () => {
    const errors = await validationErrorsFor({ sortOrder: 'sideways' });

    expect(errors.some((e) => e.property === 'sortOrder')).toBe(true);
  });

  it('rejects a page below 1', async () => {
    const errors = await validationErrorsFor({ page: '0' });

    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('rejects a limit above 100', async () => {
    const errors = await validationErrorsFor({ limit: '101' });

    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });
});
