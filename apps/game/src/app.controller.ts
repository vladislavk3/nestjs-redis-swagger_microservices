import { Controller, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { IQuiz } from 'knowin/common';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Post('/start_new_game')
  startNewGame(@Body() gameObj: IQuiz) {
    this.appService.startGame(gameObj);
  }
}
