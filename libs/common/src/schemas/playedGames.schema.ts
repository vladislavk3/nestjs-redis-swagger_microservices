import * as mongoose from 'mongoose';

export const UsersPlayedGameSchema = new mongoose.Schema({});

export const PlayedGameSchema = new mongoose.Schema({
  quizid: {
    type: String,
    required: true,
  },
  playedTime: {
    type: Date,
    required: true,
  },
  roomsize: {
    type: Number,
  },
  category: {
    type: String,
  },
  winningprice: {
    type: Number,
  },
  reward_type: {
    type: String,
    enum: ['question_win', 'game_win'],
  },
  entryfee: {
    type: Number,
  },
  questionData: [
    {
      number: Number,
      title: String,
      option1: String,
      option2: String,
      option3: String,
      option4: String,
      correct: Number,
    },
  ],
  userData: [
    {
      userid: {
        type: String,
        required: true,
      },
      username: {
        type: String,
      },
      avatar: {
        type: String,
      },
      answerGiven: {
        type: Array,
      },
      correctGiven: {
        type: Array,
      },
      powerUpUsedNo: {
        type: Array,
      },
      powerUpUsed: {
        extra_life_joker: Number,
        fifty_fifty: Number,
        pass_question: Number,
        two_answer: Number,
      },
    },
  ],
});
