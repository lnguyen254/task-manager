import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  id: string;
  email: string;
  name: string;
}

interface RequestWithUser {
  user?: CurrentUserPayload;
}

export function getCurrentUserFromContext(
  _data: unknown,
  ctx: ExecutionContext,
): CurrentUserPayload | undefined {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  return request.user;
}

export const CurrentUser = createParamDecorator(getCurrentUserFromContext);
