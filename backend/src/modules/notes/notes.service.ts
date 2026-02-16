import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';

@Injectable()
export class NotesService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateNoteDto, userId: string) {
        return this.prisma.note.create({
            data: {
                content: dto.content,
                leadId: dto.leadId,
                customerId: dto.customerId,
                createdById: userId,
            },
        });
    }

    async findByLead(leadId: string) {
        return this.prisma.note.findMany({
            where: { leadId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByCustomer(customerId: string) {
        return this.prisma.note.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByDeal(leadId: string) {
        return this.prisma.note.findMany({
            where: { leadId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async update(id: string, dto: UpdateNoteDto, userId: string) {
        const note = await this.prisma.note.findUnique({
            where: { id },
        });

        if (!note) {
            throw new NotFoundException('Note not found');
        }

        if (note.createdById !== userId) {
            throw new ForbiddenException('You can only edit your own notes');
        }

        return this.prisma.note.update({
            where: { id },
            data: { content: dto.content },
        });
    }

    async remove(id: string, userId: string, userRole: string) {
        const note = await this.prisma.note.findUnique({
            where: { id },
        });

        if (!note) {
            throw new NotFoundException('Note not found');
        }

        // Only the creator or admin can delete
        if (note.createdById !== userId && userRole !== 'SUPER_ADMIN') {
            throw new ForbiddenException('You can only delete your own notes');
        }

        return this.prisma.note.delete({
            where: { id },
        });
    }
}
