import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LeadsModule } from './modules/leads/leads.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DealsModule } from './modules/deals/deals.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { TendersModule } from './modules/tenders/tenders.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { EmailModule } from './modules/email/email.module';
import { StorageModule } from './modules/storage/storage.module';
import { NotesModule } from './modules/notes/notes.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { BranchesModule } from './modules/branches/branches.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { FollowUpsModule } from './modules/follow-ups/follow-ups.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        // Rate limiting: 100 requests per minute per IP
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100,
        }]),
        BullModule.forRoot({
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD || undefined,
            },
        }),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'uploads'),
            serveRoot: '/uploads',
        }),
        PrismaModule,
        AuthModule,
        UsersModule,
        BranchesModule,
        LeadsModule,
        CustomersModule,
        DealsModule,
        ActivitiesModule,
        InvoicesModule,
        TendersModule,
        LeaderboardModule,
        ReportsModule,
        NotificationsModule,
        AuditLogsModule,
        EmailModule,
        StorageModule,
        NotesModule,
        AttachmentsModule,
        PaymentsModule,
        FollowUpsModule,
    ],
    providers: [
        // Apply rate limiting globally
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }
