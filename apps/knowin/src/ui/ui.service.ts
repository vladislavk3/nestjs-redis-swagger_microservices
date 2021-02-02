import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { IUI } from '../ui/ui.inteface';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UiService {
  constructor(@InjectModel('UI') private uiModule: Model<IUI>) {}

  newTag(tag: string) {
    const newTag = new this.uiModule({
      name: tag,
      type: 'tag',
    });

    return newTag.save();
  }

  newCategory(category: string) {
    const newCat = new this.uiModule({
      name: category,
      type: 'category',
    });

    return newCat.save();
  }

  async update(old: string, _new: string, type: string) {
    await this.uiModule.updateOne(
      {
        name: old,
        type,
      },
      {
        $set: {
          name: _new,
        },
      },
    );
  }

  async delete(name: string, type: string) {
    await this.uiModule.deleteOne({
      name,
      type,
    });
  }

  getAll(type: string) {
    return this.uiModule.find({ type }, '-_id -__v -type');
  }
}
