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
    const now = new Date();
    // Ajusta para o fuso de Brasília (UTC-3) para determinar qual é o "dia" atual do jogo
    const brTime = new Date(now.getTime() - 3 * 3600 * 1000);
    const dateStr = brTime.toISOString().split('T')[0];
    const cacheKey = `question:today:${dateStr}`;

    // 1. Tenta recuperar do cache específico do dia
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      // 2. Busca a pergunta real do dia no banco (usando a data normalizada do BR)
      const searchDate = new Date(dateStr);
      searchDate.setUTCHours(0,0,0,0);

      const active = await this.prisma.question.findFirst({
        where: { active_date: { lte: searchDate } },
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

      // 3. Calcula expiração para o próximo reset (03:00 UTC do próximo dia real)
      const nextReset = new Date(now);
      nextReset.setUTCHours(3, 0, 0, 0);
      if (now >= nextReset) {
        nextReset.setUTCDate(nextReset.getUTCDate() + 1);
      }
      const secondsUntilReset = Math.max(Math.floor((nextReset.getTime() - now.getTime()) / 1000), 60);

      await this.redis.set(cacheKey, JSON.stringify(res), 'EX', secondsUntilReset);
      return res;

    } catch (e) {
      throw new NotFoundException('Nenhum desafio ativo ou falha no sistema base.');
    }
  }
}
