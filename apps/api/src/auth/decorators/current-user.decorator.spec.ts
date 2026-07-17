import { ExecutionContext } from '@nestjs/common';
import { getCurrentUserFromContext } from './current-user.decorator';

function contextWithUser(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('getCurrentUserFromContext', () => {
  it("returns the request's user object", () => {
    const user = { id: 'user-1', email: 'a@example.com', name: 'Ada' };

    const result = getCurrentUserFromContext(undefined, contextWithUser(user));

    expect(result).toBe(user);
  });

  it('returns undefined when no user is attached to the request', () => {
    const result = getCurrentUserFromContext(
      undefined,
      contextWithUser(undefined),
    );

    expect(result).toBeUndefined();
  });
});
