import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { Role } from 'knowin/common';
import { UsersService } from './users/users.service';

interface User {
  userid: string;
  role: Role;
  status: string;
}

export interface AuthRequest extends Request {
  user: User;
}

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  private readonly whitelist = new Map([
    ['/leaderboard', 'POST'],
    ['/version', 'GET'],
  ]);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}
  async use(req: AuthRequest, res: Response, next: () => any) {
    if (this.whitelist.has(req.path)) {
      if (this.whitelist.get(req.path) === req.method) {
        next();
        return;
      }
    }

    const token = req.header('Authorization');
    if (!token) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        status: false,
        message: 'UNAUTHORIZED , protected resources',
        data: {},
      });
    }

    try {
      const decoded = await this.jwtService.verifyAsync(
        token.split('Bearer ')[1],
      );

      // get the roles from the DB
      const { status, role } = await this.userService.getRolesAndStatus(
        decoded.userid,
      );

      if (status === 'blocked') {
        return res.status(HttpStatus.FORBIDDEN).json({
          status: false,
          message: 'FORBIDDEN , user blocked',
          data: {},
        });
      }

      req.user = {
        userid: decoded.userid,
        role,
        status,
      };

      next();
    } catch (error) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        status: false,
        message: 'UNAUTHORIZED , Token invalid or expired',
        data: {},
      });
    }
  }
}
