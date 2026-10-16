import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DevelopmentEmailService, NodemailerEmailService, ResendEmailService } from './email.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'EmailService',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const resendApiKey = configService.get<string>('RESEND_API_KEY');
        const driver = (configService.get<string>('EMAIL_SERVICE_DRIVER') || '').toLowerCase();

        if (resendApiKey || driver === 'resend') {
          return new ResendEmailService(configService);
        }
        if (driver === 'smtp' || driver === 'production') {
          return new NodemailerEmailService(configService);
        }
        return new DevelopmentEmailService();
      },
    },
  ],
  exports: ['EmailService'],
})
export class EmailModule {}

