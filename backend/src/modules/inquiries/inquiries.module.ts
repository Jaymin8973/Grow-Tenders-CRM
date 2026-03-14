import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InquiriesService } from './inquiries.service';
import { InquiriesController } from './inquiries.controller';
import { PublicInquiriesController } from './public-inquiries.controller';

@Module({
    imports: [PrismaModule],
    controllers: [InquiriesController, PublicInquiriesController],
    providers: [InquiriesService],
    exports: [InquiriesService],
})
export class InquiriesModule {}
