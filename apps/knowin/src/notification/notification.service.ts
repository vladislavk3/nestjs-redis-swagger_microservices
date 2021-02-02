import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as _ from 'lodash';
import * as admin from 'firebase-admin';
import { UsersService } from '../users/users.service';
import { notifyMsg, tmpMessageN } from 'knowin/status-codes';
import { ModuleRef } from '@nestjs/core';

type PushTypes = 'NEW_QUIZ' | 'USER_JOINED' | 'NOTIFICATION_SAVE';

export interface IData {
  type: PushTypes;
  quizid?: string;
  userid?: string;
  transactionId?: string;
  message?: string;
}

export interface IPushSendData {
  data?: IData;
  topic?: string;
  title?: string;
  body?: string;
}

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger('NotificationService');
  private userService: UsersService;

  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit() {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: 'https://knowin-1d83f.firebaseio.com',
    });
    this.userService = this.moduleRef.get(UsersService, { strict: false });
  }

  async sendNpush(list: string[], msg: IPushSendData) {
    const cnks = _.chunk(list, 500);
    cnks.forEach(async tokens => {
      await this.send(tokens, msg);
    });

    return {
      status: true,
      message: 'failed to notification sent notification!',
    };
  }

  async sendUsingId(userid: string, msg: IData) {
    const token = await this.userService.getFcmToken(userid);

    if (_.isEmpty(token)) {
      this.logger.error(`Can't send notification to ${token}`);
    } else {
      const res = await admin.messaging().sendToDevice(token, {
        data: {
          type: msg.type,
          transactionId: msg.transactionId,
          message: msg.message,
        },
      });

      this.logger.log(res);
    }
  }

  async sendNUsingIds(userid: string[], msg: any) {
    const tokens = await this.userService.getFcmTokens(userid);

    tokens.forEach(async token_data => {
      const { fcm_token, locale } = token_data;
      let rest: any;
      if (msg.type === 'GAME_CANCELLED') {
        rest = tmpMessageN(msg.type, msg.context, locale);
      } else {
        rest = notifyMsg(msg.type, locale);
      }

      try {
        await admin.messaging().sendToDevice(fcm_token, {
          data: {
            type: msg.type,
            quizId: msg.quizid,
            ...rest,
          },
        });
      } catch (error) {
        Logger.log(
          `Failed to send notification from Game TOKEN: ${fcm_token} LOCALE: ${locale}`,
        );
      }
    });
  }

  async sendToAll(msg: IPushSendData) {
    const { data, topic } = msg;
    this.logger.log({
      data,
      topic,
    });
    const res = await admin.messaging().send({
      data: {
        ...data,
      },
      topic,
    });
    this.logger.log(res);
  }

  async send(tokens: string[], msg: IPushSendData) {
    try {
      const res = await admin.messaging().sendToDevice(tokens, {
        notification: {
          title: msg.title,
          body: msg.body,
        },
        data: { ...msg.data },
      });
      this.logger.log(`Message sent successfuly: ${res.successCount}`);
      return {
        status: true,
        message: 'failed to notification sent notification!',
      };
    } catch (error) {
      this.logger.error('Error: ', error.toString());

      return {
        status: false,
        message: 'failed to notification sent notification!',
      };
    }
  }

  async sendWithL(tokens: any[], msg: any) {
    tokens.forEach(async token_data => {
      const { fcm_token, locale } = token_data;
      try {
        await admin.messaging().sendToDevice(fcm_token, {
          data: {
            type: msg.type,
            quizId: msg.quizid,
            ...notifyMsg(msg.type, locale),
          },
        });
      } catch (error) {
        Logger.log(
          `Failed to send notification from Game TOKEN: ${fcm_token} LOCALE: ${locale}`,
        );
      }
    });
  }

  async sendPush(userid: string, msg: any) {
    const token = await this.userService.getFcmToken(userid);

    if (_.isEmpty(token)) {
      this.logger.error(`Can't send notification to ${token}`);
    } else {
      await admin.messaging().sendToDevice(token, {
        data: {
          ...msg,
        },
      });
    }
  }
}
