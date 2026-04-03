import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Redis } from 'ioredis';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { QuestionService } from '../question/question.service';
import { EvaluationService } from '../evaluation/evaluation.service';

@Injectable()
export class AnswerService {
  constructor(
    private prisma: PrismaService,
    @Inject('REDIS_CLIENT') private redis: Redis,
    private questionService: QuestionService,
    private evalService: EvaluationService,
  ) {}

  async processAnswer(dto: SubmitAnswerDto) {
    const question = await this.questionService.getQuestionOfToday();

    // Verification via Redis
    const cacheKey = `answer:${dto.sessionHash}:${question.id}`;
    const alreadyAnswered = await this.redis.get(cacheKey);

    if (alreadyAnswered) {
      throw new ConflictException({ message: 'Você já respondeu a pergunta de hoje.' });
    }

    try {
      // Evaluate Answer via Gemini AI
      const reference = await this.questionService.getQuestionReference(question.id);
      const evaluation = await this.evalService.evaluateAnswer(question.question, reference, dto.answer);

      // Save to DB
      await this.prisma.answer.create({
        data: {
          question_id: question.id,
          session_hash: dto.sessionHash,
          answer_text: dto.answer,
          evaluation_status: evaluation.status,
          feedback: evaluation.feedback,
        }
      });

      // Mark as answered in Redis with TTL ~24 horas (86400s)
      await this.redis.set(cacheKey, '1', 'EX', 86400);

      return {
        status: evaluation.status,
        feedback: evaluation.feedback,
        referenceAnswer: reference,
      };
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async getTodayStatus(sessionHash: string) {
    const question = await this.questionService.getQuestionOfToday();
    const cacheKey = `answer:${sessionHash}:${question.id}`;
    const alreadyAnswered = await this.redis.get(cacheKey);

    return { answeredToday: !!alreadyAnswered };
  }
}
