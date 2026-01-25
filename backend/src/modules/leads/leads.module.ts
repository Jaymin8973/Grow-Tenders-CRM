import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { TransferRequestsController } from './transfer-requests.controller';
import { TransferRequestsService } from './transfer-requests.service';

@Module({
    controllers: [LeadsController, TransferRequestsController],
    providers: [LeadsService, TransferRequestsService],
    exports: [LeadsService],
})
export class LeadsModule { }
