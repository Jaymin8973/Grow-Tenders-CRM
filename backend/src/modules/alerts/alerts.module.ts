import { Module, forwardRef } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { TenderAlertService } from './services/tender-alert.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [PrismaModule, EmailModule],
    controllers: [AlertsController],
    providers: [AlertsService, TenderAlertService],
    exports: [AlertsService, TenderAlertService],
})
export class AlertsModule {}
