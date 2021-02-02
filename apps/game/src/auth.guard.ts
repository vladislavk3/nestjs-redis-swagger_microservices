import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import configuration from './config/configuration';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger('Auth Guard');
  canActivate(context: ExecutionContext): boolean {
    try {
      const headers = context.switchToHttp().getRequest().headers;
      const { authorization } = headers;
      if (configuration.secret.API_ACCESS_TOKEN_GAME === authorization) {
        return true;
      }

      this.logger.warn(`An UnAuthorization access from`);
      this.logger.warn(headers);
      return false;
    } catch (error) {
      this.logger.error(
        `Error during game start api authrization`,
        error.toString(),
        error.stack(),
      );
    }
  }
}
