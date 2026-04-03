import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { QuestionModule } from './question/question.module';
import { AnswerModule } from './answer/answer.module';
import { EvaluationModule } from './evaluation/evaluation.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    QuestionModule,
    AnswerModule,
    EvaluationModule
  ],
})
export class AppModule {}
