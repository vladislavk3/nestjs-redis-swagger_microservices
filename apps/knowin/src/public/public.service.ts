import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';

AWS.config.update({ region: 'us-east-1' });

@Injectable()
export class PublicService {
  private readonly ses = new AWS.SES();

  async sendEmail({ name, email, subject, message, from }) {
    const params = {
      Destination: {
        ToAddresses: ['support@smnway.com'],
      },
      Message: {
        Body: {
          Text: {
            Charset: 'UTF-8',
            Data: `
from: ${from}
Name: ${name}
Email: ${email}
Subject: ${subject}
Message: ${message}
            `,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: `Email from site ${from}`,
        },
      },
      Source: `support@smnway.com`,
    };

    this.ses.sendEmail(params, function(err, data) {
      if (err) Logger.error(err, err.stack);
      else Logger.log(data); // successful response
    });
  }
}
