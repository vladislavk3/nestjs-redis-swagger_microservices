import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as _ from 'lodash';
import * as AWS from 'aws-sdk';
import * as moment from 'moment';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as generatePassword from 'password-generator';
import { IUser, IAccount, IAnalytics } from 'knowin/common';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { UpdateUserEmailDto } from '../users/dto/update-email.dto';
import { IEmailVerify } from '../users/interfaces/email-verify.interface';
import { VerifyUserEmailDto } from '../users/dto/verify-email.dto';
import { UpdateUserRoleDto } from './dto/update-roles.dto';
import { PasswordUtil } from '../auth/auth.utils';
import { NotificationService } from '../notification/notification.service';
import { ModuleRef } from '@nestjs/core';

AWS.config.update({ region: 'us-east-1' });

export interface IGetUserOptions {
  info: string;
  account: string;
}

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly ses = new AWS.SES();

  private readonly REFERAL_POINTS = {
    referrer: 50,
    referent: 50,
  };

  private readonly whitelist = {
    info: [
      'userid',
      'name',
      'username',
      'email',
      'avatar',
      'gender',
      'role',
      'mobile',
      'status',
      'fcm_token',
      'referal_code',
      'referal_by',
      'dob',
      'locale',
    ],
    account: ['points', 'wongames', 'playedgames', 'joinedgames', 'iban_no'],
  };

  private notifyService: NotificationService;
  constructor(
    @InjectModel('Users') private readonly usersModel: Model<IUser>,
    @InjectModel('EmailVerify')
    private readonly emailVerifyModel: Model<IEmailVerify>,
    @InjectModel('Account')
    private readonly accountModel: Model<IAccount>,
    @InjectModel('Analytics')
    private readonly analyticsModel: Model<IAnalytics>,
    private readonly passwordUtil: PasswordUtil,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    this.notifyService = this.moduleRef.get(NotificationService, {
      strict: false,
    });
  }

  async getUserInfo(userid: string, options: IGetUserOptions) {
    const { info, account } = options;

    // user info
    const infoQuery = info
      .trim()
      .split(',')
      .filter(item => this.whitelist.info.includes(item));

    let infoData = {};

    if (infoQuery.length !== 0) {
      infoData = await this.usersModel.findOne(
        { userid },
        infoQuery.join(' ') + ' -_id',
      );
    }

    // Account info
    const accountQuery = account
      .trim()
      .split(',')
      .filter(item => this.whitelist.account.includes(item));
    let accountData = {};

    if (accountQuery.length !== 0) {
      accountData = await this.accountModel.findOne(
        { userid },
        accountQuery.join(' ') + ' -_id',
      );
    }

    return {
      info: infoData,
      account: accountData,
    };
  }

  checkUsername(username: string) {
    return this.usersModel.exists({
      username,
    });
  }

  usersInfoFromIds(userList: string[]) {
    return this.usersModel.find(
      {
        userid: {
          $in: userList,
        },
      },
      'avatar username name -_id',
    );
  }

  updateUserInfo(userid: string, updateUserDTO: UpdateUserDto) {
    return this.usersModel.findOneAndUpdate(
      { userid },
      { $set: { ...updateUserDTO } },
      {
        projection: '-_id -__v -hash',
        new: true,
      },
    );
  }

  async updateImage(userid: string, fileUrl: string) {
    return this.usersModel.updateOne(
      {
        userid,
      },
      {
        $set: {
          avatar: fileUrl,
        },
      },
    );
  }

  async saveTokenAndSendEmail(
    updateUserEmail: UpdateUserEmailDto,
    userid: string,
  ) {
    // Genrate a new otp
    const otp = this.genrateOtp();

    // sent the otp to a mobile device
    //this.sendOtpToEmail(otp, updateUserEmail.email);
    console.log(`OTP sent to ${updateUserEmail.email} with otp ${otp}`);
    // Save the info in the DB for refrence later
    await this.emailVerifyModel.findOneAndUpdate(
      {
        userid,
      },
      {
        forEmail: updateUserEmail.email,
        otp,
        userid,
      },
      {
        upsert: true,
        new: true,
      },
    );
  }

  async verifyAndUpdateEmail(
    verifyUserEmail: VerifyUserEmailDto,
    userid: string,
  ) {
    const doc = await this.emailVerifyModel.findOne({
      userid,
      otp: verifyUserEmail.otp,
    });

    if (!doc) {
      return {
        verify: false,
        data: {
          message: `Otp is not valid`,
          data: {},
        },
      };
    } else {
      try {
        await this.usersModel.updateOne(
          {
            userid,
          },
          {
            $set: { email: doc.forEmail },
          },
        );

        return {
          verify: true,
          data: {
            message: `Email Address saved!`,
            data: {},
          },
        };
      } catch (error) {
        if (error.name === 'MongoError' && error.code === 11000) {
          const errorOn = Object.keys(error.keyPattern).join(',');

          return {
            verify: false,
            data: {
              message: `${errorOn} already belongs to a another user`,
              data: {},
            },
          };
        } else {
          return {
            verify: false,
            data: {
              message: `Try Again Internal Error`,
              data: {},
            },
          };
        }
      }
    }
  }

  async getFcmToken(userid: string) {
    try {
      const { fcm_token } = await this.usersModel.findOne(
        { userid },
        'fcm_token',
      );
      return fcm_token;
    } catch (error) {
      Logger.error(error.toString());
      return '';
    }
  }

  async getFcmTokens(userids: string[]): Promise<any[]> {
    try {
      const docs = await this.usersModel.find(
        {
          userid: {
            $in: userids,
          },
        },
        'fcm_token locale',
      );

      return docs;
    } catch (error) {
      Logger.error(error.toString());
      return [];
    }
  }

  sendOtpToEmail(otp: number, email: string) {
    const params = {
      Destination: {
        ToAddresses: ['cihatsaman@yahoo.com'],
      },
      Message: {
        Body: {
          Text: {
            Charset: 'UTF-8',
            Data: `${otp} is your otp for verifying you email.`,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Knowin email verify OTP',
        },
      },
      Source: 'cihatsaman@yahoo.com',
    };

    this.ses.sendEmail(params, function(err, data) {
      if (err) Logger.error(err, err.stack);
      else Logger.log(data); // successful response
    });
  }

  // Will return a digit random number
  genrateOtp() {
    return Math.floor(100000 + Math.random() * 900000);
  }

  // Admin stuff
  async getUsersList(limit: number, page: number, search: any) {
    let query = {};
    if (search) {
      query = {
        $text: {
          $search: search,
        },
      };
    }

    const total = await this.usersModel.countDocuments();
    const userList = await this.usersModel
      .find(query, '-_id -__v -fcm_token -hash')
      .skip(+limit * +page)
      .limit(+limit);

    return {
      total,
      userList,
    };
  }

  async updateRoles(updateDto: UpdateUserRoleDto) {
    await this.usersModel.updateOne(
      { userid: updateDto.userid },
      {
        $set: {
          role: updateDto.role,
          status: updateDto.status,
        },
      },
    );
  }

  async getRolesAndStatus(userid: string) {
    return this.usersModel.findOne({ userid }, 'role status');
  }

  async genPass(userid: string) {
    const userDoc = await this.usersModel.findOne({ userid }, 'password_set');

    if (userDoc) {
      if (!userDoc.password_set) {
        const pass = generatePassword();
        const hash: any = await this.passwordUtil.genHash(pass);

        await this.usersModel.updateOne(
          {
            userid,
          },
          {
            $set: {
              password_set: true,
              hash,
            },
          },
        );

        return {
          done: true,
          pass,
          message: 'Done',
        };
      }

      return {
        done: false,
        pass: null,
        message: 'Already set',
      };
    }

    return {
      done: false,
      pass: null,
      message: 'user not found',
    };
  }

  // Referal
  async redeemReferal(userid: string, code: string) {
    code = code.trim();
    // Check if already
    const codeExists = await this.usersModel.exists({ referal_code: code });
    if (!codeExists) {
      return {
        status: false,
        statusCode: 'M_UU5',
      };
    }

    // Check if already using a code
    const { referal_by } = await this.usersModel.findOne({ userid });
    if (!!referal_by) {
      return {
        status: false,
        statusCode: 'M_UU6',
      };
    }

    // Update referrer points
    const { userid: referrerID } = await this.usersModel.findOne({
      referal_code: code,
    });

    if (referrerID === userid) {
      return {
        status: false,
        statusCode: 'M_UU7',
      };
    }

    // Update the referent points
    await this.usersModel.updateOne(
      {
        userid,
      },
      {
        $set: {
          referal_by: code,
        },
      },
    );

    await this.accountModel.updateOne(
      {
        userid,
      },
      {
        $inc: {
          points: this.REFERAL_POINTS.referent,
        },
      },
    );

    await this.updatePointsGraphSingle(userid, this.REFERAL_POINTS.referent);

    return {
      status: true,
      statusCode: 'M_UU8',
    };
  }

  async getReferalStats(userid: string) {
    const { referal_code, referal_by } = await this.usersModel.findOne(
      { userid },
      {
        referal_code: 1,
        referal_by: 1,
      },
    );
    const referal_count = await this.usersModel.countDocuments({
      referal_by: referal_code,
    });

    return {
      referal_code,
      referal_count,
      referal_by: referal_by || '',
    };
  }

  async getReferent(userid: string, page: number, limit: number) {
    const { referal_code } = await this.usersModel.findOne(
      {
        userid,
      },
      {
        referal_code: 1,
      },
    );

    let pipline = [];

    // match stage
    pipline.push({
      $match: {
        referal_by: referal_code,
      },
    });

    pipline.push({
      $lookup: {
        from: 'accounts',
        localField: 'userid',
        foreignField: 'userid',
        as: 'info',
      },
    });

    pipline.push({
      $unwind: {
        path: '$info',
      },
    });

    pipline.push({
      $addFields: {
        referal_completed: '$info.referal_completed',
      },
    });

    //project;
    pipline.push({
      $project: {
        _id: 0,
        username: 1,
        userid: 1,
        avatar: 1,
        name: 1,
        createdAt: 1,
        referal_completed: 1,
      },
    });

    // skip and limit
    pipline.push({
      $skip: +page * +limit,
    });

    pipline.push({
      $limit: +limit,
    });

    return this.usersModel.aggregate(pipline);
  }

  async updatePointsGraphSingle(userid: string, points: number) {
    const today_utc = moment()
      .utc()
      .toISOString();

    await this.analyticsModel.updateOne(
      {
        userid,
      },
      {
        $push: {
          points_won: {
            // @ts-ignore
            date: today_utc,
            points,
          },
        },
        $inc: {
          total_earned: points,
        },
      },
      { upsert: true },
    );
  }

  async getRefInfo(ids: string[]) {
    // fetch codes
    const userdocs = await this.usersModel.find(
      {
        userid: {
          $in: ids,
        },
        referal_by: {
          $exists: true,
        },
      },
      'referal_by',
    );

    if (userdocs.length === 0) return [];

    // arrange codes in a list for query
    const codes = userdocs.map(({ referal_by }) => referal_by);

    const referalsDocs = await this.usersModel.find(
      {
        referal_code: {
          $in: codes,
        },
      },
      'userid',
    );

    const referalsIds = referalsDocs.map(({ userid }) => userid);

    return referalsIds;
  }

  async sendPush(userid: string, title: string, message: string) {
    await this.notifyService.sendPush(userid, {
      type: 'ADMIN_MESSAGE',
      title,
      message,
    });
  }
}
