import { PrismaClient, Role, LeadStatus, LeadSource, CustomerLifecycle, DealStage, ActivityType, ActivityStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Clean existing data
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.emailLog.deleteMany();
    await prisma.invoiceLineItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.note.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.tenderSubscription.deleteMany();
    await prisma.tender.deleteMany();
    await prisma.tenderCategory.deleteMany();
    await prisma.emailTemplate.deleteMany();

    // Break self-referential and branch relations before deleting users
    await prisma.user.updateMany({
        data: { managerId: null, branchId: null },
    });
    await prisma.user.deleteMany();
    await prisma.branch.deleteMany();

    console.log('🧹 Cleaned existing data');

    // Create branches
    const branch1 = await prisma.branch.create({
        data: {
            name: 'Head Office',
            code: 'HO',
            address: '123 Main Street, City Center',
            phone: '+919876543210',
            email: 'headoffice@company.com',
        },
    });

    const branch2 = await prisma.branch.create({
        data: {
            name: 'Branch Office',
            code: 'BO',
            address: '456 Market Road, Business District',
            phone: '+919876543211',
            email: 'branchoffice@company.com',
        },
    });

    console.log('🏢 Created branches');

    // Create users
    const hashedAdminPassword = await bcrypt.hash('Admin@123', 10);
    const hashedManagerPassword = await bcrypt.hash('Manager@123', 10);
    const hashedEmployeePassword = await bcrypt.hash('Employee@123', 10);

    // Super Admin (no branch - can access all)
    const admin = await prisma.user.create({
        data: {
            email: 'admin@example.com',
            password: hashedAdminPassword,
            firstName: 'Super',
            lastName: 'Admin',
            role: Role.SUPER_ADMIN,
            phone: '+1234567890',
            // No branchId - Super Admin manages all branches
        },
    });

    // Manager 1 - Head Office
    const manager1 = await prisma.user.create({
        data: {
            email: 'manager@example.com',
            password: hashedManagerPassword,
            firstName: 'John',
            lastName: 'Manager',
            role: Role.MANAGER,
            phone: '+1234567891',
            branchId: branch1.id,
        },
    });

    // Manager 2 - Branch Office
    const manager2 = await prisma.user.create({
        data: {
            email: 'manager2@example.com',
            password: hashedManagerPassword,
            firstName: 'Sarah',
            lastName: 'Manager',
            role: Role.MANAGER,
            phone: '+1234567894',
            branchId: branch2.id,
        },
    });

    // Employees for Head Office
    const employee1 = await prisma.user.create({
        data: {
            email: 'employee@example.com',
            password: hashedEmployeePassword,
            firstName: 'Jane',
            lastName: 'Employee',
            role: Role.EMPLOYEE,
            phone: '+1234567892',
            managerId: manager1.id,
            branchId: branch1.id,
        },
    });

    const employee2 = await prisma.user.create({
        data: {
            email: 'employee2@example.com',
            password: hashedEmployeePassword,
            firstName: 'Bob',
            lastName: 'Sales',
            role: Role.EMPLOYEE,
            phone: '+1234567893',
            managerId: manager1.id,
            branchId: branch1.id,
        },
    });

    // Employees for Branch Office
    const employee3 = await prisma.user.create({
        data: {
            email: 'employee3@example.com',
            password: hashedEmployeePassword,
            firstName: 'Mike',
            lastName: 'Sales',
            role: Role.EMPLOYEE,
            phone: '+1234567895',
            managerId: manager2.id,
            branchId: branch2.id,
        },
    });

    console.log('👤 Created users');

    // Create leads
    const leads = await Promise.all([
        prisma.lead.create({
            data: {
                title: 'Enterprise Software Deal',
                firstName: 'Michael',
                lastName: 'Johnson',
                email: 'michael.johnson@techcorp.com',
                company: 'TechCorp Inc',
                status: LeadStatus.QUALIFIED,
                source: LeadSource.WEBSITE,
                description: 'Interested in enterprise software solution',
                assigneeId: employee1.id,
                createdById: admin.id,
            },
        }),
        prisma.lead.create({
            data: {
                title: 'Consulting Services Inquiry',
                firstName: 'Sarah',
                lastName: 'Williams',
                email: 'sarah@innovate.io',
                company: 'Innovate.io',
                status: LeadStatus.CONTACTED,
                source: LeadSource.REFERRAL,
                description: 'Looking for consulting services',
                assigneeId: employee1.id,
                createdById: manager1.id,
            },
        }),
        prisma.lead.create({
            data: {
                title: 'Cloud Migration Project',
                firstName: 'David',
                lastName: 'Brown',
                email: 'dbrown@globaltech.com',
                company: 'Global Tech Solutions',
                status: LeadStatus.PROPOSAL,
                source: LeadSource.COLD_CALL,
                description: 'Need help with cloud migration',
                assigneeId: employee2.id,
                createdById: manager1.id,
            },
        }),
        prisma.lead.create({
            data: {
                title: 'Marketing Automation Platform',
                firstName: 'Emily',
                lastName: 'Davis',
                email: 'emily@marketingpro.com',
                company: 'Marketing Pro',
                status: LeadStatus.NEW,
                source: LeadSource.SOCIAL_MEDIA,
                description: 'Seeking marketing automation solution',
                assigneeId: employee2.id,
                createdById: admin.id,
            },
        }),
    ]);

    console.log('📋 Created leads');

    // Create customers
    const customers = await Promise.all([
        prisma.customer.create({
            data: {
                firstName: 'Robert',
                lastName: 'Miller',
                email: 'robert@abccorp.com',
                phone: '+1555567890',
                company: 'ABC Corporation',
                position: 'VP Operations',
                lifecycle: CustomerLifecycle.CUSTOMER,
                city: 'Boston',
                state: 'MA',
                country: 'USA',
                industry: 'Manufacturing',
                annualRevenue: 5000000,
                assigneeId: employee1.id,
            },
        }),
        prisma.customer.create({
            data: {
                firstName: 'Jennifer',
                lastName: 'Taylor',
                email: 'jennifer@xyzindustries.com',
                phone: '+1555678901',
                company: 'XYZ Industries',
                position: 'Procurement Manager',
                lifecycle: CustomerLifecycle.CUSTOMER,
                city: 'Seattle',
                state: 'WA',
                country: 'USA',
                industry: 'Technology',
                annualRevenue: 10000000,
                assigneeId: employee1.id,
            },
        }),
        prisma.customer.create({
            data: {
                firstName: 'William',
                lastName: 'Anderson',
                email: 'william@deltaservices.com',
                phone: '+1555789012',
                company: 'Delta Services',
                position: 'General Manager',
                lifecycle: CustomerLifecycle.PROSPECT,
                city: 'Denver',
                state: 'CO',
                country: 'USA',
                industry: 'Services',
                annualRevenue: 2500000,
                assigneeId: employee2.id,
            },
        }),
    ]);

    console.log('👥 Created customers');

    // Create deals
    const deals = await Promise.all([
        prisma.deal.create({
            data: {
                title: 'Enterprise License Agreement',
                value: 150000,
                stage: DealStage.NEGOTIATION,
                probability: 75,
                expectedCloseDate: new Date('2024-03-15'),
                description: 'Annual enterprise license for 500 users',
                customerId: customers[0].id,
                ownerId: employee1.id,
            },
        }),
        prisma.deal.create({
            data: {
                title: 'Consulting Engagement',
                value: 80000,
                stage: DealStage.PROPOSAL,
                probability: 50,
                expectedCloseDate: new Date('2024-04-01'),
                description: 'Digital transformation consulting',
                customerId: customers[1].id,
                ownerId: employee1.id,
            },
        }),
        prisma.deal.create({
            data: {
                title: 'Support Contract Renewal',
                value: 45000,
                stage: DealStage.CLOSED_WON,
                probability: 100,
                expectedCloseDate: new Date('2024-02-01'),
                actualCloseDate: new Date('2024-01-28'),
                description: 'Annual support contract renewal',
                customerId: customers[0].id,
                ownerId: employee2.id,
            },
        }),
        prisma.deal.create({
            data: {
                title: 'New Product Implementation',
                value: 200000,
                stage: DealStage.QUALIFICATION,
                probability: 10,
                expectedCloseDate: new Date('2024-06-30'),
                description: 'Implementation of new product suite',
                leadId: leads[2].id,
                ownerId: employee2.id,
            },
        }),
    ]);

    console.log('💰 Created deals');

    // Create activities
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    await Promise.all([
        prisma.activity.create({
            data: {
                title: 'Follow-up call with Michael',
                type: ActivityType.CALL,
                status: ActivityStatus.SCHEDULED,
                description: 'Discuss proposal details',
                scheduledAt: tomorrow,
                duration: 30,
                assigneeId: employee1.id,
                createdById: employee1.id,
                leadId: leads[0].id,
            },
        }),
        prisma.activity.create({
            data: {
                title: 'Product demo for Sarah',
                type: ActivityType.DEMO,
                status: ActivityStatus.SCHEDULED,
                description: 'Full product demonstration',
                scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
                duration: 60,
                location: 'Zoom Meeting',
                assigneeId: employee1.id,
                createdById: manager1.id,
                leadId: leads[1].id,
            },
        }),
        prisma.activity.create({
            data: {
                title: 'Contract review meeting',
                type: ActivityType.MEETING,
                status: ActivityStatus.OVERDUE,
                description: 'Review contract terms',
                scheduledAt: yesterday,
                duration: 45,
                assigneeId: employee1.id,
                createdById: employee1.id,
                dealId: deals[0].id,
            },
        }),
        prisma.activity.create({
            data: {
                title: 'Send proposal to David',
                type: ActivityType.TASK,
                status: ActivityStatus.COMPLETED,
                description: 'Prepare and send pricing proposal',
                scheduledAt: yesterday,
                completedAt: yesterday,
                outcome: 'Proposal sent successfully',
                assigneeId: employee2.id,
                createdById: employee2.id,
                leadId: leads[2].id,
            },
        }),
        prisma.activity.create({
            data: {
                title: 'Quarterly review with ABC Corp',
                type: ActivityType.MEETING,
                status: ActivityStatus.SCHEDULED,
                description: 'Quarterly business review',
                scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                duration: 90,
                location: 'Client Office',
                assigneeId: employee1.id,
                createdById: manager1.id,
                customerId: customers[0].id,
            },
        }),
    ]);

    console.log('📅 Created activities');

    // Create tender categories
    const categories = await Promise.all([
        prisma.tenderCategory.create({
            data: {
                name: 'IT Services',
                description: 'Information technology related tenders',
            },
        }),
        prisma.tenderCategory.create({
            data: {
                name: 'Construction',
                description: 'Building and infrastructure projects',
            },
        }),
        prisma.tenderCategory.create({
            data: {
                name: 'Consulting',
                description: 'Business and management consulting',
            },
        }),
    ]);

    console.log('📁 Created tender categories');

    // Create tenders
    await Promise.all([
        prisma.tender.create({
            data: {
                title: 'Government IT Infrastructure Upgrade',
                description: 'Complete IT infrastructure upgrade for government offices',
                status: 'PUBLISHED',
                categoryId: categories[0].id,
                openDate: new Date(),
                closeDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                value: 500000,
                requirements: 'ISO 27001 certification required',
                createdById: admin.id,
            },
        }),
        prisma.tender.create({
            data: {
                title: 'Office Building Renovation',
                description: 'Renovation of main office building',
                status: 'PUBLISHED',
                categoryId: categories[1].id,
                openDate: new Date(),
                closeDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
                value: 250000,
                requirements: 'Licensed contractor required',
                createdById: admin.id,
            },
        }),
    ]);

    console.log('📄 Created tenders');

    // Create email templates
    await Promise.all([
        prisma.emailTemplate.create({
            data: {
                name: 'Invoice Email',
                subject: 'Invoice {{invoiceNumber}} from Sales CRM',
                body: '<p>Dear {{customerName}},</p><p>Please find attached your invoice {{invoiceNumber}}.</p>',
                type: 'invoice',
                variables: ['invoiceNumber', 'customerName', 'amount', 'dueDate'],
            },
        }),
        prisma.emailTemplate.create({
            data: {
                name: 'Tender Notification',
                subject: 'New Tender Opportunity: {{tenderTitle}}',
                body: '<p>Dear {{customerName}},</p><p>A new tender matching your interests is available.</p>',
                type: 'tender',
                variables: ['tenderTitle', 'customerName', 'closeDate'],
            },
        }),
        prisma.emailTemplate.create({
            data: {
                name: 'Welcome Email',
                subject: 'Welcome to Sales CRM',
                body: '<p>Dear {{userName}},</p><p>Welcome to Sales CRM. Your account has been created.</p>',
                type: 'notification',
                variables: ['userName', 'loginUrl'],
            },
        }),
    ]);

    console.log('📧 Created email templates');

    console.log('✅ Seed completed successfully!');
    console.log('\n📝 Demo Accounts:');
    console.log('   Admin: admin@example.com / Admin@123');
    console.log('   Manager: manager@example.com / Manager@123');
    console.log('   Employee: employee@example.com / Employee@123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
