const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const email = (process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';
    const firstName = process.env.ADMIN_FIRST_NAME || 'Super';
    const lastName = process.env.ADMIN_LAST_NAME || 'Admin';
    const phone = process.env.ADMIN_PHONE || '+910000000000';

    if (!email) {
        throw new Error('ADMIN_EMAIL is required');
    }

    if (!password || password.length < 6) {
        throw new Error('ADMIN_PASSWORD is required and must be at least 6 characters');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const existing = await prisma.user.findFirst({
        where: {
            email: {
                equals: email,
                mode: 'insensitive',
            },
        },
        select: { id: true, email: true, role: true },
    });

    if (existing) {
        const forceUpdate = process.env.FORCE_UPDATE_ADMIN === 'true';
        if (!forceUpdate) {
            console.log(`✅ Super Admin already exists: ${existing.email} (role=${existing.role}). Set FORCE_UPDATE_ADMIN=true to overwrite password/role.`);
            return;
        }

        await prisma.user.update({
            where: { id: existing.id },
            data: {
                password: hashedPassword,
                role: Role.SUPER_ADMIN,
                firstName,
                lastName,
                phone,
            },
        });

        console.log(`🔁 Super Admin updated: ${email}`);
        return;
    }

    await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: Role.SUPER_ADMIN,
            phone,
        },
        select: { id: true },
    });

    console.log(`✅ Super Admin created: ${email}`);
}

main()
    .catch((err) => {
        console.error('❌ Failed to create Super Admin:', err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
