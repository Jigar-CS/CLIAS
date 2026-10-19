import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DevelopmentEmailService, NodemailerEmailService, BrevoEmailService } from './email.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'EmailService',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const brevoApiKey = configService.get<string>('BREVO_API_KEY');
        const driver = (configService.get<string>('EMAIL_SERVICE_DRIVER') || '').toLowerCase();

        // Brevo HTTPS REST API (Port 443 — guaranteed to work on cloud deployments like Render)
        if (brevoApiKey || driver === 'brevo') {
          return new BrevoEmailService(configService);
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

