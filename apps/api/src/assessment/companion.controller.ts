import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { CompanionSyncService } from './companion-sync.service';

@Controller('companion')
export class CompanionController {
  constructor(private readonly companionSync: CompanionSyncService) {}

  @Get('status')
  getStatus(@Query('sessionId') sessionId = 'clias-session-default') {
    return {
      mobileConnected: this.companionSync.isMobileConnected(sessionId),
      isSubmitted: this.companionSync.isSessionSubmitted(sessionId),
      activeQuestionId: this.companionSync.getActiveQuestion(sessionId),
    };
  }

  @Post('reset')
  resetSession(@Query('sessionId') sessionId = 'clias-session-default') {
    return this.companionSync.resetSession(sessionId);
  }

  @Get('strokes')
  getStrokes(
    @Query('sessionId') sessionId = 'clias-session-default',
    @Query('questionId') questionId = 'Q1',
  ) {
    return this.companionSync.getStrokes(sessionId, questionId);
  }

  @Post('switch-question')
  switchQuestion(
    @Query('sessionId') sessionId = 'clias-session-default',
    @Query('questionId') questionId = 'Q1',
  ) {
    return this.companionSync.switchActiveQuestion(sessionId, questionId);
  }

  @Post('clear')
  clearCanvas(
    @Query('sessionId') sessionId = 'clias-session-default',
    @Query('questionId') questionId = 'Q1',
  ) {
    return this.companionSync.clearCanvas(sessionId, questionId);
  }

  @Post('submit')
  submitExam(@Query('sessionId') sessionId = 'clias-session-default') {
    return this.companionSync.submitExamAndGenerateExitPass(sessionId);
  }

  @Get('verify-exit-pass')
  verifyExitPass(
    @Query('sessionId') sessionId = 'clias-session-default',
    @Query('pass') pass: string,
  ) {
    const valid = this.companionSync.verifyExitPass(sessionId, pass);
    return { valid };
  }
}
