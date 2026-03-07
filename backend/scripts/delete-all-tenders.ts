import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();

    try {
        // Delete children first to avoid relation issues / orphans
        const deletedDispatch = await prisma.tenderDispatchQueue.deleteMany({});
        const deletedAttachments = await prisma.attachment.deleteMany({
            where: {
                tenderId: { not: null },
            },
        });
        const deletedEmailLogs = await prisma.emailLog.deleteMany({
            where: {
                tenderId: { not: null },
            },
        });

        const deletedTenders = await prisma.tender.deleteMany({});

        // eslint-disable-next-line no-console
        console.log(
            JSON.stringify(
                {
                    deleted: {
                        tenderDispatchQueue: deletedDispatch.count,
                        attachments: deletedAttachments.count,
                        emailLogs: deletedEmailLogs.count,
                        tenders: deletedTenders.count,
                    },
                },
                null,
                2,
            ),
        );
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
});
