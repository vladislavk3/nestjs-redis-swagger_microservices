import { orderBy, times, floor, add, divide } from 'lodash';
import { Logger, Injectable } from '@nestjs/common';
import * as mongoose from 'mongoose';
import {
  RewardType,
  IQuiz,
  IProducts,
  IProductTypes,
  ProductsSchema,
  IUsersPlayedGame,
  IPlayedGame,
  IQuestionsPlayedGame,
  PlayedGameSchema,
} from 'knowin/common';
import { IUser } from '../interfaces/users.interface';
import { IQuestion } from '../interfaces/answers.interface';

export interface IPowerupInfo {
  userid: string;
  products: IProducts;
}

// -------------------------
//          NOTE
// -------------------------
// How this object will be initalized
// This will only have actions after initalized;
// it means it the object intracting with it will only be able
// it use it's methords they don't have to access the redis directly
// NOTE: Timeing will not be managed by this only the data.
@Injectable()
export class GameConfig {
  private gamedata = new Map<string, any>();
  quiz: IQuiz;
  questions: IQuestion[];
  players: IUser[];
  powerupInfo = new Map<string, IProducts>();
  powerupInfoMeta = new Map<string, number>();
  powerupInfoMetaQNo = new Map<string, any[]>();
  scope: string;
  startTime: Date;
  reward_type: RewardType;
  private productsModel: mongoose.Model<IProducts>;
  private playedGameModel: mongoose.Model<IPlayedGame>;

  constructor(
    conn: mongoose.Connection,
    quiz: IQuiz,
    questions: IQuestion[],
    players: IUser[],
    powerupInfo: IPowerupInfo[],
  ) {
    // Init connections
    this.productsModel = conn.model('Products', ProductsSchema);
    this.playedGameModel = conn.model('PlayedGame', PlayedGameSchema);
    this.quiz = quiz;
    this.startTime = quiz.starttime;
    this.questions = questions;
    this.players = players;
    this.reward_type = quiz.reward_type;
    powerupInfo.forEach(item => {
      const { userid, products } = item;
      this.powerupInfo.set(userid, products);
    });

    this.scope = this.quiz.quizid;
    this.initKeys();
  }

  // Helpers
  private addItem(key: string, value: any) {
    const scopedKey = this.scope + '.' + key;
    this.gamedata.set(scopedKey, value);
  }

  private getItem(key: string): any {
    const scopedKey = this.scope + '.' + key;
    return this.gamedata.get(scopedKey);
  }

  // Initalize all keys
  // TODO: Currently using key->value later can migrate to HashMaps
  private initKeys() {
    // Initalize Questions
    // Shuffling questions for random ordering
    //this.questions = shuffle(this.questions);

    this.questions.forEach((question, index) => {
      // Making sure to start form 1 not 0

      index += 1;
      const qTitleKey = `${index}.title`;
      const qOption1Key = `${index}.option.1`;
      const qOption2Key = `${index}.option.2`;
      const qOption3Key = `${index}.option.3`;
      const qOption4Key = `${index}.option.4`;

      const qOption1KeySelect = `${index}.option.1.select`;
      const qOption2KeySelect = `${index}.option.2.select`;
      const qOption3KeySelect = `${index}.option.3.select`;
      const qOption4KeySelect = `${index}.option.4.select`;

      const qAnsKey = `${index}.answer`;

      this.addItem(qTitleKey, question.title);

      this.addItem(qOption1Key, question.options[0].value);
      this.addItem(qOption2Key, question.options[1].value);
      this.addItem(qOption3Key, question.options[2].value);
      this.addItem(qOption4Key, question.options[3].value);

      this.addItem(qOption1KeySelect, 0);
      this.addItem(qOption2KeySelect, 0);
      this.addItem(qOption3KeySelect, 0);
      this.addItem(qOption4KeySelect, 0);

      this.addItem(qAnsKey, question.answerKey);
    });

    // Initalize Users
    this.players.forEach(player => {
      const playerKeys = this.questions.map((_, index) => {
        return `user.${player.userid}.${index + 1}`;
      });
      const playerKeysChoice = this.questions.map((_, index) => {
        return `user.${player.userid}.choice.${index + 1}`;
      });

      playerKeys.forEach(key => {
        this.addItem(key, -1);
      });

      playerKeysChoice.forEach(key => {
        this.addItem(key, 0);
      });

      this.addItem(`user.${player.userid}.avatar`, player.avatar || '');
      this.addItem(`user.${player.userid}.username`, player.username || '');
      this.addItem(`user.${player.userid}.name`, player.name || '');
    });
  }

  updateScore(userId: string, questionNo: number, value: 0 | 1) {
    const key = `user.${userId}.${questionNo}`;
    this.addItem(key, value);
  }

  saveChoice(userid: string, questionFor: number, choice: number | string) {
    const key = `user.${userid}.choice.${questionFor}`;
    this.addItem(key, choice);
  }

  getScore(userId: string, questionNo: number): any {
    const key = `user.${userId}.${questionNo}`;
    const score = this.getItem(key);
    return score;
  }

  setAnswerPer(choice: number, questionNo: number) {
    const _key = `${questionNo}.option.${choice}.select`;
    const key = `${this.scope}.${_key}`;
    let oldVal = this.gamedata.get(key);
    const newVal = (oldVal += 1);
    this.gamedata.set(key, newVal);
  }

  getAnswerScore(questionNo: number): any {
    return this.getItem(`${questionNo}.answer`);
  }

  getAnswerPer(questionNo: number): any {
    const qOption1KeySelect = `${questionNo}.option.1.select`;
    const qOption2KeySelect = `${questionNo}.option.2.select`;
    const qOption3KeySelect = `${questionNo}.option.3.select`;
    const qOption4KeySelect = `${questionNo}.option.4.select`;

    const q1 = this.getItem(qOption1KeySelect);
    const q2 = this.getItem(qOption2KeySelect);
    const q3 = this.getItem(qOption3KeySelect);
    const q4 = this.getItem(qOption4KeySelect);

    return {
      1: q1,
      2: q2,
      3: q3,
      4: q4,
    };
  }

  aggregateAns() {
    return this.questions.map((q, i) => {
      i += 1;
      const correctAns = parseInt(this.getItem(`${i}.answer`));
      const one = parseInt(this.getItem(`${i}.option.1.select`));
      const two = parseInt(this.getItem(`${i}.option.2.select`));
      const three = parseInt(this.getItem(`${i}.option.3.select`));
      const four = parseInt(this.getItem(`${i}.option.4.select`));

      let correct: number;
      switch (correctAns) {
        case 1:
          correct = one;
          break;
        case 2:
          correct = two;
          break;
        case 3:
          correct = three;
          break;
        case 4:
          correct = four;
          break;
      }

      const wrong = one + two + three + four - correct;

      return {
        questionId: q.questionid,
        wrong,
        correct,
      };
    });
  }

  getQuestion(questionNo: number): any {
    const qTitleKey = `${questionNo}.title`;
    const qOption1Key = `${questionNo}.option.1`;
    const qOption2Key = `${questionNo}.option.2`;
    const qOption3Key = `${questionNo}.option.3`;
    const qOption4Key = `${questionNo}.option.4`;
    const qAnsKey = `${questionNo}.answer`;

    const title = this.getItem(qTitleKey);
    const option1 = this.getItem(qOption1Key);
    const option2 = this.getItem(qOption2Key);
    const option3 = this.getItem(qOption3Key);
    const option4 = this.getItem(qOption4Key);
    let answer = this.getItem(qAnsKey);
    answer = +answer;

    return { title, option1, option2, option3, option4, answer };
  }

  getAllQuestion(): any[] {
    const qlist = this.quiz.questionlist.map((_, i) => {
      return this.getQuestion(i + 1);
    });

    return qlist;
  }

  getLeaderBoard(): {
    winners: any;
  } {
    // Get player meta data
    const playersScores = this.players.map(player => {
      const playerKeys = this.questions.map((_, index) => {
        return `user.${player.userid}.${index + 1}`;
      });

      const scores = playerKeys.map(key => {
        return this.getItem(key);
      });

      const avatar = this.getItem(`user.${player.userid}.avatar`);
      const username = this.getItem(`user.${player.userid}.username`);
      const name = this.getItem(`user.${player.userid}.name`);

      return {
        id: player.userid,
        scores,
        avatar,
        username,
        name,
      };
    });

    const totalScore = orderBy(
      playersScores.map(users => {
        return {
          id: users.id,
          correct: this.count([1, '1'], users.scores),
          user_score: users.scores,
          wrong: this.count([0, '0'], users.scores),
          unanswered: this.count([-1, '-1'], users.scores),
          avatar: users.avatar,
          username: users.username,
          name: users.name,
        };
      }),
      ['correct'],
      ['desc'],
    );

    // Logic to deside winners and points to give
    let winners = [];
    let won_price: number;

    if (this.quiz.reward_type === RewardType.game_win) {
      winners = totalScore.filter(
        ({ correct }) => correct === this.questions.length,
      );
      won_price = +(this.quiz.winningprice / winners.length).toFixed(2);

      const winners_with_coins = winners.map(items => ({
        ...items,
        won_price,
      }));

      return {
        winners: winners_with_coins,
      };
    } else {
      winners = totalScore
        .filter(({ correct }) => correct > 0)
        .map(items => ({
          ...items,
          won_price,
        }));

      const single_question_points = Number(
        (this.quiz.winningprice / this.quiz.questionlist.length).toFixed(2),
      );

      const divideTable = new Map<number, number>();

      times(this.quiz.questionlist.length, index => {
        let correct_count = 0;
        winners.forEach(player => {
          if (player.user_score[index] === 1) {
            correct_count += 1;
          }
        });

        divideTable.set(index, correct_count);
        correct_count = 0;
      });

      const winners_with_coins = winners.map(items => {
        const { user_score, ...rest } = items;
        let total_points = 0;

        user_score.forEach((choice: number, index: number) => {
          if (choice === 1) {
            const _correct_count = divideTable.get(index);
            total_points = floor(
              add(total_points, divide(single_question_points, _correct_count)),
              2,
            );
          }
        });

        return {
          ...rest,
          won_price: total_points,
        };
      });

      return {
        winners: winners_with_coins,
      };
    }
  }

  getLostPlayers(qno: number) {
    const pMap = [];
    this.players.forEach(player => {
      const res = times(qno, i => {
        return this.getItem(`user.${player.userid}.${i + 1}`);
      });

      if (
        res.includes('-1') ||
        res.includes('0') ||
        res.includes(-1) ||
        res.includes(0)
      ) {
        pMap.push(player.userid);
      }
    });

    return pMap;
  }

  // Powerup related
  getPowerUpInfo(userid: string) {
    return this.powerupInfo.get(userid);
  }

  // should return false if the user can't user the powerup and
  // should dec the count from the memory and from the DB
  // and return true if he can
  async usePowerUp(
    userid: string,
    productid: IProductTypes,
    qNo: number,
  ): Promise<boolean> {
    //Logger.log(`${userid} Using powerup ${productid}`);

    try {
      const powerupObj = this.powerupInfo.get(userid);

      //Logger.log(powerupObj);

      if (powerupObj) {
        const qty = powerupObj[productid];
        if (typeof qty === 'number' && qty > 0) {
          // dec the count here from the DB
          //Logger.log(`Decriminting power up from DB`);
          await this.decPowerUpFromDB(userid, productid);

          // if success remove it form the memory.
          powerupObj[productid] -= 1;
          this.powerupInfo.set(userid, powerupObj);

          let infoKey = `${userid}.${productid}`;
          if (this.powerupInfo.has(infoKey)) {
            let val = this.powerupInfoMeta.get(infoKey);
            this.powerupInfoMeta.set(infoKey, val + 1);
          } else {
            this.powerupInfoMeta.set(infoKey, 1);
          }

          if (this.powerupInfoMetaQNo.has(userid)) {
            const listOfPup = this.powerupInfoMetaQNo.get(userid);
            listOfPup.push({
              qNo,
              productid,
            });
            this.powerupInfoMetaQNo.set(userid, listOfPup);
          } else {
            this.powerupInfoMetaQNo.set(userid, [
              {
                qNo,
                productid,
              },
            ]);
          }

          return true;
        }
      }

      return false;
    } catch (error) {
      Logger.error(error.toString());
      return false;
    }
  }

  async decPowerUpFromDB(userid: string, productid: IProductTypes) {
    await this.productsModel.updateOne(
      {
        userid,
        productid,
      },
      {
        $inc: {
          count: -1,
        },
      },
    );
  }

  private count(key: any[], array: any[]) {
    let counter = 0;
    array.forEach(item => {
      if (key.includes(item)) {
        counter += 1;
      }
    });

    return counter;
  }

  async saveGameStateInDB() {
    let questionData: IQuestionsPlayedGame[] = [];
    let userData: IUsersPlayedGame[] = [];

    this.questions.forEach((data: any, idx: number) => {
      idx += 1;
      questionData.push({
        number: idx,
        title: data.title,
        option1: data.options[0].value,
        option2: data.options[1].value,
        option3: data.options[2].value,
        option4: data.options[3].value,
        correct: data.answerKey,
      });
    });

    this.players.forEach((data: any) => {
      const correctGiven = this.questions.map((_, index) => {
        return this.getItem(`user.${data.userid}.${index + 1}`);
      });

      const answerGiven = this.questions.map((_, index) => {
        return this.getItem(`user.${data.userid}.choice.${index + 1}`);
      });

      const powerUpUsed = {
        extra_life_joker:
          this.powerupInfoMeta.get(`${data.userid}.extra_life_joker`) || 0,
        fifty_fifty:
          this.powerupInfoMeta.get(`${data.userid}.fifty_fifty`) || 0,
        pass_question:
          this.powerupInfoMeta.get(`${data.userid}.pass_question`) || 0,
        two_answer: this.powerupInfoMeta.get(`${data.userid}.two_answer`) || 0,
      };

      const powerUpUsedNo = this.powerupInfoMetaQNo.get(data.userid) || [];

      userData.push({
        userid: data.userid,
        username: data.username,
        avatar: data.avatar,
        answerGiven,
        correctGiven,
        powerUpUsed,
        powerUpUsedNo,
      });
    });

    await this.playedGameModel.create({
      quizid: this.scope,
      questionData,
      userData,
      playedTime: this.quiz.starttime,
      reward_type: this.quiz.reward_type,
      entryfee: this.quiz.entryfee,
      winningprice: this.quiz.winningprice,
      roomsize: this.quiz.roomsize,
      category: this.quiz.category,
    });
  }
}
