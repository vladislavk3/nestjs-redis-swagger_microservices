import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { has } from 'lodash';
import { Request } from 'express';
import { map } from 'rxjs/operators';
import { StatusCodesService } from './status-codes.service';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly statusCodeService: StatusCodesService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const query = context.switchToHttp().getRequest<Request>().query;
    const lang = has(query, 'lang') ? query.lang : 'en';

    //console.log(context.switchToHttp().getResponse())
    return next.handle().pipe(
      map(data => {
        if (has(data, 'statusCode')) {
          const { statusCode, ...rest } = data;

          // @ts-ignore
          const { message, code } = this.statusCodeService.sc(statusCode, lang);

          return {
            ...rest,
            status_code: code,
            message,
          };
        }

        return data;
      }),
    );
  }
}
