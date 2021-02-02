import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const msg: any = exception.getResponse();

    const msgStr = [];
    try {
      msg.message.forEach((item: any) => {
        const keys = Object.keys(item.constraints);
        keys.forEach(key => msgStr.push(item.constraints[key]));
      });
    } catch (error) {
      msgStr.push('Bad Request, check you reqest');
    }

    response.status(status).json({
      status: false,
      // @ts-ignore
      message: msgStr.join(` , `),
      body: {
        message: msg.message || 'Unknown',
      },
    });
  }
}
