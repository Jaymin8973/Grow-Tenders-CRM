import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators';
import { User } from '@prisma/client';

@ApiTags('Notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
    constructor(private notesService: NotesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new note' })
    create(@Body() dto: CreateNoteDto, @CurrentUser() user: User) {
        return this.notesService.create(dto, user.id);
    }

    @Get('lead/:leadId')
    @ApiOperation({ summary: 'Get notes by lead' })
    findByLead(@Param('leadId') leadId: string) {
        return this.notesService.findByLead(leadId);
    }

    @Get('customer/:customerId')
    @ApiOperation({ summary: 'Get notes by customer' })
    findByCustomer(@Param('customerId') customerId: string) {
        return this.notesService.findByCustomer(customerId);
    }



    @Put(':id')
    @ApiOperation({ summary: 'Update a note' })
    update(
        @Param('id') id: string,
        @Body() dto: UpdateNoteDto,
        @CurrentUser() user: User,
    ) {
        return this.notesService.update(id, dto, user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a note' })
    remove(@Param('id') id: string, @CurrentUser() user: User) {
        return this.notesService.remove(id, user.id, user.role);
    }
}
