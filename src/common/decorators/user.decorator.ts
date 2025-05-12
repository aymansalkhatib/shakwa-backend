import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserResponseDto } from 'src/modules/auth/dto/response';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext): UserResponseDto | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return user;
  },
);
