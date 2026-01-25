import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({ select: { email: true, role: true } });

    const leadCount = await prisma.lead.count();
    const customerCount = await prisma.customer.count();
    const branchCount = await prisma.branch.count();

    console.log('--- Verification Report ---');
    console.log(`Users: ${userCount}`);
    users.forEach(u => console.log(` - ${u.email} (${u.role})`));
    console.log(`Leads: ${leadCount}`);
    console.log(`Customers: ${customerCount}`);
    console.log(`Branches: ${branchCount}`);
    console.log('---------------------------');
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
