import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as _ from 'lodash';
import * as admin from 'firebase-admin';
import { notifyMsg, tmpMessageN } from 'knowin/status-codes';

export interface IPushSendData {
  type?: string;
  quizid?: string;
  title?: string;
  body?: string;
  data?: any;
}

@Injectable()
export class NotificationService implements OnModuleInit {
  onModuleInit() {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: 'https://knowin-1d83f.firebaseio.com',
    });
  }

  send(tokens: any[], msg: any) {
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
}
