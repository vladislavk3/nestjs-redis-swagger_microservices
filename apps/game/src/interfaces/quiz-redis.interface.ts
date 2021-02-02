export interface IQuizRedis {
  readonly quizId: string;
  readonly startTime: Date;
  readonly questionList: string[];
  readonly roomSize: number;
  readonly joinedUsers: string[];
  readonly quizSize: number;
  readonly winningPrice: number;
  readonly entryFee: number;
}
