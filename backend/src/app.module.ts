import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LeadsModule } from './modules/leads/leads.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { TendersModule } from './modules/tenders/tenders.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { EmailModule } from './modules/email/email.module';
import { StorageModule } from './modules/storage/storage.module';
import { NotesModule } from './modules/notes/notes.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { BranchesModule } from './modules/branches/branches.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { FollowUpsModule } from './modules/follow-ups/follow-ups.module';
import { DailyReportsModule } from './modules/daily-reports/daily-reports.module';
import { TargetsModule } from './modules/targets/targets.module';
import { PaymentRequestsModule } from './modules/payment-requests/payment-requests.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuditInterceptor } from './modules/audit/audit.interceptor';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { TransferRequestsModule } from './modules/transfer-requests/transfer-requests.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { PermissionsModule } from './modules/permissions/permissions.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
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
        ActivitiesModule,
        InvoicesModule,
        TendersModule,
        LeaderboardModule,
        NotificationsModule,
        AuditLogsModule,
        EmailModule,
        StorageModule,
        NotesModule,
        AttachmentsModule,
        PaymentsModule,
        FollowUpsModule,
        DailyReportsModule,
        TargetsModule,
        PaymentRequestsModule,
        AnalyticsModule,
        TransferRequestsModule,
        SchedulerModule,
        PermissionsModule,
    ],
    providers: [
        // Apply rate limiting globally
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: AuditInterceptor,
        },
    ],
})
export class AppModule { }
