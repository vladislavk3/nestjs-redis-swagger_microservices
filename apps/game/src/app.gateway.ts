import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import axios from 'axios';
import { InjectConnection } from '@nestjs/mongoose';
import { authorize } from '@ssnxd/socketio-jwt';
import { Connection } from 'mongoose';
import * as _ from 'lodash';
import { GameConfig } from './utils/game-config.util';
import { Server, Socket } from 'socket.io';
import * as redisIoAdapter from 'socket.io-redis';
import { StatusType } from 'knowin/common';

// Util expored from the status-codes lib gives use easy way to add message and status
import { $msg, supportedLangs } from 'knowin/status-codes';
import configuration from './config/configuration';

export interface IGameRecive {
  qNo: number;
  choice: number;
}

export type PowerUp = '50_50' | 'PASS' | '2_ANSWER' | 'HEART';

export interface IGameReciveWithPowerUp {
  data: IGameRecive;
  powerup_id: PowerUp;
}

export interface AuthSocket extends Socket {
  decoded_token: any;
}

export interface I2Ans {
  tryCount: 1 | 2;
  choice: number;
}

@Injectable()
@WebSocketGateway()
export class AppGateway implements OnApplicationShutdown, OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @WebSocketServer() server: Server;
  private logger = new Logger('Game Socket');

  private readonly GAME_WAIT_TIME = 30 * 1000; // in millisec
  private readonly GAME_PLAY_TIME = 14; // in sec
  private readonly GAME_IN_BETWEEN_WAIT_TIME = 18; // in sec
  private readonly HEART_USE_TIME = 8; // in sec

  //private readonly GAME_WAIT_TIME = 1000; // in millisec
  //private readonly GAME_PLAY_TIME = 5; // in sec
  //private readonly GAME_IN_BETWEEN_WAIT_TIME = 2; // in sec

  private readonly events = {
    game_data: 'GAME_DATA',
    get_game_data: 'GET_GAME_DATA',
    join_error: 'JOIN_ERROR',
    ping: 'PING',
    pong: 'PONG',

    quiz_will_start: 'GAME_WILL_START',
    quiz_will_end: 'GAME_WILL_END',

    quiz_will_end_for_single: 'GAME_WILL_END_FOR_SINGLE',
    GAME_END: 'GAME_END',

    send_next_question: 'NEXT_QUESTION',
    get_next_question: 'GET_NEXT_QUESTION',
    quiz_timer: 'GAME_TIMER',
    answer_recived: 'ANSWER_RECEIVED',
    answer_recived_in_server: 'ANSWER_RECIVED_IN_SERVER',
    error_on_answer: 'ERROR_ON_ANSWER',
    single_question_score: 'SINGLE_QUESTION_SCORE',
    get_leader_board: 'GET_LEADER_BOARD',
    question_score: 'QUESTION_SCORE',

    power_up_use: 'POWER_UP_USE',
    power_up_error: 'POWER_UP_ERROR',
    power_up_result: 'POWER_UP_RESULT',

    power_up_2_answers: 'POWER_UP_2_ANSWERS',
    power_up_2_answers_result: 'POWER_UP_2_ANSWERS_RESULT',

    get_single_question_score: 'GET_SINGLE_QUESTION_SCORE',

    total_joined_players: 'TOTAL_JOINED_PLAYERS',
    get_game_lost: 'GET_GAME_LOST',
    game_lost: 'GAME_LOST',
  };

  onModuleInit() {
    this.server.adapter(redisIoAdapter(configuration.database.redis.uri));
  }

  onApplicationShutdown() {
    this.logger.log(`Closing socket server`);
    this.server.close();
  }

  @SubscribeMessage('test')
  handleEvent(@MessageBody() data: string): string {
    console.log(`Recived ${data}`);
    return data;
  }

  async startANewRoom(gameConfig: GameConfig) {
    this.logger.log(`Starting A new game with id ${gameConfig.scope}!`);

    // Get questions
    const allQuetions = gameConfig.getAllQuestion();

    let questionFor = 0;
    let inWaitState = true;
    let joinedPlayers = 0;
    const currentPlaying = new Set<string>();
    const lostPlayers = new Set<string>();
    const timer = {
      currQ: 1,
      timeLeft: this.GAME_PLAY_TIME,
      waitTime: this.GAME_IN_BETWEEN_WAIT_TIME,
    };
    let gameTimer: any;

    // Make a new namespaced server

    const game = this.server
      .of(`/${gameConfig.scope}`)
      .on(
        'connection',
        authorize({
          secret: configuration.jwt.token,
          timeout: 30000,
        }),
      )
      .on('authenticated', (socket: AuthSocket) => {
        const { userid } = socket.decoded_token;
        // set language
        let lang = supportedLangs.en;
        if (socket.handshake.query.lang) {
          lang = socket.handshake.query.lang;
        }

        if (lostPlayers.has(userid)) {
          socket.emit(this.events.join_error, {
            events: this.events.join_error,
            message: $msg('G_01', lang),
          });
        }

        // Check if allowed in the game play
        if (gameConfig.players.findIndex(itm => itm.userid === userid) === -1) {
          socket.emit(this.events.join_error, {
            events: this.events.join_error,
            message: $msg('G_02', lang),
          });
          socket.disconnect();
          return;
        }

        // Check if alredy in a game session
        if (currentPlaying.has(userid)) {
          socket.emit(this.events.join_error, {
            events: this.events.join_error,
            message: $msg('G_03', lang),
          });
          socket.disconnect();
          return;
        }

        currentPlaying.add(userid);

        joinedPlayers += 1;

        socket.on(this.events.ping, () => {
          socket.emit(this.events.pong);
        });

        game.emit(this.events.total_joined_players, {
          events: this.events.total_joined_players,
          playing: joinedPlayers,
        });

        socket.emit(this.events.game_data, {
          events: this.events.game_data,
          total_questions: allQuetions.length,
          questionFor,
          timer,
          powerups: gameConfig.getPowerUpInfo(userid),
        });

        socket.on(this.events.get_game_data, () => {
          socket.emit(this.events.game_data, {
            events: this.events.game_data,
            total_questions: allQuetions.length,
            questionFor,
            timer,
            powerups: gameConfig.getPowerUpInfo(userid),
          });
        });

        socket.once('disconnect', () => {
          joinedPlayers -= 1;
          currentPlaying.delete(userid);
          this.logger.log(`Socket disconnect user with id ${userid}`);

          game.emit(this.events.total_joined_players, {
            events: this.events.total_joined_players,
            playing: joinedPlayers,
          });
        });

        this.logger.log(`Socket connected user with id ${userid}`);

        socket.on(
          this.events.power_up_use,
          async (dataWithPowerUp: IGameReciveWithPowerUp) => {
            /*
             * Power ups have the ability to interupt the game seq for his answers
             * They are a paid feature of the knoWin and can be in any number so the implementations
             * Should remain flexable and grow on adding new powerups.
             *
             * @Power Ups:
             *
             * 1. 50/50 :
             *  - User can ask us to remove two incorrect options
             *  - Can be played in any question
             *
             * 2. Pass :
             *  - User can pass a question he don't know and can only
             *  - Can not be used in last question
             *
             * 3. 2 Answers :
             *  - User can select 2 answers for the given quiz
             *  - Can be played in any question
             *
             *  4. Heart :
             *    - When answerd a question wrong if a user used this can still get the point and continue the game
             *    - Can not be used in last question
             *
             * NOTE: Check here that user is capable of using the power up.
             */

            const { powerup_id, data } = dataWithPowerUp;
            const { qNo } = data;

            // check if the user can use the power up then deduct the price
            const productid = {
              '50_50': 'fifty_fifty',
              PASS: 'pass_question',
              '2_ANSWER': 'two_answer',
              HEART: 'extra_life_joker',
            };

            if (questionFor === allQuetions.length) {
              socket.emit(this.events.power_up_error, {
                events: this.events.power_up_error,
                error: $msg('G_07', lang),
              });
              return;
            }

            const canUse = await gameConfig.usePowerUp(
              userid,
              // @ts-ignore
              productid[powerup_id],
              questionFor,
            );

            if (!canUse) {
              socket.emit(this.events.error_on_answer, {
                events: this.events.error_on_answer,
                error: $msg('G_04', lang),
              });
              return;
            }

            this.logger.log(
              `${userid} is using power up ${powerup_id} for qNo: ${qNo}`,
            );

            if (qNo !== questionFor) {
              socket.emit(this.events.power_up_result, {
                events: this.events.error_on_answer,
                error: $msg('G_05', lang),
              });

              return;
            }

            let targetQ: any;

            switch (powerup_id) {
              case '50_50': // Done
                //id => fifty_fifty,
                this.logger.log(`Using power up 50/50`);
                // Find two incorrect options and then tell client to remove them.
                // Steps: 1
                // Find the target question.
                // Find two incorrect options
                // Send them with the request
                targetQ = allQuetions[questionFor - 1];
                const options = [1, 2, 3, 4].filter(
                  item => item !== +targetQ.answer,
                );
                this.logger.log(`was ${targetQ.answer} now it's ${options}`);
                const toRemove = _.sampleSize(options, 2);
                socket.emit(this.events.power_up_result, {
                  events: this.events.power_up_result,
                  questionFor,
                  data: {
                    powerup_id,
                    result: {
                      toRemove,
                    },
                  },
                  message: $msg('G_06', lang),
                });
                break;
              case 'PASS': // DONE
                //pass_question
                // Find two incorrect options and then tell client to remove them.
                // Steps:
                // Find the target question.
                // Mark it correct in DB
                // Send ok in response
                //

                this.logger.log(`Using power up Pass`);
                gameConfig.updateScore(userid, questionFor, 1);

                socket.emit(this.events.power_up_result, {
                  events: this.events.error_on_answer,
                  data: {
                    powerup_id,
                    done: true,
                  },
                  message: $msg('G_08', lang),
                });
                break;
              case '2_ANSWER':
                //two_answer

                // Find two incorrect options and then tell client to remove them.
                // Steps:
                // Find the target question.
                // Send ok and prepare for the two question.
                // Ask for 1st options
                // Ask for 2st options
                // Send ok or false request in response
                targetQ = allQuetions[questionFor - 1];

                this.logger.log(`${questionFor} is the target question!`);
                const currVal = await gameConfig.getScore(userid, questionFor);

                this.logger.log(`${currVal} is the currVal of the question!`);

                if (+currVal !== -1) {
                  socket.emit(this.events.power_up_error, {
                    events: this.events.power_up_error,
                    error: $msg('G_09', lang),
                  });

                  return;
                }

                let attempt = 0;
                socket.on(
                  this.events.power_up_2_answers,
                  async (twoAnsData: I2Ans) => {
                    const { tryCount, choice } = twoAnsData;
                    attempt += 1;

                    this.logger.log(
                      `User answered for the 2 answers TryCount: ${tryCount} choice: ${choice}`,
                    );

                    if (tryCount !== 1 && tryCount !== 2) {
                      socket.emit(this.events.power_up_error, {
                        events: this.events.power_up_error,
                        error: $msg('G_10', lang),
                      });
                      return;
                    }

                    if (attempt > 2) {
                      socket.emit(this.events.power_up_error, {
                        events: this.events.power_up_error,
                        error: $msg('G_11', lang),
                      });
                      return;
                    }

                    const isCorrect =
                      allQuetions[questionFor - 1].answer === +choice;

                    gameConfig.setAnswerPer(choice, questionFor);

                    switch (tryCount) {
                      case 1:
                        if (isCorrect) {
                          gameConfig.updateScore(userid, questionFor, 1);

                          socket.emit(this.events.power_up_2_answers_result, {
                            events: this.events.power_up_2_answers_result,
                            data: {
                              powerup_id,
                              isCorrect: true,
                            },
                            message: $msg('G_12', lang),
                          });
                        } else {
                          socket.emit(this.events.power_up_2_answers_result, {
                            events: this.events.power_up_2_answers_result,
                            data: {
                              powerup_id,
                              isCorrect: false,
                            },
                            message: $msg('G_13', lang),
                          });
                        }
                        break;
                      case 2:
                        if (isCorrect) {
                          gameConfig.updateScore(userid, questionFor, 1);
                          socket.emit(this.events.power_up_2_answers_result, {
                            events: this.events.power_up_2_answers_result,
                            data: {
                              powerup_id,
                              isCorrect: true,
                            },
                            message: $msg('G_14', lang),
                          });
                        } else {
                          socket.emit(this.events.power_up_2_answers_result, {
                            events: this.events.power_up_2_answers_result,
                            data: {
                              powerup_id,
                              isCorrect: false,
                            },
                            message: $msg('G_15', lang),
                          });
                        }
                        break;
                    }

                    const score = gameConfig.getAnswerPer(questionFor);
                    game.emit(this.events.question_score, {
                      events: this.events.question_score,
                      qNo: questionFor,
                      score,
                    });
                  },
                );

                socket.emit(this.events.power_up_result, {
                  events: this.events.power_up_result,
                  data: {
                    powerup_id,
                    done: true,
                  },
                  message: $msg('G_17', lang),
                });

                setTimeout(() => {
                  socket.removeAllListeners(this.events.power_up_2_answers);
                  this.logger.log(`Time completed to answer`);
                }, timer.timeLeft * 1000);

                this.logger.log(
                  `Successfully set up the 2 answer the timer is ${timer.timeLeft *
                    1000}`,
                );
                break;
              case 'HEART': // Done
                //extra_life_joker
                // Find two incorrect options and then tell client to remove them.
                // Steps:
                // Find the target question.
                // Make sure it's not last one
                // Mark it correct in DB
                // Send ok in response
                gameConfig.updateScore(userid, questionFor, 1);
                lostPlayers.delete(userid);
                socket.emit(this.events.power_up_result, {
                  events: this.events.power_up_result,
                  data: {
                    powerup_id,
                    done: true,
                  },
                  message: $msg('G_19', lang),
                });

                break;
              default:
                socket.emit(this.events.power_up_error, {
                  events: this.events.error_on_answer,
                  error: $msg('G_20', lang),
                });
            }

            const score = gameConfig.getAnswerPer(questionFor);
            game.emit(this.events.question_score, {
              events: this.events.question_score,
              qNo: questionFor,
              score,
            });
          },
        );

        socket.on(this.events.answer_recived, async (data: IGameRecive) => {
          socket.emit(this.events.answer_recived_in_server, {
            events: this.events.answer_recived_in_server,
          });

          if (inWaitState) {
            socket.emit(this.events.error_on_answer, {
              events: this.events.error_on_answer,
              error: $msg('G_21', lang),
            });
            return;
          }
          if (lostPlayers.has(userid)) {
            socket.emit(this.events.error_on_answer, {
              events: this.events.error_on_answer,
              error: $msg('G_22', lang),
            });
            return;
          }

          if (data.qNo !== questionFor) {
            socket.emit(this.events.error_on_answer, {
              events: this.events.error_on_answer,
              error: $msg('G_23', lang),
            });
            return;
          } else {
            const isCorrect =
              allQuetions[questionFor - 1].answer === +data.choice;

            // save the choice
            gameConfig.saveChoice(userid, questionFor, data.choice);

            const currVal = gameConfig.getScore(userid, questionFor);

            this.logger.log(
              `Current value is ${currVal} and isCorrect is ${isCorrect}`,
            );

            if (+currVal === -1) {
              if (isCorrect) {
                gameConfig.updateScore(userid, questionFor, 1);
              } else {
                gameConfig.updateScore(userid, questionFor, 0);

                //lostPlayers.add(userid);

                // End socket here
                socket.emit(this.events.quiz_will_end_for_single, {
                  events: this.events.quiz_will_end_for_single,
                  message: $msg('G_24', lang),
                });
              }

              gameConfig.setAnswerPer(data.choice, questionFor);
            } else {
              socket.emit(this.events.error_on_answer, {
                events: this.events.error_on_answer,
                error: $msg('G_25', lang),
              });
            }

            const score = gameConfig.getAnswerPer(questionFor);
            const correctAns = gameConfig.getAnswerScore(questionFor);

            socket.emit(this.events.single_question_score, {
              events: this.events.single_question_score,
              isCorrect,
              qNo: questionFor,
            });

            game.emit(this.events.question_score, {
              events: this.events.question_score,
              qNo: questionFor,
              score,
              correctAns,
            });
          }
        });

        socket.on(this.events.get_game_lost, () => {
          socket.emit(this.events.game_lost, {
            events: this.events.game_lost,
            gameLost: lostPlayers.has(userid),
          });
        });

        socket.on(this.events.get_next_question, () => {
          socket.emit(this.events.send_next_question, {
            events: this.events.send_next_question,
            qNo: questionFor,
            questionData: _.pick(
              allQuetions[questionFor - 1],
              'title',
              'option1',
              'option2',
              'option3',
              'option4',
              'answer',
            ),
          });
        });
      });

    let timePast = 0;

    this.logger.log(`Wait time start for quiz id ${gameConfig.scope}`);
    const gameStartNotifyTimer = setInterval(() => {
      timePast += 1000;
      game.emit(this.events.quiz_will_start, {
        event: this.events.quiz_will_start,
        timeLeft: this.GAME_WAIT_TIME - timePast,
      });
    }, 1000);

    setTimeout(() => {
      this.logger.log(`Wait time over for quiz id ${gameConfig.scope}`);
      clearInterval(gameStartNotifyTimer);
      gameTimer = setInterval(async () => {
        if (timer.currQ > allQuetions.length) {
          clearInterval(gameTimer);

          // Clear namespace
          game.emit(this.events.quiz_will_end, {
            event: this.events.quiz_will_end,
          });

          const { winners } = gameConfig.getLeaderBoard();

          game.emit(this.events.get_leader_board, {
            event: this.events.get_leader_board,
            leaderboard: {
              winners,
            },
          });

          // Destrying the namespace
          const connectedSock = Object.keys(game.connected);
          connectedSock.forEach(sId => {
            game.connected[sId].disconnect();
          });
          game.removeAllListeners();
          delete this.server.nsps[`/${gameConfig.scope}`];

          // now let game end operate on the game state
          this.onGameEnd(gameConfig, winners);
          clearInterval(gameTimer);
        }

        if (
          questionFor !== timer.currQ &&
          timer.waitTime === this.GAME_IN_BETWEEN_WAIT_TIME
        ) {
          questionFor = timer.currQ;

          this.logger.log(`Sending question ${questionFor}`);
          game.emit(this.events.send_next_question, {
            events: this.events.send_next_question,
            qNo: questionFor,
            questionData: _.pick(
              allQuetions[questionFor - 1],
              'title',
              'option1',
              'option2',
              'option3',
              'option4',
              'answer',
            ),
          });

          inWaitState = false;
        } else {
          game.emit(this.events.quiz_timer, {
            events: this.events.quiz_timer,
            timer,
          });

          if (timer.timeLeft === 0) {
            timer.waitTime -= 1;
            inWaitState = true;
            // Update the lost players

            if (timer.waitTime === 1) {
              const lostPlayersIds = gameConfig.getLostPlayers(timer.currQ);

              lostPlayersIds.forEach(id => {
                lostPlayers.add(id);
              });
            }
          } else {
            timer.timeLeft -= 1;
          }

          if (timer.timeLeft === 0 && timer.waitTime === 0) {
            timer.timeLeft = this.GAME_PLAY_TIME;
            timer.waitTime = this.GAME_IN_BETWEEN_WAIT_TIME;
            timer.currQ += 1;
          }
        }
      }, 1000);
    }, this.GAME_WAIT_TIME);
  }

  async onGameEnd(gameConfig: GameConfig, winners: any) {
    this.logger.log(`Game with id ${gameConfig.scope} has ended!`);
    gameConfig.saveGameStateInDB();

    const quizDb = this.connection.db.collection('quizzes');

    await quizDb.updateOne(
      {
        quizid: gameConfig.scope,
      },
      {
        $set: {
          status: StatusType.finised,
        },
      },
    );

    const quizid = gameConfig.scope;
    const qstats = gameConfig.aggregateAns();
    const ids = winners.map(({ id, won_price }) => ({ id, won_price }));

    if (ids.length > 0) {
      try {
        const res = await axios({
          method: 'post',
          url: `${configuration.services.main}/leaderboard`,
          data: {
            quizid,
            winners: ids,
            qstats,
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: configuration.secret.API_ACCESS_TOKEN_MAIN,
          },
        });
        this.logger.log(res.data);
        this.logger.log(res.status);
      } catch (e) {
        /* handle error */
        this.logger.log(e.toString());
        this.logger.log(e.response.data);
      }
    }
  }
}
