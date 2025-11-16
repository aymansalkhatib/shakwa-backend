import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { CitizenEntity } from '../../modules/citizens/entities/citizen.entity';
import { InternalUserEntity } from '../../modules/internal-users/entities/internal-user.entity';

export const CurrentUser = createParamDecorator(
  (_: string | undefined, ctx: ExecutionContext): InternalUserEntity | CitizenEntity => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;
    return user;
  },
);
