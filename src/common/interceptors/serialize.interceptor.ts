import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { ClassConstructor, plainToClass } from 'class-transformer';

export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: ClassConstructor<any>) {}

  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: any) => {
        return plainToClass(this.dto, data, {
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}
