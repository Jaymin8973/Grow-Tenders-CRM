import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { InquiriesService } from './inquiries.service';

@ApiTags('Public Inquiries')
@Controller('public/inquiries')
export class PublicInquiriesController {
    constructor(private readonly inquiriesService: InquiriesService) {}

    @Post()
    @ApiOperation({ summary: 'Website: Create inquiry from contact form' })
    @ApiResponse({ status: 201, description: 'Inquiry created' })
    async create(@Body() dto: CreateInquiryDto) {
        await this.inquiriesService.create(dto);
        return { message: 'Inquiry submitted successfully' };
    }
}
