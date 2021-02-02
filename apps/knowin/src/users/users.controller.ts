import {
  Controller,
  Get,
  Req,
  Body,
  Post,
  Query,
  UseInterceptors,
  UploadedFile,
  Logger,
  UseGuards,
} from '@nestjs/common';
import * as _ from 'lodash';
import {
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import * as moment from 'moment';
import { AuthRequest } from '../jwt.middleware';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { UpdateUserEmailDto } from '../users/dto/update-email.dto';
import { VerifyUserEmailDto } from '../users/dto/verify-email.dto';
import { UpdateUserRoleDto } from '../users/dto/update-roles.dto';
import { FileUploadDto } from '../users/dto/avatar-update.dto';
import { RoleGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';

import * as AWS from 'aws-sdk';
import { AuthService } from '../auth/auth.service';
import { getCode } from 'knowin/status-codes';
AWS.config.update({ region: 'us-east-1' });

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(RoleGuard)
export class UsersController {
  private readonly s3 = new AWS.S3({
    apiVersion: '2006-03-01',
  });

  constructor(
    readonly usersService: UsersService,
    readonly authService: AuthService,
  ) {}

  @Get('/')
  @ApiQuery({ name: 'info', required: false })
  @ApiQuery({ name: 'account', required: false })
  @Roles('user', 'admin', 'moderator')
  async getUser(
    @Req() req: AuthRequest,
    @Query('info') info = '',
    @Query('account') account = '',
  ) {
    const user = await this.usersService.getUserInfo(req.user.userid, {
      info,
      account,
    });
    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: user,
    };
  }

  @Get('/username')
  @Roles('user', 'admin', 'moderator')
  async checkUsername(@Query('username') username: string) {
    const exists = await this.usersService.checkUsername(username);

    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: {
        exists,
        username,
      },
    };
  }

  @Get('/usersinfo')
  @Roles('admin', 'moderator')
  async usersInfoFromIds(@Query('userList') userList: string[]) {
    const usersInfo = await this.usersService.usersInfoFromIds(userList);

    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: {
        usersInfo,
      },
    };
  }

  @Post('/update')
  @Roles('user', 'admin', 'moderator')
  async updateUser(
    @Req() req: AuthRequest,
    @Body() updateUserDTO: UpdateUserDto,
  ) {
    try {
      if (Object.keys(updateUserDTO).length === 0) {
        return {
          status: false,
          statusCode: getCode('M_UU1'),
          data: {},
        };
      }

      if (updateUserDTO.dob) {
        const m = moment(updateUserDTO.dob, 'DD/MM/YYYY', true);
        if (!m.isValid()) {
          return {
            status: false,
            statusCode: getCode('M_UU2'),
            data: updateUserDTO,
          };
        }
      }

      if (updateUserDTO.username) {
        const doesExists = await this.usersService.checkUsername(
          updateUserDTO.username,
        );

        if (doesExists) {
          return {
            status: false,
            statusCode: getCode('M_UU10'),
            data: updateUserDTO,
          };
        }
      }

      const user = await this.usersService.updateUserInfo(
        req.user.userid,
        updateUserDTO,
      );
      return {
        status: true,
        statusCode: getCode('M_OK'),
        data: user,
      };
    } catch (error) {
      if (error.name === 'MongoError' && error.code === 11000) {
        return {
          status: false,
          statusCode: getCode('M_UU3'),
          data: {},
        };
      }

      return {
        status: false,
        statusCode: getCode('M_IE'),
        data: {},
      };
    }
  }

  @Post('/update/profile')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (_, file, callback) => {
        const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
        if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'List of cats',
    type: FileUploadDto,
  })
  @Roles('user', 'admin', 'moderator')
  async updateProfile(@Req() req: AuthRequest, @UploadedFile() file: any) {
    if (!file) {
      return {
        status: false,
        statusCode: getCode('M_UU4'),
      };
    } else {
      try {
        const profileName = req.user.userid;
        const uploadParams = {
          Bucket: 'knowin',
          Key: profileName,
          Body: file.buffer,
          ACL: 'public-read',
        };

        const result = await this.uploadFile(uploadParams);
        await this.usersService.updateImage(req.user.userid, result.Location);
        return {
          status: true,
          statusCode: getCode('M_DONE'),
        };
      } catch (error) {
        Logger.error(error.toString());
        return {
          status: false,
          statusCode: getCode('M_DONE'),
        };
      }
    }
  }

  async uploadFile(config: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.s3.upload(config, (err: any, data: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  @Post('/redeem-referal')
  @Roles('user', 'admin', 'moderator')
  async redeemReferal(@Req() req: AuthRequest, @Query('code') code: string) {
    const { userid } = req.user;
    const { status, statusCode } = await this.usersService.redeemReferal(
      userid,
      code,
    );

    return {
      status,
      statusCode,
    };
  }

  @Get('/referal-stats')
  @Roles('user', 'admin', 'moderator')
  async getReferal(@Req() req: AuthRequest) {
    const { userid } = req.user;
    const data = await this.usersService.getReferalStats(userid);

    return {
      status: true,
      statusCode: getCode('M_DONE'),
      data: data,
    };
  }

  @ApiQuery({ name: 'userid', required: false })
  @Get('/referent')
  @Roles('user', 'admin', 'moderator')
  async getReffere(
    @Req() req: AuthRequest,
    @Query('limit') limit: number,
    @Query('page') page: number,
    @Query('userid') userid: string,
  ) {
    if (!limit) {
      limit = 10;
    }

    if (!page) {
      page = 0;
    }

    if (_.isEmpty(userid)) {
      userid = req.user.userid;
    }

    const data = await this.usersService.getReferent(userid, page, limit);

    return {
      status: true,
      message: 'Done',
      statusCode: getCode('M_DONE'),
      data: data,
    };
  }

  @Post('/update/email')
  @Roles('user', 'admin', 'moderator')
  async updateEmail(
    @Req() req: AuthRequest,
    @Body() updateUserEmail: UpdateUserEmailDto,
  ) {
    try {
      await this.usersService.saveTokenAndSendEmail(
        updateUserEmail,
        req.user.userid,
      );
      return {
        status: true,
        statusCode: getCode('M_UU9'),
        data: {},
      };
    } catch (error) {
      return {
        status: false,
        statusCode: getCode('M_TRY_AGAIN'),
        data: {
          error,
        },
      };
    }
  }

  @Post('/update/email/auth')
  @Roles('user', 'admin', 'moderator')
  async verifyAndUpdateEmail(
    @Req() req: AuthRequest,
    @Body() verifyUserEmail: VerifyUserEmailDto,
  ) {
    try {
      const result = await this.usersService.verifyAndUpdateEmail(
        verifyUserEmail,
        req.user.userid,
      );

      if (result.verify) {
        return {
          status: true,
          statusCode: getCode('M_OK'),
          ...result.data,
        };
      } else {
        return {
          status: false,
          statusCode: getCode('M_NOT_FOUND'),
          ...result.data,
        };
      }
    } catch (error) {
      return {
        status: false,
        statusCode: getCode('M_TRY_AGAIN'),
        data: {
          error,
        },
      };
    }
  }

  // Only admin roles
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'search', required: false })
  @Roles('admin')
  @Get('/admin/all')
  async getUsersList(
    @Query('limit') limit: number,
    @Query('page') page: number,
    @Query('search') search: string,
  ) {
    if (!limit) {
      limit = 10;
    }
    if (!page) {
      page = 0;
    }

    if (!search) {
      search = null;
    }
    const data = await this.usersService.getUsersList(limit, page, search);
    return {
      status: true,
      message: 'Done',
      ...data,
    };
  }

  // Only admin roles
  @Roles('admin')
  @Post('/admin/role')
  async updateUsersRoles(@Body() updateDto: UpdateUserRoleDto) {
    await this.usersService.updateRoles(updateDto);

    return {
      status: true,
      statusCode: getCode('M_DONE'),
    };
  }

  @Roles('admin')
  @Post('/staff/gen-pass')
  async genPass(@Body() dto: { userid: string }) {
    const { done, message, pass } = await this.usersService.genPass(dto.userid);

    return {
      status: done,
      message,
      data: {
        pass,
      },
    };
  }

  @Roles('admin', 'moderator')
  @Post('/staff/change-password')
  async changePassword(
    @Req() req: AuthRequest,
    @Body()
    updatePass: {
      newPass: string;
      old: string;
    },
  ) {
    // start the seq
    const data = await this.authService.setNewPassword(
      req.user.userid,
      updatePass.newPass,
      updatePass.old,
    );

    return {
      status: data.verify,
      message: data.message,
      data: data.data,
    };
  }

  @Roles('admin')
  @Post('/send-push')
  async sendPush(
    @Query('userid') userid: string,
    @Query('title') title: string,
    @Query('message') message: string,
  ) {
    await this.usersService.sendPush(userid, title, message);
    return {
      status: true,
      statusCode: getCode('M_DONE'),
      data: {},
    };
  }
}
