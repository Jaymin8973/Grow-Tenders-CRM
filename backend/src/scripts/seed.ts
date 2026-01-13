import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User, Team, Lead, Deal, Customer, FollowUp, Activity } from '../models';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_grow_tenders';

// Branch IDs
const BRANCH_DEL = 'branch-del';
const BRANCH_MUM = 'branch-mum';

async function seedDatabase() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Team.deleteMany({}),
            Lead.deleteMany({}),
            Deal.deleteMany({}),
            Customer.deleteMany({}),
            FollowUp.deleteMany({}),
            Activity.deleteMany({})
        ]);
        console.log('🗑️  Cleared existing data');

        // Plain text passwords - User model will hash via pre-save hook
        const adminPassword = 'admin123';
        const managerPassword = 'manager123';
        const employeePassword = 'employee123';

        // ============ CREATE USERS ============

        // Super Admin
        const superAdmin = await User.create({
            email: 'admin@crm.com',
            password: adminPassword,
            firstName: 'Sarthak',
            lastName: 'Admin',
            role: 'super_admin',
            status: 'active'
        });

        // Delhi Branch - Manager & Employees
        const delhiManager = await User.create({
            email: 'manager.del@crm.com',
            password: managerPassword,
            firstName: 'Rahul',
            lastName: 'Sharma',
            role: 'manager',
            branchId: BRANCH_DEL,
            branchName: 'Delhi Branch',
            status: 'active'
        });

        const delhiEmp1 = await User.create({
            email: 'employee.del@crm.com',
            password: employeePassword,
            firstName: 'Amit',
            lastName: 'Kumar',
            role: 'employee',
            branchId: BRANCH_DEL,
            branchName: 'Delhi Branch',
            status: 'active'
        });

        const delhiEmp2 = await User.create({
            email: 'priya.singh@crm.com',
            password: employeePassword,
            firstName: 'Priya',
            lastName: 'Singh',
            role: 'employee',
            branchId: BRANCH_DEL,
            branchName: 'Delhi Branch',
            status: 'active'
        });

        const delhiEmp3 = await User.create({
            email: 'vikram.verma@crm.com',
            password: employeePassword,
            firstName: 'Vikram',
            lastName: 'Verma',
            role: 'employee',
            branchId: BRANCH_DEL,
            branchName: 'Delhi Branch',
            status: 'active'
        });

        // Mumbai Branch - Manager & Employees
        const mumbaiManager = await User.create({
            email: 'manager.mum@crm.com',
            password: managerPassword,
            firstName: 'Neha',
            lastName: 'Patel',
            role: 'manager',
            branchId: BRANCH_MUM,
            branchName: 'Mumbai Branch',
            status: 'active'
        });

        const mumbaiEmp1 = await User.create({
            email: 'employee.mum@crm.com',
            password: employeePassword,
            firstName: 'Rohan',
            lastName: 'Mehta',
            role: 'employee',
            branchId: BRANCH_MUM,
            branchName: 'Mumbai Branch',
            status: 'active'
        });

        const mumbaiEmp2 = await User.create({
            email: 'anjali.gupta@crm.com',
            password: employeePassword,
            firstName: 'Anjali',
            lastName: 'Gupta',
            role: 'employee',
            branchId: BRANCH_MUM,
            branchName: 'Mumbai Branch',
            status: 'active'
        });

        const mumbaiEmp3 = await User.create({
            email: 'karan.joshi@crm.com',
            password: employeePassword,
            firstName: 'Karan',
            lastName: 'Joshi',
            role: 'employee',
            branchId: BRANCH_MUM,
            branchName: 'Mumbai Branch',
            status: 'active'
        });

        console.log('👥 Created users');

        // ============ CREATE TEAMS ============

        const delhiTeam = await Team.create({
            name: 'Delhi Sales Team',
            branchId: BRANCH_DEL,
            branchName: 'Delhi Branch',
            managerId: delhiManager._id
        });

        const mumbaiTeam = await Team.create({
            name: 'Mumbai Sales Team',
            branchId: BRANCH_MUM,
            branchName: 'Mumbai Branch',
            managerId: mumbaiManager._id
        });

        // Update employees with team IDs
        await User.updateMany(
            { branchId: BRANCH_DEL, role: 'employee' },
            { teamId: delhiTeam._id }
        );
        await User.updateMany(
            { branchId: BRANCH_MUM, role: 'employee' },
            { teamId: mumbaiTeam._id }
        );

        console.log('👥 Created teams');

        // ============ CREATE LEADS - DELHI ============

        const delhiLeads = await Lead.insertMany([
            {
                firstName: 'Rajesh', lastName: 'Agarwal', email: 'rajesh@techsolutions.in',
                phone: '+91 98111 22334', company: 'Tech Solutions Pvt Ltd',
                source: 'website', leadType: 'hot', status: 'qualified', score: 85,
                branchId: BRANCH_DEL, assignedTo: delhiEmp1._id, assignedBy: delhiManager._id,
                teamId: delhiTeam._id, createdBy: delhiManager._id, expectedValue: 150000
            },
            {
                firstName: 'Sunita', lastName: 'Kapoor', email: 'sunita@startupindia.co',
                phone: '+91 99887 66554', company: 'Startup India Co',
                source: 'referral', leadType: 'warm', status: 'contacted', score: 65,
                branchId: BRANCH_DEL, assignedTo: delhiEmp2._id, assignedBy: delhiManager._id,
                teamId: delhiTeam._id, createdBy: delhiManager._id, expectedValue: 75000
            },
            {
                firstName: 'Manoj', lastName: 'Tiwari', email: 'manoj@globaltech.in',
                phone: '+91 88776 55443', company: 'Global Tech India',
                source: 'linkedin', leadType: 'cold', status: 'new', score: 40,
                branchId: BRANCH_DEL, createdBy: delhiManager._id, expectedValue: 50000
            },
            {
                firstName: 'Deepika', lastName: 'Malhotra', email: 'deepika@innovate.co.in',
                phone: '+91 77665 44332', company: 'Innovate Solutions',
                source: 'website', leadType: 'hot', status: 'proposal', score: 90,
                branchId: BRANCH_DEL, assignedTo: delhiEmp3._id, assignedBy: delhiManager._id,
                teamId: delhiTeam._id, createdBy: delhiManager._id, expectedValue: 200000
            },
            {
                firstName: 'Arun', lastName: 'Saxena', email: 'arun@bigcorp.in',
                phone: '+91 66554 33221', company: 'Big Corp India',
                source: 'cold_call', leadType: 'warm', status: 'contacted', score: 55,
                branchId: BRANCH_DEL, assignedTo: delhiEmp1._id, assignedBy: delhiManager._id,
                teamId: delhiTeam._id, createdBy: delhiManager._id, expectedValue: 100000
            }
        ]);

        // ============ CREATE LEADS - MUMBAI ============

        const mumbaiLeads = await Lead.insertMany([
            {
                firstName: 'Gautam', lastName: 'Shah', email: 'gautam@financeplus.in',
                phone: '+91 98220 11122', company: 'Finance Plus Ltd',
                source: 'website', leadType: 'hot', status: 'negotiation', score: 92,
                branchId: BRANCH_MUM, assignedTo: mumbaiEmp1._id, assignedBy: mumbaiManager._id,
                teamId: mumbaiTeam._id, createdBy: mumbaiManager._id, expectedValue: 300000
            },
            {
                firstName: 'Kavita', lastName: 'Desai', email: 'kavita@meditech.co',
                phone: '+91 99330 44455', company: 'MediTech Solutions',
                source: 'referral', leadType: 'warm', status: 'qualified', score: 72,
                branchId: BRANCH_MUM, assignedTo: mumbaiEmp2._id, assignedBy: mumbaiManager._id,
                teamId: mumbaiTeam._id, createdBy: mumbaiManager._id, expectedValue: 125000
            },
            {
                firstName: 'Nikhil', lastName: 'Rao', email: 'nikhil@retailking.in',
                phone: '+91 88440 55566', company: 'Retail King India',
                source: 'event', leadType: 'cold', status: 'new', score: 35,
                branchId: BRANCH_MUM, createdBy: mumbaiManager._id, expectedValue: 45000
            },
            {
                firstName: 'Pooja', lastName: 'Iyer', email: 'pooja@edutech.co.in',
                phone: '+91 77550 66677', company: 'EduTech Learning',
                source: 'linkedin', leadType: 'hot', status: 'proposal', score: 88,
                branchId: BRANCH_MUM, assignedTo: mumbaiEmp3._id, assignedBy: mumbaiManager._id,
                teamId: mumbaiTeam._id, createdBy: mumbaiManager._id, expectedValue: 180000
            },
            {
                firstName: 'Vishal', lastName: 'Naik', email: 'vishal@logistics.in',
                phone: '+91 66660 77788', company: 'Swift Logistics',
                source: 'website', leadType: 'warm', status: 'contacted', score: 60,
                branchId: BRANCH_MUM, assignedTo: mumbaiEmp1._id, assignedBy: mumbaiManager._id,
                teamId: mumbaiTeam._id, createdBy: mumbaiManager._id, expectedValue: 95000
            }
        ]);

        console.log('📋 Created leads');

        // ============ CREATE DEALS - DELHI ============

        await Deal.insertMany([
            {
                title: 'Enterprise CRM Implementation',
                company: 'Tech Solutions Pvt Ltd', value: 450000, probability: 80,
                stage: 'negotiation', expectedCloseDate: new Date('2026-02-15'),
                owner: delhiEmp1._id, branchId: BRANCH_DEL, createdBy: delhiManager._id
            },
            {
                title: 'Annual Support Contract',
                company: 'Startup India Co', value: 120000, probability: 60,
                stage: 'proposal', expectedCloseDate: new Date('2026-02-28'),
                owner: delhiEmp2._id, branchId: BRANCH_DEL, createdBy: delhiManager._id
            },
            {
                title: 'Custom Integration Project',
                company: 'Innovate Solutions', value: 280000, probability: 90,
                stage: 'closed_won', expectedCloseDate: new Date('2026-01-10'),
                owner: delhiEmp3._id, branchId: BRANCH_DEL, createdBy: delhiManager._id
            },
            {
                title: 'Training & Onboarding',
                company: 'Big Corp India', value: 75000, probability: 40,
                stage: 'qualification', expectedCloseDate: new Date('2026-03-15'),
                owner: delhiEmp1._id, branchId: BRANCH_DEL, createdBy: delhiManager._id
            }
        ]);

        // ============ CREATE DEALS - MUMBAI ============

        await Deal.insertMany([
            {
                title: 'Financial Module Setup',
                company: 'Finance Plus Ltd', value: 520000, probability: 85,
                stage: 'negotiation', expectedCloseDate: new Date('2026-02-20'),
                owner: mumbaiEmp1._id, branchId: BRANCH_MUM, createdBy: mumbaiManager._id
            },
            {
                title: 'Healthcare Platform',
                company: 'MediTech Solutions', value: 350000, probability: 70,
                stage: 'proposal', expectedCloseDate: new Date('2026-03-10'),
                owner: mumbaiEmp2._id, branchId: BRANCH_MUM, createdBy: mumbaiManager._id
            },
            {
                title: 'E-Learning Integration',
                company: 'EduTech Learning', value: 180000, probability: 95,
                stage: 'closed_won', expectedCloseDate: new Date('2026-01-08'),
                owner: mumbaiEmp3._id, branchId: BRANCH_MUM, createdBy: mumbaiManager._id
            },
            {
                title: 'Logistics Automation',
                company: 'Swift Logistics', value: 220000, probability: 50,
                stage: 'qualification', expectedCloseDate: new Date('2026-03-25'),
                owner: mumbaiEmp1._id, branchId: BRANCH_MUM, createdBy: mumbaiManager._id
            }
        ]);

        console.log('💼 Created deals');

        // ============ CREATE CUSTOMERS - DELHI ============

        await Customer.insertMany([
            {
                name: 'Innovate Solutions Pvt Ltd', type: 'company',
                email: 'accounts@innovate.co.in', phone: '+91 11 2345 6789',
                website: 'www.innovate.co.in', industry: 'Technology',
                lifecycle: 'customer', totalDeals: 3, totalRevenue: 580000,
                owner: delhiEmp3._id, branchId: BRANCH_DEL, createdBy: delhiManager._id
            },
            {
                name: 'Delhi Manufacturing Co', type: 'company',
                email: 'info@delhimfg.in', phone: '+91 11 3456 7890',
                website: 'www.delhimfg.in', industry: 'Manufacturing',
                lifecycle: 'customer', totalDeals: 2, totalRevenue: 320000,
                owner: delhiEmp1._id, branchId: BRANCH_DEL, createdBy: delhiManager._id
            },
            {
                name: 'North India Retail', type: 'company',
                email: 'contact@niretail.in', phone: '+91 11 4567 8901',
                industry: 'Retail', lifecycle: 'prospect', totalDeals: 1, totalRevenue: 45000,
                owner: delhiEmp2._id, branchId: BRANCH_DEL, createdBy: delhiManager._id
            }
        ]);

        // ============ CREATE CUSTOMERS - MUMBAI ============

        await Customer.insertMany([
            {
                name: 'Finance Plus Ltd', type: 'company',
                email: 'business@financeplus.in', phone: '+91 22 2345 6789',
                website: 'www.financeplus.in', industry: 'Finance',
                lifecycle: 'customer', totalDeals: 4, totalRevenue: 920000,
                owner: mumbaiEmp1._id, branchId: BRANCH_MUM, createdBy: mumbaiManager._id
            },
            {
                name: 'Western Pharma Corp', type: 'company',
                email: 'sales@westernpharma.co', phone: '+91 22 3456 7890',
                website: 'www.westernpharma.co', industry: 'Healthcare',
                lifecycle: 'customer', totalDeals: 2, totalRevenue: 450000,
                owner: mumbaiEmp2._id, branchId: BRANCH_MUM, createdBy: mumbaiManager._id
            },
            {
                name: 'Mumbai Edutech', type: 'company',
                email: 'info@mumbaiedutech.in', phone: '+91 22 4567 8901',
                website: 'www.mumbaiedutech.in', industry: 'Education',
                lifecycle: 'prospect', totalDeals: 1, totalRevenue: 180000,
                owner: mumbaiEmp3._id, branchId: BRANCH_MUM, createdBy: mumbaiManager._id
            }
        ]);

        console.log('🏢 Created customers');

        // ============ CREATE FOLLOW-UPS - DELHI ============

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        await FollowUp.insertMany([
            {
                title: 'Follow up on CRM proposal',
                type: 'call', contactName: 'Rajesh Agarwal', contactCompany: 'Tech Solutions Pvt Ltd',
                contactEmail: 'rajesh@techsolutions.in', dueDate: today, dueTime: '10:00',
                priority: 'high', status: 'pending', assignedTo: delhiEmp1._id,
                branchId: BRANCH_DEL, createdBy: delhiManager._id,
                notes: 'Discuss pricing and implementation timeline'
            },
            {
                title: 'Send contract documents',
                type: 'email', contactName: 'Deepika Malhotra', contactCompany: 'Innovate Solutions',
                contactEmail: 'deepika@innovate.co.in', dueDate: today, dueTime: '14:00',
                priority: 'high', status: 'pending', assignedTo: delhiEmp3._id,
                branchId: BRANCH_DEL, createdBy: delhiManager._id
            },
            {
                title: 'Demo presentation',
                type: 'meeting', contactName: 'Sunita Kapoor', contactCompany: 'Startup India Co',
                dueDate: tomorrow, dueTime: '11:00', priority: 'medium', status: 'pending',
                assignedTo: delhiEmp2._id, branchId: BRANCH_DEL, createdBy: delhiManager._id,
                notes: 'Prepare demo environment'
            },
            {
                title: 'Check-in call',
                type: 'call', contactName: 'Arun Saxena', contactCompany: 'Big Corp India',
                dueDate: yesterday, dueTime: '15:00', priority: 'low', status: 'overdue',
                assignedTo: delhiEmp1._id, branchId: BRANCH_DEL, createdBy: delhiManager._id
            }
        ]);

        // ============ CREATE FOLLOW-UPS - MUMBAI ============

        await FollowUp.insertMany([
            {
                title: 'Discuss payment terms',
                type: 'call', contactName: 'Gautam Shah', contactCompany: 'Finance Plus Ltd',
                contactEmail: 'gautam@financeplus.in', dueDate: today, dueTime: '11:30',
                priority: 'high', status: 'pending', assignedTo: mumbaiEmp1._id,
                branchId: BRANCH_MUM, createdBy: mumbaiManager._id,
                notes: 'Final negotiation on payment schedule'
            },
            {
                title: 'Send proposal revisions',
                type: 'email', contactName: 'Kavita Desai', contactCompany: 'MediTech Solutions',
                contactEmail: 'kavita@meditech.co', dueDate: today, dueTime: '16:00',
                priority: 'medium', status: 'pending', assignedTo: mumbaiEmp2._id,
                branchId: BRANCH_MUM, createdBy: mumbaiManager._id
            },
            {
                title: 'Product demo',
                type: 'meeting', contactName: 'Pooja Iyer', contactCompany: 'EduTech Learning',
                dueDate: tomorrow, dueTime: '14:00', priority: 'high', status: 'pending',
                assignedTo: mumbaiEmp3._id, branchId: BRANCH_MUM, createdBy: mumbaiManager._id,
                notes: 'Show e-learning integration features'
            },
            {
                title: 'Initial consultation',
                type: 'call', contactName: 'Vishal Naik', contactCompany: 'Swift Logistics',
                dueDate: yesterday, dueTime: '10:00', priority: 'medium', status: 'overdue',
                assignedTo: mumbaiEmp1._id, branchId: BRANCH_MUM, createdBy: mumbaiManager._id
            }
        ]);

        console.log('📅 Created follow-ups');

        // ============ CREATE ACTIVITIES ============

        const activities = [
            // Delhi activities
            {
                type: 'deal_closed', message: 'Deal closed: ₹2,80,000 - Innovate Solutions', entityType: 'deal',
                userId: delhiEmp3._id, branchId: BRANCH_DEL
            },
            {
                type: 'lead_assigned', message: 'Lead assigned to Amit Kumar', entityType: 'lead',
                userId: delhiManager._id, branchId: BRANCH_DEL
            },
            {
                type: 'followup_completed', message: 'Follow-up completed: Tech Solutions call', entityType: 'followup',
                userId: delhiEmp1._id, branchId: BRANCH_DEL
            },
            {
                type: 'lead_created', message: 'New lead from website: Global Tech India', entityType: 'lead',
                userId: delhiManager._id, branchId: BRANCH_DEL
            },
            // Mumbai activities
            {
                type: 'deal_closed', message: 'Deal closed: ₹1,80,000 - EduTech Learning', entityType: 'deal',
                userId: mumbaiEmp3._id, branchId: BRANCH_MUM
            },
            {
                type: 'lead_assigned', message: 'Lead assigned to Rohan Mehta', entityType: 'lead',
                userId: mumbaiManager._id, branchId: BRANCH_MUM
            },
            {
                type: 'customer_added', message: 'New customer: Finance Plus Ltd', entityType: 'customer',
                userId: mumbaiEmp1._id, branchId: BRANCH_MUM
            },
            {
                type: 'lead_created', message: 'New lead from LinkedIn: Retail King India', entityType: 'lead',
                userId: mumbaiManager._id, branchId: BRANCH_MUM
            }
        ];

        await Activity.insertMany(activities);
        console.log('📊 Created activities');

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📧 Login Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Super Admin: admin@crm.com / admin123');
        console.log('Delhi Manager: manager.del@crm.com / manager123');
        console.log('Mumbai Manager: manager.mum@crm.com / manager123');
        console.log('Delhi Employee: employee.del@crm.com / employee123');
        console.log('Mumbai Employee: employee.mum@crm.com / employee123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Seed error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
}

seedDatabase();
