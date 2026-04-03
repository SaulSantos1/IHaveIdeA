import { Controller, Post, Body, Get, Param, ConflictException } from '@nestjs/common';
import { AnswerService } from './answer.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Controller('api/answer')
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  @Post('submit')
  async submit(@Body() body: SubmitAnswerDto) {
    return this.answerService.processAnswer(body);
  }

  @Get('status/:sessionHash')
  async getStatus(@Param('sessionHash') sessionHash: string) {
    return this.answerService.getTodayStatus(sessionHash);
  }
}
