import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

//TODO: Add type for the user
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;
    return user;
  },
);
