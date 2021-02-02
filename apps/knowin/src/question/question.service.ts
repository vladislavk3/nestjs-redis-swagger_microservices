import { Injectable } from '@nestjs/common';
import { AddQuestionDto } from './dto/add-question.dto';
import { InjectModel } from '@nestjs/mongoose';
import { IQuestion } from 'knowin/common';
import { Model } from 'mongoose';
import uuid = require('uuid');

@Injectable()
export class QuestionService {
  constructor(
    @InjectModel('Question') private readonly questionModel: Model<IQuestion>,
  ) {}

  addQuestion(addQuestionDto: AddQuestionDto) {
    const id = uuid.v4();
    const data = {
      ...addQuestionDto,
      questionid: id,
    };
    const newDoc = new this.questionModel(data);
    return newDoc.save();
  }

  async addQuestionBulk(addQuestionDto: AddQuestionDto[]) {
    const query = addQuestionDto.map((qData: AddQuestionDto) => {
      const id = uuid.v4();
      const data = {
        ...qData,
        questionid: id,
      };
      return data;
    });
    const docs = await this.questionModel.insertMany(query);
    return docs;
  }

  updateQuestion(questionid: string, addQuestionDto: AddQuestionDto) {
    return this.questionModel.findOneAndUpdate(
      { questionid },
      // @ts-ignore
      { $set: addQuestionDto },
    );
  }

  deleteQuestion(questionid: string) {
    return this.questionModel.findOneAndDelete({ questionid });
  }

  async getAllQuestions(
    page: number,
    count: number,
    search?: string,
    level?: string,
    tags?: string[],
    onlyNew?: any,
    rangeEnable?: boolean,
    range?: number,
  ) {
    const pipline = [];
    page -= 1;

    if (search) {
      pipline.push({
        $match: { $text: { $search: search } },
      });
      pipline.push({
        $sort: { score: { $meta: 'textScore' } },
      });
    }

    if (onlyNew === 1 || onlyNew === '1') {
      pipline.push({
        $match: { played: 0 },
      });
    }

    pipline.push({
      $addFields: {
        percentage: {
          $cond: [
            {
              $eq: ['$played', 0],
            },
            0,
            {
              $multiply: [{ $divide: ['$win', '$played'] }, 100],
            },
          ],
        },
      },
    });

    // Removed this coz of pag issue
    //pipline.push({
    //$sort: {
    //percentage: 1,
    //},
    //});

    const match: any = {};

    if (level) {
      match.level = level;
    }

    if (tags) {
      match.tags = {
        $in: tags,
      };
    }

    if (rangeEnable) {
      match.percentage = {
        $lte: range,
      };
    }

    pipline.push({
      $match: match,
    });

    if (rangeEnable) {
      pipline.push({
        $sort: {
          percentage: -1,
        },
      });
    }

    pipline.push({
      $skip: +page * +count,
    });

    pipline.push({
      $limit: +count,
    });

    pipline.push({
      $project: { _id: 0, __v: 0, 'options._id': 0 },
    });

    try {
      const questions = await this.questionModel.aggregate(pipline);
      const total = await this.questionModel.countDocuments();

      return {
        questions,
        total,
      };
    } catch (error) {
      throw error;
    }
  }

  getQuestion(questionid: string) {
    return this.questionModel.findOne({ questionid });
  }

  resetQuestion(questionid: string) {
    return this.questionModel.updateOne(
      { questionid },
      {
        $set: {
          win: 0,
          played: 0,
        },
      },
    );
  }
}
