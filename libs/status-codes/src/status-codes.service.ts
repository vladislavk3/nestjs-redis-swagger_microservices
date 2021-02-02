import { Injectable } from '@nestjs/common';
import { codes } from './code.map';

@Injectable()
export class StatusCodesService {
  codes = codes;

  public sc(code: keyof typeof codes, lang: string) {
    // if code is not defined throw error
    if (!codes.hasOwnProperty(code)) {
      new Error(`Status Code [${code}] is not defined`);
    }

    return {
      code,
      message: codes[code][lang],
    };
  }
}
