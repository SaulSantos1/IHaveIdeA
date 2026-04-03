import { Controller, Get } from '@nestjs/common';
import { QuestionService } from './question.service';

@Controller('api/question')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get('today')
  async getToday() {
    return this.questionService.getQuestionOfToday();
  }

  @Get('next-reset')
  async getNextReset() {
    const tz = process.env.QUESTION_RESET_TZ || 'America/Sao_Paulo';
    
    // Simplificada, idealmente usa date-fns-tz
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(3, 0, 0, 0); // Ex: mock UTC-3 reset

    return { resetAt: tomorrow.toISOString() };
  }
}
