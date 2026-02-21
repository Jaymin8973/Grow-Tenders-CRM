import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRawLeadDto } from './dto/create-raw-lead.dto';
import { UpdateRawLeadDto } from './dto/update-raw-lead.dto';
import { BulkUploadRawLeadsDto } from './dto/bulk-upload-raw-leads.dto';
import { AssignRawLeadsDto } from './dto/assign-raw-leads.dto';
import { RawLeadStatus, Prisma, User } from '@prisma/client';

@Injectable()
export class RawLeadsService {
    constructor(private prisma: PrismaService) { }

    async create(createRawLeadDto: CreateRawLeadDto) {
        try {
            return await this.prisma.rawLead.create({
                data: createRawLeadDto,
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new BadRequestException(`Phone number ${createRawLeadDto.phone} already exists.`);
            }
            throw error;
        }
    }

    async bulkUpload(data: BulkUploadRawLeadsDto) {
        // Filter duplicates locally first if any
        const uniquePhones = [...new Set(data.leads.map(l => l.phone))];

        // Find existing to avoid crash
        const existing = await this.prisma.rawLead.findMany({
            where: { phone: { in: uniquePhones } },
            select: { phone: true }
        });

        const existingPhones = new Set(existing.map(e => e.phone));

        // Filter to only new leads
        const newLeads = data.leads.filter(l => !existingPhones.has(l.phone));

        if (newLeads.length === 0) {
            return { inserted: 0, duplicatesFound: data.leads.length, message: "All provided numbers already exist." };
        }

        const payload = newLeads.map(l => ({
            phone: l.phone,
            notes: l.notes,
            source: data.source,
            batchName: data.batchName,
            assigneeId: data.assigneeId,
            status: RawLeadStatus.UNTOUCHED
        }));

        const result = await this.prisma.rawLead.createMany({
            data: payload,
            // skipDuplicates: true // Supported on some databases but we handled it manually to be safe
        });

        return {
            inserted: result.count,
            duplicatesSkipped: data.leads.length - newLeads.length
        };
    }

    async assignBulk(data: AssignRawLeadsDto) {
        const result = await this.prisma.rawLead.updateMany({
            where: {
                id: { in: data.rawLeadIds }
            },
            data: {
                assigneeId: data.assigneeId
            }
        });
        return { updatedCount: result.count };
    }

    async findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.RawLeadWhereInput;
        orderBy?: Prisma.RawLeadOrderByWithRelationInput;
    }) {
        const { skip, take, where, orderBy } = params;

        const [items, total] = await Promise.all([
            this.prisma.rawLead.findMany({
                skip,
                take,
                where,
                orderBy,
                include: {
                    assignee: {
                        select: { id: true, firstName: true, lastName: true }
                    }
                }
            }),
            this.prisma.rawLead.count({ where }),
        ]);

        return {
            items,
            total,
            hasMore: skip !== undefined && take !== undefined ? skip + take < total : false
        };
    }

    async findOne(id: string) {
        const lead = await this.prisma.rawLead.findUnique({
            where: { id },
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true }
                }
            }
        });

        if (!lead) throw new NotFoundException('Raw lead not found');
        return lead;
    }

    async update(id: string, updateDto: UpdateRawLeadDto, user?: User) {
        try {
            const rawLead = await this.prisma.rawLead.findUnique({ where: { id } });
            if (!rawLead) throw new NotFoundException('Raw lead not found');

            // If changing to NOT_INTERESTED and it is not already converted
            if (updateDto.status === RawLeadStatus.NOT_INTERESTED && !rawLead.convertedLeadId) {
                let creatorId = user?.id || rawLead.assigneeId;
                if (!creatorId) {
                    const admin = await this.prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
                    creatorId = admin?.id || '';
                }

                // 1. Create a cold lead
                const newLead = await this.prisma.lead.create({
                    data: {
                        title: 'N/A',
                        firstName: 'Unknown',
                        lastName: 'Lead (From Telecalling)',
                        email: `${rawLead.phone}@unknown.com`,
                        mobile: rawLead.phone,
                        status: 'COLD_LEAD',
                        source: 'OTHER',
                        description: updateDto.notes || rawLead.notes || 'Marked as Not Interested from Telecalling',
                        createdById: creatorId,
                        assigneeId: null // Explicitly unassigned cold lead
                    }
                });

                // 2. Update RawLead to link it and unassign
                return await this.prisma.rawLead.update({
                    where: { id },
                    data: {
                        ...updateDto,
                        assigneeId: null,
                        convertedLeadId: newLead.id
                    }
                });
            }

            // Normal update for other statuses
            return await this.prisma.rawLead.update({
                where: { id },
                data: updateDto,
            });
        } catch (error) {
            console.error(error);
            throw new NotFoundException('Raw lead not found or update failed');
        }
    }

    async remove(id: string) {
        try {
            return await this.prisma.rawLead.delete({
                where: { id },
            });
        } catch (error) {
            throw new NotFoundException('Raw lead not found');
        }
    }
}
