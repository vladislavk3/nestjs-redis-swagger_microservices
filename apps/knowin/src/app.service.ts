import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ISettings } from './settings/settings.interface';
import { Model } from 'mongoose';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @InjectModel('Settings') private readonly settingsModel: Model<ISettings>,
  ) {}

  async onModuleInit() {
    // Create a settings doc if does not exists
    const exists = await this.settingsModel.exists({});
    if (!exists) {
      await this.settingsModel.create({
        isMaintenance: false,
        version: '0.0.1',
      });
    }
  }

  setSettings(isMaintenance: boolean, version: string) {
    return this.settingsModel.updateMany(
      {},
      {
        $set: {
          isMaintenance,
          version,
        },
      },
    );
  }

  async getSettings() {
    const { isMaintenance, version } = await this.settingsModel.findOne(
      {},
      'isMaintenance version',
    );

    return {
      isMaintenance,
      version,
    };
  }
}
