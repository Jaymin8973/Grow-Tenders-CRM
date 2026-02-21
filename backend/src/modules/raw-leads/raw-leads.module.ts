import { Module } from '@nestjs/common';
import { RawLeadsService } from './raw-leads.service';
import { RawLeadsController } from './raw-leads.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RawLeadsController],
  providers: [RawLeadsService],
  exports: [RawLeadsService]
})
export class RawLeadsModule { }
