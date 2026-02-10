import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define the new enum values locally to avoid type issues if client isn't perfectly synced
enum NewLeadStatus {
    WARM_LEAD = 'WARM_LEAD',
    HOT_LEAD = 'HOT_LEAD',
    COLD_LEAD = 'COLD_LEAD',
    CLOSED_LEAD = 'CLOSED_LEAD',
    PROPOSAL_LEAD = 'PROPOSAL_LEAD',
}

async function main() {
    console.log('Starting migration...');

    // Map old statuses to new statuses
    const statusMap: Record<string, NewLeadStatus> = {
        'NEW': NewLeadStatus.COLD_LEAD,
        'CONTACTED': NewLeadStatus.WARM_LEAD,
        'QUALIFIED': NewLeadStatus.HOT_LEAD,
        'PROPOSAL': NewLeadStatus.PROPOSAL_LEAD,
        'NEGOTIATION': NewLeadStatus.PROPOSAL_LEAD,
        'WON': NewLeadStatus.CLOSED_LEAD,
        'LOST': NewLeadStatus.CLOSED_LEAD,
        'COLD': NewLeadStatus.COLD_LEAD,
        'WARM': NewLeadStatus.WARM_LEAD,
        'HOT': NewLeadStatus.HOT_LEAD,
    };

    const leads = await prisma.lead.findMany();
    console.log(`Found ${leads.length} leads.`);

    for (const lead of leads) {
        const oldStatus = lead.status as string;
        // Check if it needs migration
        // If it's already one of the new statuses, skip
        if (Object.values(NewLeadStatus).includes(oldStatus as NewLeadStatus)) {
            continue;
        }

        const newStatus = statusMap[oldStatus];

        if (newStatus) {
            console.log(`Migrating lead ${lead.id}: ${oldStatus} -> ${newStatus}`);
            await prisma.lead.update({
                where: { id: lead.id },
                data: { status: newStatus as any }, // Cast to any to bypass strict enum check during transition
            });
        } else {
            console.warn(`Unknown status for lead ${lead.id}: ${oldStatus}. Defaulting to COLD_LEAD.`);
            await prisma.lead.update({
                where: { id: lead.id },
                data: { status: NewLeadStatus.COLD_LEAD as any },
            });
        }
    }

    console.log('Migration completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
