import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { TransferRequestsController } from './transfer-requests.controller';
import { TransferRequestsService } from './transfer-requests.service';

import { CustomersModule } from '../customers/customers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
    imports: [CustomersModule, NotificationsModule, ActivitiesModule],
    controllers: [LeadsController, TransferRequestsController],
    providers: [LeadsService, TransferRequestsService],
    exports: [LeadsService],
})
export class LeadsModule { }
