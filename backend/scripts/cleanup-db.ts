import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting database cleanup...');

    try {
        // 1. Find Super Admin(s) to preserve
        const superAdmins = await prisma.user.findMany({
            where: {
                role: Role.SUPER_ADMIN
            }
        });

        if (superAdmins.length === 0) {
            console.warn('⚠️ No Super Admin found! Proceeding with caution... (Might delete all users)');
            // Optional: ABORT if no super admin found to avoid total lockout? 
            // The user explicitly asked to keep Super Admin. If none exists, maybe we should stop or just clear everything.
            // Let's assume there might be one. If not, we just clear everything.
        } else {
            console.log(`🔒 Preserving ${superAdmins.length} Super Admin(s): ${superAdmins.map(u => u.email).join(', ')}`);
        }

        const superAdminIds = superAdmins.map(u => u.id);

        // 2. Delete data in order of dependency (Child -> Parent)

        console.log('Deleting Audit Logs...');
        await prisma.auditLog.deleteMany({});

        console.log('Deleting Scrape Jobs...');
        await prisma.tenderScrapeJob.deleteMany({});

        console.log('Deleting Dispatch Queue...');
        await prisma.tenderDispatchQueue.deleteMany({});

        console.log('Deleting Leaderboard Scores...');
        await prisma.leaderboardScore.deleteMany({});

        console.log('Deleting Notifications...');
        await prisma.notification.deleteMany({});

        console.log('Deleting Email Logs...');
        await prisma.emailLog.deleteMany({});

        console.log('Deleting Invoice Line Items...');
        await prisma.invoiceLineItem.deleteMany({});

        console.log('Deleting Payments...');
        await prisma.payment.deleteMany({});

        console.log('Deleting Invoices...');
        await prisma.invoice.deleteMany({});

        console.log('Deleting Activities...');
        await prisma.activity.deleteMany({});

        console.log('Deleting Notes...');
        await prisma.note.deleteMany({});

        console.log('Deleting Attachments...');
        await prisma.attachment.deleteMany({});



        console.log('Deleting Subscriptions...');
        await prisma.tenderSubscription.deleteMany({});



        // Tenders might be created by Admin, but usually we want to clear test tenders too?
        // User said "test data sab remove kr do". Tenders are data.
        console.log('Deleting Tenders...');
        await prisma.tender.deleteMany({});

        console.log('Deleting Tender Categories...');
        await prisma.tenderCategory.deleteMany({});

        console.log('Deleting Customers...');
        await prisma.customer.deleteMany({});

        console.log('Deleting Leads...');
        await prisma.lead.deleteMany({});

        console.log('Deleting Email Templates...');
        await prisma.emailTemplate.deleteMany({});

        // 3. Handle Users and Branches

        // We need to break relations for Users being deleted first, otherwise they might reference Managers/Branches
        // But since we are deleting 'Most' users, we can just delete them.
        // Self-referential relations (Manager) might be tricky if not set to cascade or nullable.
        // Schema says: manager User? @relation("ManagerEmployees", fields: [managerId], references: [id], onDelete: NoAction, onUpdate: NoAction)

        // Strategy: Set managerId and branchId to null for ALL users to be deleted first.
        console.log('Detaching Users from Managers/Branches...');
        await prisma.user.updateMany({
            where: {
                id: { notIn: superAdminIds }
            },
            data: {
                managerId: null,
                branchId: null
            }
        });

        console.log('Deleting Users (except Super Admin)...');
        const deleteUsersResult = await prisma.user.deleteMany({
            where: {
                id: { notIn: superAdminIds }
            }
        });
        console.log(`Deleted ${deleteUsersResult.count} users.`);

        console.log('Deleting Branches...');
        // Only delete branches if Super Admin doesn't need them. 
        // Schema: User has optional branchId. Super Admin usually has NO branch.
        await prisma.branch.deleteMany({});

        console.log('✅ Database cleanup completed successfully!');

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
