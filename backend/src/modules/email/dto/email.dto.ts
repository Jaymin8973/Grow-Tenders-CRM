import { IsEmail, IsOptional, IsString, IsMongoId, IsArray } from 'class-validator';
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
