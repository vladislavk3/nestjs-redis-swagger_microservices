import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionSchema } from 'knowin/common';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Question',
        schema: QuestionSchema,
      },
    ]),
  ],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [MongooseModule],
})
export class QuestionModule {}
