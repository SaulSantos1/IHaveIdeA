import { Module } from '@nestjs/common';
import { AnswerController } from './answer.controller';
import { AnswerService } from './answer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QuestionModule } from '../question/question.module';
import { EvaluationModule } from '../evaluation/evaluation.module';

@Module({
  imports: [PrismaModule, QuestionModule, EvaluationModule],
  controllers: [AnswerController],
  providers: [AnswerService],
})
export class AnswerModule {}
