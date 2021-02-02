import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as AWS from 'aws-sdk';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as uuid from 'uuid';
import { IOtp } from '../auth/interfaces/otp.interface';
import { IUser, IProducts, IAccount } from 'knowin/common';
import { PasswordUtil, Hashids } from './auth.utils';
import { tmpMessage } from 'knowin/status-codes';

AWS.config.update({ region: 'us-east-1' });

export interface IOtpSendConfig {
  ip: string;
}

@Injectable()
export class AuthService {
  private readonly sns = new AWS.SNS();

  constructor(
    @InjectModel('Otp') private readonly otpModel: Model<IOtp>,
    @InjectModel('Users') private readonly usersModel: Model<IUser>,
    @InjectModel('Products')
    private readonly productsModel: Model<IProducts>,
    @InjectModel('Account')
    private readonly accountModel: Model<IAccount>,
    private readonly jwtService: JwtService,
    private readonly passwordUtil: PasswordUtil,
  ) {}

  async otpSeq(mobile: string, lang: any) {
    // Genrate a new otp
    const otp = this.genrateOtp();

    // sent the otp to a mobile device in production
    if (process.env.KNOWIN_ENV === 'production') {
      this.sendOtpToMobile(mobile, otp, lang);
    }

    // Save the info in the DB for refrence later
    await this.otpModel.findOneAndUpdate(
      {
        mobile,
      },
      {
        mobile,
        otp,
      },
      {
        upsert: true,
        new: true,
      },
    );

    return otp;
  }

  async verifyOtpAndGenToken(otp: number, mobile: string, fcm_token?: string) {
    // veriy otp
    const doc = await this.otpModel.findOne({
      mobile,
      otp,
    });

    if (doc === null) {
      return {
        verify: false,
      };
    } else {
      await this.otpModel.deleteOne({
        mobile,
        otp,
      });
    }

    const userDoc = await this.usersModel.findOne({ mobile });

    let firstTime = true;
    let userid: string;
    let role = 'user';
    let status = 'active';
    let referal_code: string;

    if (!userDoc) {
      // make the user
      userid = uuid.v4();
      referal_code = this.genReferalCode(userid);
      await this.usersModel.create({
        userid,
        mobile,
        role: 'user',
        status: 'active',
        referal_code,
      });

      await this.accountModel.create({
        userid,
        points: 0,
      });

      // Free Points
      // ---------------------------
      await this.productsModel.create({
        userid,
        productid: 'key',
        count: 0,
      });

      await this.productsModel.create({
        userid,
        productid: 'extra_life_joker',
        count: 2,
      });
      await this.productsModel.create({
        userid,
        productid: 'two_answer',
        count: 2,
      });
      await this.productsModel.create({
        userid,
        productid: 'pass_question',
        count: 2,
      });
      await this.productsModel.create({
        userid,
        productid: 'fifty_fifty',
        count: 2,
      });
      // ---------------------------
    } else {
      userid = userDoc.userid;
      role = userDoc.role;
      status = userDoc.status;
      firstTime = false;
    }

    if (fcm_token) {
      await this.usersModel.updateOne(
        {
          userid,
        },
        {
          $set: {
            fcm_token,
          },
        },
      );
    }

    if (status === 'blocked') {
      return {
        verify: true,
        data: {
          user_id: userid,
          first_time: firstTime,
          role,
          account_status: status,
          api_token: null,
        },
      };
    }

    const token = await this.genJwt({
      userid,
      role: 'user',
      for: 'mobile',
    });

    return {
      verify: true,
      data: {
        user_id: userid,
        first_time: firstTime,
        role,
        account_status: status,
        api_token: token,
        referal_code,
      },
    };
  }

  genJwt(payload: any) {
    return this.jwtService.signAsync(payload);
  }

  // Will return a digit random number
  genrateOtp() {
    return Math.floor(100000 + Math.random() * 900000);
  }

  sendOtpToMobile(mobile: string, otp: number, lang: any) {
    const params = {
      Message: tmpMessage(
        'OTP',
        {
          otp,
        },
        lang,
      ),
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: 'KNOWIN',
        },
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
      },
      MessageStructure: 'string',
      PhoneNumber: mobile.toString(),
    };

    this.sns.publish(params, err => {
      if (err) {
        Logger.error(err);
        Logger.error(err.stack);
      }
    });
  }

  // ADMIN
  async setNewPassword(userid: string, newPass: string, old: string) {
    const userDoc = await this.usersModel.findOne({ userid });

    if (userDoc === null) {
      return {
        verify: false,
        message: 'No user found',
        data: {},
      };
    }

    const { password_set, hash } = userDoc;

    if (password_set) {
      const isCorrect = await this.passwordUtil.verifyHash(old, hash);
      if (isCorrect) {
        const newHash: any = await this.passwordUtil.genHash(newPass);

        await this.usersModel.updateOne(
          {
            userid,
          },
          {
            $set: {
              hash: newHash,
            },
          },
        );

        return {
          verify: true,
          message: 'Done',
          data: {},
        };
      } else {
        return {
          verify: false,
          message: 'Password incorrect',
          data: {},
        };
      }
    }
  }

  async verifyOtpAndGenTokenDash(
    otp: number,
    password: string,
    mobile: string,
  ) {
    // veriy otp
    const doc = await this.otpModel.findOne({
      mobile,
      otp,
    });

    if (doc === null) {
      return {
        verify: false,
        message: 'Invalid OTP',
      };
    }

    const userDoc = await this.usersModel.findOne({ mobile });

    if (userDoc === null) {
      return {
        verify: false,
        message: 'No user found',
      };
    }

    const { userid, role, password_set, hash, status } = userDoc;

    if (password_set) {
      const isCorrect = await this.passwordUtil.verifyHash(password, hash);
      if (isCorrect) {
        const token = await this.genJwt({
          userid,
          role,
        });

        await this.otpModel.deleteOne({
          mobile,
          otp,
        });

        return {
          verify: true,
          data: {
            user_id: userid,
            role: role,
            account_status: status,
            api_token: token,
          },
        };
      } else {
        return {
          verify: false,
          message: 'Password incorrect',
        };
      }
    } else {
      return {
        verify: false,
        message: 'Password not set',
      };
    }
  }

  genReferalCode(userid: string) {
    const hashids = new Hashids(userid);
    return hashids.encode(1, 2, 3);
  }
}
