const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearTenderData() {
    try {
        console.log('Deleting all tenders...');
        const deletedTenders = await prisma.tender.deleteMany({
            where: { source: 'GEM' }
        });
        console.log(`✅ Deleted ${deletedTenders.count} tenders`);

        console.log('Deleting all scrape job logs...');
        const deletedLogs = await prisma.tenderScrapeJob.deleteMany({});
        console.log(`✅ Deleted ${deletedLogs.count} scrape job logs`);

        console.log('\n🎉 All tender data cleared successfully!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

clearTenderData();
