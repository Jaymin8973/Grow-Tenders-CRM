import { IsEmail, IsOptional, IsString, IsMongoId, IsArray, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailDto {
    @ApiProperty({ description: 'Recipient email address' })
    @IsEmail()
    to: string;

    @ApiPropertyOptional({ description: 'CC email addresses' })
    @IsArray()
    @IsEmail({}, { each: true })
    @IsOptional()
    cc?: string[];

    @ApiPropertyOptional({ description: 'BCC email addresses' })
    @IsArray()
    @IsEmail({}, { each: true })
    @IsOptional()
    bcc?: string[];

    @ApiProperty({ description: 'Email subject' })
    @IsString()
    subject: string;

    @ApiProperty({ description: 'Email body (HTML allowed)' })
    @IsString()
    body: string;

    @ApiPropertyOptional({ description: 'Lead ID for logging' })
    @IsMongoId()
    @IsOptional()
    leadId?: string;

    @ApiPropertyOptional({ description: 'Customer ID for logging' })
    @IsMongoId()
    @IsOptional()
    customerId?: string;

    @ApiPropertyOptional({ description: 'Invoice ID for logging' })
    @IsMongoId()
    @IsOptional()
    invoiceId?: string;

    @ApiPropertyOptional({ description: 'Tender ID for logging' })
    @IsMongoId()
    @IsOptional()
    tenderId?: string;
}

export class CreateEmailTemplateDto {
    @ApiProperty({ description: 'Template name' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Email subject' })
    @IsString()
    subject: string;

    @ApiProperty({ description: 'Email body template' })
    @IsString()
    body: string;

    @ApiProperty({ description: 'Template type (invoice, tender, notification)' })
    @IsString()
    type: string;

    @ApiPropertyOptional({ description: 'Available variables' })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    variables?: string[];
}

export class UpdateEmailTemplateDto {
    @ApiPropertyOptional({ description: 'Template name' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ description: 'Email subject' })
    @IsString()
    @IsOptional()
    subject?: string;

    @ApiPropertyOptional({ description: 'Email body template' })
    @IsString()
    @IsOptional()
    body?: string;

    @ApiPropertyOptional({ description: 'Template type' })
    @IsString()
    @IsOptional()
    type?: string;

    @ApiPropertyOptional({ description: 'Available variables' })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    variables?: string[];
}

export class CreateSmtpConfigDto {
    @ApiProperty({ description: 'Friendly name for this SMTP config' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'SMTP host (e.g. smtp.gmail.com)' })
    @IsString()
    host: string;

    @ApiProperty({ description: 'SMTP port (e.g. 587)' })
    @IsInt()
    @Min(1)
    port: number;

    @ApiPropertyOptional({ description: 'Use TLS/SSL (secure=true usually means port 465)' })
    @IsBoolean()
    @IsOptional()
    secure?: boolean;

    @ApiProperty({ description: 'SMTP username' })
    @IsString()
    username: string;

    @ApiProperty({ description: 'SMTP password or app password' })
    @IsString()
    password: string;

    @ApiProperty({ description: 'From email address used for sending' })
    @IsEmail()
    fromEmail: string;

    @ApiPropertyOptional({ description: 'Purpose of this SMTP config: OTP or AUTO' })
    @IsString()
    @IsOptional()
    purpose?: string;

    @ApiPropertyOptional({ description: 'States served by this SMTP config (for AUTO routing). Values should match tender/customer state.' })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    states?: string[];

    @ApiPropertyOptional({ description: 'Whether config is enabled (can be disabled without deleting)' })
    @IsBoolean()
    @IsOptional()
    isEnabled?: boolean;

    @ApiPropertyOptional({ description: 'Whether to activate this config immediately' })
    @IsBoolean()
    @IsOptional()
    activate?: boolean;
}

export class UpdateSmtpConfigDto {
    @ApiPropertyOptional({ description: 'Friendly name for this SMTP config' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ description: 'SMTP host' })
    @IsString()
    @IsOptional()
    host?: string;

    @ApiPropertyOptional({ description: 'SMTP port' })
    @IsInt()
    @Min(1)
    @IsOptional()
    port?: number;

    @ApiPropertyOptional({ description: 'Use TLS/SSL' })
    @IsBoolean()
    @IsOptional()
    secure?: boolean;

    @ApiPropertyOptional({ description: 'SMTP username' })
    @IsString()
    @IsOptional()
    username?: string;

    @ApiPropertyOptional({ description: 'SMTP password (if you want to update it)' })
    @IsString()
    @IsOptional()
    password?: string;

    @ApiPropertyOptional({ description: 'From email address used for sending' })
    @IsEmail()
    @IsOptional()
    fromEmail?: string;

    @ApiPropertyOptional({ description: 'Purpose of this SMTP config: OTP or AUTO' })
    @IsString()
    @IsOptional()
    purpose?: string;

    @ApiPropertyOptional({ description: 'States served by this SMTP config (for AUTO routing)' })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    states?: string[];

    @ApiPropertyOptional({ description: 'Whether config is enabled' })
    @IsBoolean()
    @IsOptional()
    isEnabled?: boolean;
}

export class TestSmtpConfigDto {
    @ApiPropertyOptional({ description: 'Send a verification email to this address instead of only SMTP verify()' })
    @IsEmail()
    @IsOptional()
    to?: string;
}
