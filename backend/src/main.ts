import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const logger = new Logger('Bootstrap');

    // Security headers with Helmet
    app.use(helmet());

    // Global exception filter
    app.useGlobalFilters(new HttpExceptionFilter());

    // Enable CORS
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    });

    // Global prefix
    app.setGlobalPrefix('api');

    // Validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Swagger setup (disabled in production)
    if (process.env.NODE_ENV !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('Sales CRM API')
            .setDescription('Sales CRM Backend API Documentation')
            .setVersion('1.0')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    name: 'JWT',
                    description: 'Enter JWT token',
                    in: 'header',
                },
                'JWT-auth',
            )
            .addTag('Auth', 'Authentication endpoints')
            .addTag('Users', 'User management endpoints')
            .addTag('Leads', 'Lead management endpoints')
            .addTag('Customers', 'Customer management endpoints')

            .addTag('Activities', 'Activity management endpoints')
            .addTag('Invoices', 'Invoice management endpoints')
            .addTag('Tenders', 'Tender management endpoints')
            .addTag('Leaderboard', 'Leaderboard endpoints')
            .addTag('Reports', 'Reports endpoints')
            .addTag('Notifications', 'Notification endpoints')
            .addTag('Audit Logs', 'Audit log endpoints')
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);
        logger.log('📚 Swagger docs available at: /api/docs');
    }

    const port = process.env.PORT || 3001;
    await app.listen(port);
    logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
    logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();

