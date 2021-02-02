import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as _ from 'lodash';
import * as admin from 'firebase-admin';
import { notifyMsg } from 'knowin/status-codes';

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
      const _msg = notifyMsg(msg.type, locale);

      try {
        await admin.messaging().sendToDevice(fcm_token, {
          data: {
            type: msg.type,
            quizId: msg.quizid,
            ..._msg,
          },
        });
      } catch (error) {
        Logger.log(
          `Failed to send notification from Polling TOKEN: ${fcm_token} LOCALE: ${locale}`,
        );
      }
    });
  }
}
