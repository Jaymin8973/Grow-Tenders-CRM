import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { Role, LeadStatus, LeadSource, Prisma, ActivityType, ActivityStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import * as XLSX from 'xlsx';
import { parse as parseCsv } from 'csv-parse/sync';

interface UserContext {
    id: string;
    role: Role;
    managerId?: string | null;
}

import { CustomersService } from '../customers/customers.service';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LeadsService {
    private readonly logger = new Logger(LeadsService.name);

    constructor(
        private prisma: PrismaService,
        private customersService: CustomersService,
        private activitiesService: ActivitiesService,
        private notificationsService: NotificationsService,
    ) { }

    private async createFollowUpActivity(
        lead: { id: string; firstName: string; lastName: string; assigneeId?: string | null },
        nextFollowUp: Date,
        userId: string,
    ) {
        const activity = await this.activitiesService.create(
            {
                title: `Follow-up with ${lead.firstName} ${lead.lastName}`,
                type: ActivityType.FOLLOW_UP,
                status: ActivityStatus.SCHEDULED,
                scheduledAt: nextFollowUp.toISOString(),
                leadId: lead.id,
                assigneeId: lead.assigneeId || userId,
            },
            userId,
        );

        await this.notificationsService.notifyActivityReminder(
            activity.assigneeId,
            activity.title,
            activity.id,
        );
    }

    async bulkImportFromFile(file: Express.Multer.File, user: UserContext) {
        if (!file) {
            throw new NotFoundException('No file uploaded');
        }

        const maxBytes = 5 * 1024 * 1024;
        if (file.size > maxBytes) {
            throw new ForbiddenException('File too large. Max allowed size is 5MB');
        }

        const ext = (file.originalname.split('.').pop() || '').toLowerCase();

        let records: Record<string, any>[] = [];

        if (ext === 'csv') {
            const text = file.buffer.toString('utf8');
            records = parseCsv(text, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });
        } else if (ext === 'xlsx' || ext === 'xls') {
            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            records = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as any;
        } else {
            throw new ForbiddenException('Unsupported file type. Please upload CSV or XLSX');
        }

        const maxRows = 2000;
        if (records.length > maxRows) {
            throw new ForbiddenException(`Too many rows. Max allowed rows is ${maxRows}`);
        }

        const normalizeKey = (k: string) => k.toLowerCase().replace(/\s|\-|\./g, '');
        const getField = (row: any, keys: string[]) => {
            const map = new Map<string, any>();
            Object.keys(row || {}).forEach(k => map.set(normalizeKey(k), row[k]));
            for (const key of keys) {
                const v = map.get(normalizeKey(key));
                if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
            }
            return undefined;
        };

        const result = {
            totalRows: records.length,
            created: 0,
            updated: 0,
            failed: 0,
            errors: [] as { row: number; message: string }[],
        };

        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rowNumber = i + 2;

            const email = getField(row, ['email']);
            const firstName = getField(row, ['firstName', 'first name', 'firstname']);
            const lastName = getField(row, ['lastName', 'last name', 'lastname']);

            if (!email || !firstName || !lastName) {
                result.failed++;
                result.errors.push({ row: rowNumber, message: 'Missing required fields: email, firstName, lastName' });
                continue;
            }

            const company = getField(row, ['company']);
            const mobile = getField(row, ['mobile', 'phone', 'phonenumber', 'phone number']);
            const statusRaw = getField(row, ['status']);
            const sourceRaw = getField(row, ['source']);
            const assigneeId = getField(row, ['assigneeId', 'assignee id']);
            const nextFollowUpRaw = getField(row, ['nextFollowUp', 'next follow up', 'nextfollowup']);
            const industry = getField(row, ['industry']);
            const description = getField(row, ['description']);

            const status = (statusRaw as LeadStatus) || undefined;
            const source = (sourceRaw as LeadSource) || undefined;

            let nextFollowUp: Date | undefined;
            if (nextFollowUpRaw) {
                const d = new Date(nextFollowUpRaw);
                if (!Number.isNaN(d.getTime())) nextFollowUp = d;
            }

            try {
                const existing = await this.prisma.lead.findFirst({
                    where: { email: { equals: email, mode: 'insensitive' } },
                    select: { id: true },
                });

                if (existing) {
                    await this.prisma.lead.update({
                        where: { id: existing.id },
                        data: {
                            firstName,
                            lastName,
                            email,
                            company,
                            mobile,
                            industry,
                            description,
                            status,
                            source,
                            assigneeId: assigneeId || undefined,
                            nextFollowUp: nextFollowUp || undefined,
                        } as any,
                    });
                    result.updated++;
                } else {
                    await this.prisma.lead.create({
                        data: {
                            title: `${firstName} ${lastName}`,
                            firstName,
                            lastName,
                            email,
                            company,
                            mobile,
                            industry,
                            description,
                            status: status || LeadStatus.COLD_LEAD,
                            source: source || LeadSource.OTHER,
                            createdById: user.id,
                            assigneeId: assigneeId || user.id,
                            nextFollowUp: nextFollowUp || undefined,
                        } as any,
                    });
                    result.created++;
                }
            } catch (e: any) {
                this.logger.warn(`Bulk import row failed: ${e?.message || e}`);
                result.failed++;
                result.errors.push({ row: rowNumber, message: e?.message || 'Unknown error' });
            }
        }

        return result;
    }

    async create(createLeadDto: CreateLeadDto, userId: string) {
        const lead = await this.prisma.lead.create({
            data: {
                ...createLeadDto,
                title: `${createLeadDto.firstName} ${createLeadDto.lastName}`,
                notes: createLeadDto.notes ? {
                    create: {
                        content: createLeadDto.notes,
                        createdById: userId,
                    }
                } : undefined,
                createdById: userId,
                assigneeId: createLeadDto.assigneeId || userId,
            },
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });

        if (createLeadDto.nextFollowUp && createLeadDto.status !== LeadStatus.CLOSED_LEAD) {
            await this.createFollowUpActivity(
                lead,
                new Date(createLeadDto.nextFollowUp),
                userId,
            );
        }

        return lead;
    }

    async findAll(user: UserContext, filters?: {
        status?: LeadStatus;
        source?: LeadSource;
        assigneeId?: string;
        search?: string;
        excludeAssigneeId?: string;
        page?: number;
        pageSize?: number;
        cursor?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) {
        let where: any = {};

        // Role-based filtering
        if (user.role === Role.MANAGER) {
            // Manager can see their own leads and their team's leads
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: user.id },
                select: { id: true },
            });
            const teamIds = teamMembers.map(m => m.id);
            where.assigneeId = { in: [user.id, ...teamIds] };
        }
        // EMPLOYEE and SUPER_ADMIN can see all (Read-only for others is handled in Update/Delete guards)
        // SUPER_ADMIN sees all

        // Apply filters
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.source) {
            where.source = filters.source;
        }
        // Allow filtering by assignee only if user has permission to see others
        if (filters?.assigneeId) {
            if (filters.assigneeId === 'unassigned') {
                where.assigneeId = null;
            } else {
            // If Manager, ensure the requested assignee is in their team
            if (user.role === Role.MANAGER) {
                // We already restricted 'where.assigneeId' above. 
                // If we overwrite it, we might break the restriction.
                // Instead, we should check if the requested assigneeId is valid within the restricted set.
                // Simplest way: The 'AND' of the restriction and the filter.

                // If the manager filters by themselves, it's fine (user.id is in the list).
                // If they filter by a team member, it's fine.
                // If they filter by someone else, it should return empty (intersection).

                // Existing `where.assigneeId` is `{ in: [...] }`
                const allowedIds = (where.assigneeId as any)?.in as string[];

                if (allowedIds && !allowedIds.includes(filters.assigneeId)) {
                    // Requested assignee not in team -> return nothing
                    // We can force a condition that is always false, or just empty array
                    where.assigneeId = { in: [] };
                } else {
                    where.assigneeId = filters.assigneeId;
                }
            } else {
                // Admin and Employee can filter freely (Employee has global read)
                where.assigneeId = filters.assigneeId;
            }
            }
        }

        if (filters?.excludeAssigneeId && !filters?.assigneeId) {
            // Only apply exclusion if we are not specifically filtering by a single assignee
            // For managers, we need to be careful not to break the `in` clause if it exists
            if (where.assigneeId && typeof where.assigneeId === 'object' && where.assigneeId.in) {
                // If we have an IN clause, we just filter the list
                where.assigneeId.in = (where.assigneeId.in as string[]).filter(id => id !== filters.excludeAssigneeId);
            } else {
                // Standard exclusion
                where.assigneeId = { not: filters.excludeAssigneeId };
            }
        }

        if (filters?.search) {
            where.OR = [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
                { company: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const pageSize = Math.min(Math.max(filters?.pageSize ?? 25, 1), 100);
        const page = Math.max(filters?.page ?? 1, 1);

        const sortBy = filters?.sortBy ?? 'createdAt';
        const sortOrder: 'asc' | 'desc' = filters?.sortOrder ?? 'desc';

        const orderBy: Prisma.LeadOrderByWithRelationInput = { [sortBy]: sortOrder } as any;

        const baseQuery: Prisma.LeadFindManyArgs = {
            where,
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
                _count: {
                    select: { activities: true },
                },
            },
            orderBy,
        };

        const usingCursor = !!filters?.cursor;

        const leads = await this.prisma.lead.findMany({
            ...baseQuery,
            ...(usingCursor
                ? {
                    cursor: { id: filters!.cursor! },
                    skip: 1,
                    take: pageSize,
                }
                : {
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                }),
        });

        const maskedLeads = user.role === Role.EMPLOYEE
            ? leads.map(lead => {
                if (lead.assigneeId !== user.id && lead.mobile) {
                    // Mask mobile number details
                    // Keep last 4 digits, hide the rest
                    const last4 = lead.mobile.slice(-4);
                    const masked = '*'.repeat(Math.max(0, lead.mobile.length - 4)) + last4;
                    // Or simply '******' + last4 for consistent length? 
                    // User said: "baki * se masking hona chahiye" -> implies masking specific characters.
                    // Let's use generic masking to avoid leaking length if that's a concern, 
                    // but typically reusing length is fine. User said "baki * se".
                    // Let's us '******' + last4 to be safe and clean.
                    return {
                        ...lead,
                        mobile: '******' + last4,
                    };
                }
                return lead;
            })
            : leads;

        const nextCursor = maskedLeads.length > 0 ? maskedLeads[maskedLeads.length - 1].id : null;

        const total = usingCursor
            ? undefined
            : await this.prisma.lead.count({ where });

        return {
            items: maskedLeads,
            page: usingCursor ? undefined : page,
            pageSize,
            total,
            nextCursor,
        };
    }

    async findOne(id: string, user: UserContext) {
        const lead = await this.prisma.lead.findUnique({
            where: { id },
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
                },
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
                activities: {
                    orderBy: { scheduledAt: 'desc' },
                    take: 10,
                },

                notes: {
                    orderBy: { createdAt: 'desc' },
                },
                attachments: {
                    orderBy: { createdAt: 'desc' },
                },
                emailLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        // RBAC Check for findOne
        // Employees can view all leads (Global Read), no restriction here.

        if (user.role === Role.MANAGER) {
            // Check if lead belongs to manager or their team
            if (lead.assigneeId !== user.id) {
                // Check if assignee is in team
                const assignee = await this.prisma.user.findUnique({
                    where: { id: lead.assigneeId || undefined },
                    select: { managerId: true }
                });
                if (assignee?.managerId !== user.id) {
                    throw new ForbiddenException('You do not have access to this lead');
                }
            }
        }

        if (user.role === Role.EMPLOYEE && lead.assigneeId !== user.id && lead.mobile) {
            const last4 = lead.mobile.slice(-4);
            (lead as any).mobile = '******' + last4;
        }

        return lead;
    }

    async update(id: string, updateLeadDto: UpdateLeadDto, user: UserContext) {
        const lead = await this.prisma.lead.findUnique({ where: { id } });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        // Check access
        if (user.role === Role.EMPLOYEE && lead.assigneeId !== user.id) {
            throw new ForbiddenException('You do not have access to update this lead');
        }

        const updatedLead = await this.prisma.lead.update({
            where: { id },
            data: updateLeadDto as Prisma.LeadUncheckedUpdateInput,
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });

        if (updateLeadDto.nextFollowUp && updatedLead.status !== LeadStatus.CLOSED_LEAD) {
            await this.createFollowUpActivity(
                updatedLead,
                new Date(updateLeadDto.nextFollowUp),
                user.id,
            );
        }

        return updatedLead;
    }

    async delete(id: string, user: UserContext) {
        const lead = await this.prisma.lead.findUnique({ where: { id } });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        if (user.role === Role.EMPLOYEE) {
            throw new ForbiddenException('Employees cannot delete leads');
        }

        await this.prisma.lead.delete({ where: { id } });
        return { message: 'Lead deleted successfully' };
    }

    async assignLead(id: string, assigneeId: string, user: UserContext) {
        const lead = await this.prisma.lead.findUnique({ where: { id } });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        if (user.role === Role.EMPLOYEE) {
            throw new ForbiddenException('Employees cannot reassign leads');
        }

        // Verify assignee exists
        const assignee = await this.prisma.user.findUnique({ where: { id: assigneeId } });
        if (!assignee) {
            throw new NotFoundException('Assignee not found');
        }

        return this.prisma.lead.update({
            where: { id },
            data: { assigneeId },
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
    }

    async updateStatus(id: string, status: LeadStatus, user: UserContext) {
        const lead = await this.prisma.lead.findUnique({ where: { id } });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        if (user.role === Role.EMPLOYEE && lead.assigneeId !== user.id) {
            throw new ForbiddenException('You cannot update status of this lead');
        }

        const updatedLead = await this.prisma.lead.update({
            where: { id },
            data: {
                status,
                nextFollowUp: status === LeadStatus.CLOSED_LEAD ? null : undefined,
            },
        });

        // Auto-convert to Customer if Status is WON
        if (status === LeadStatus.CLOSED_LEAD && !lead.convertedToCustomerId) {
            try {
                await this.customersService.createFromLead(id, user.id);
            } catch (error) {
                // Log error but don't fail the status update? 
                // Or maybe we should fail? 
                this.logger.error('Failed to auto-convert lead to customer', error as any);
            }
        }

        return updatedLead;
    }

    async bulkAssignLeads(leadIds: string[], assigneeId: string, user: UserContext) {
        if (user.role === Role.EMPLOYEE) {
            throw new ForbiddenException('Employees cannot reassign leads');
        }

        // Verify assignee exists
        const assignee = await this.prisma.user.findUnique({ where: { id: assigneeId } });
        if (!assignee) {
            throw new NotFoundException('Assignee not found');
        }

        // Update all leads
        const result = await this.prisma.lead.updateMany({
            where: {
                id: { in: leadIds },
            },
            data: { assigneeId },
        });

        return {
            message: `Successfully assigned ${result.count} lead(s)`,
            count: result.count,
        };
    }

    async bulkDeleteLeads(leadIds: string[], user: UserContext) {
        if (user.role === Role.EMPLOYEE) {
            throw new ForbiddenException('Employees cannot delete leads');
        }

        // Delete all leads
        const result = await this.prisma.lead.deleteMany({
            where: {
                id: { in: leadIds },
            },
        });

        return {
            message: `Successfully deleted ${result.count} lead(s)`,
            count: result.count,
        };
    }

    async getLeadStats(user: UserContext) {
        let where: any = {};

        if (user.role === Role.EMPLOYEE) {
            where.assigneeId = user.id;
        } else if (user.role === Role.MANAGER) {
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: user.id },
                select: { id: true },
            });
            const teamIds = teamMembers.map(m => m.id);
            where.assigneeId = { in: [user.id, ...teamIds] };
        }

        const [total, byStatus] = await Promise.all([
            this.prisma.lead.count({ where }),
            this.prisma.lead.groupBy({
                by: ['status'],
                where,
                _count: true,
            }),
        ]);

        return {
            total,
            byStatus: byStatus.reduce((acc, item) => {
                acc[item.status] = item._count;
                return acc;
            }, {} as Record<LeadStatus, number>),
        };
    }
}
