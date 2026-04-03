import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Redis } from 'ioredis';

@Injectable()
export class QuestionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async getQuestionReference(id: string) {
    const q = await this.prisma.question.findUnique({ where: { id } });
    return q?.reference || '';
  }

  async getQuestionOfToday() {
    // 1. Tenta recuperar do cache
    const cached = await this.redis.get('question:today');
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      // 2. Busca a pergunta real do dia no banco
      const today = new Date();
      today.setUTCHours(0,0,0,0);

      const active = await this.prisma.question.findFirst({
        where: { active_date: { lte: today } },
        orderBy: { active_date: 'desc' }
      });

      if (!active) {
        throw new NotFoundException('Nenhum desafio foi agendado para o dia de hoje.');
      }

      const res = {
        id: active.id,
        question: active.question,
        category: active.category,
        difficulty: active.difficulty,
      };

      await this.redis.set('question:today', JSON.stringify(res), 'EX', 3600 * 24);
      return res;

    } catch (e) {
      throw new NotFoundException('Nenhum desafio ativo ou falha no sistema base.');
    }
  }
}
