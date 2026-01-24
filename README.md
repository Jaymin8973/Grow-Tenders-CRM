# Sales CRM Application

A comprehensive, full-stack Sales CRM application built with Next.js, NestJS, and MongoDB.

## Features

### Core CRM Features
- **Lead Management**: Track and manage sales leads through the entire sales funnel
- **Customer Management**: Maintain customer relationships and lifecycle stages
- **Deal Pipeline**: Visual kanban-style deal tracking with multiple stages
- **Activity Management**: Schedule and track calls, meetings, tasks, and follow-ups
- **Leaderboard**: Gamified performance tracking for sales teams

### Administrative Features
- **Invoice Management**: Create, send, and track customer invoices
- **Tender Management**: Manage government and business tenders
- **Reports & Analytics**: Sales performance, pipeline, and productivity reports
- **User Management**: Role-based access control (Admin, Manager, Employee)

### Role-Based Access Control (RBAC)
- **Super Admin**: Full access to all features and data
- **Manager**: Access to team data, reports, and assignments
- **Employee**: Access to assigned leads, customers, and activities

## Tech Stack

### Backend
- **Runtime**: Node.js with NestJS (TypeScript)
- **Database**: MongoDB with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **API Documentation**: Swagger/OpenAPI
- **Queue**: Redis with BullMQ
- **Email**: Nodemailer with SendGrid support
- **Storage**: AWS S3 for file uploads

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: TanStack React Query
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts

## Project Structure

```
sales-crm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Database seeder
│   ├── src/
│   │   ├── common/            # Shared guards, decorators
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/          # Authentication
│   │   │   ├── users/         # User management
│   │   │   ├── leads/         # Lead management
│   │   │   ├── customers/     # Customer management
│   │   │   ├── deals/         # Deal/pipeline management
│   │   │   ├── activities/    # Activity/task management
│   │   │   ├── invoices/      # Invoice management
│   │   │   ├── tenders/       # Tender management
│   │   │   ├── leaderboard/   # Performance leaderboard
│   │   │   ├── reports/       # Analytics & reports
│   │   │   ├── notifications/ # User notifications
│   │   │   ├── audit-logs/    # Audit trail
│   │   │   ├── email/         # Email service
│   │   │   └── storage/       # File storage
│   │   ├── prisma/            # Prisma service
│   │   ├── app.module.ts      # Root module
│   │   └── main.ts            # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js app router pages
│   │   │   ├── (dashboard)/   # Protected dashboard routes
│   │   │   └── login/         # Login page
│   │   ├── components/        # React components
│   │   │   ├── layout/        # Layout components
│   │   │   └── ui/            # shadcn/ui components
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom hooks
│   │   └── lib/               # Utilities
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional, for queues)

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```

4. Update environment variables:
   ```env
   DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/salescrm"
   JWT_SECRET="your-jwt-secret"
   JWT_REFRESH_SECRET="your-refresh-secret"
   ```

5. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

6. Push database schema:
   ```bash
   npx prisma db push
   ```

7. Seed the database:
   ```bash
   npx ts-node prisma/seed.ts
   ```

8. Start the development server:
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3001/api`
Swagger docs at `http://localhost:3001/docs`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## Demo Accounts

After running the seed script, you can log in with these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin@123 |
| Manager | manager@example.com | Manager@123 |
| Employee | employee@example.com | Employee@123 |

## API Documentation

The API documentation is available via Swagger UI at `/docs` when the backend is running.

### Main API Endpoints

| Module | Endpoint | Description |
|--------|----------|-------------|
| Auth | POST /api/auth/login | User login |
| Auth | POST /api/auth/refresh | Refresh tokens |
| Users | GET /api/users | List users |
| Leads | GET /api/leads | List leads |
| Leads | POST /api/leads | Create lead |
| Customers | GET /api/customers | List customers |
| Deals | GET /api/deals | List deals |
| Deals | GET /api/deals/pipeline | Pipeline view |
| Activities | GET /api/activities | List activities |
| Activities | GET /api/activities/today | Today's activities |
| Invoices | GET /api/invoices | List invoices |
| Reports | GET /api/reports/dashboard | Dashboard stats |
| Leaderboard | GET /api/leaderboard/global | Global rankings |

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="mongodb+srv://..."

# JWT
JWT_SECRET="your-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Redis (optional)
REDIS_HOST="localhost"
REDIS_PORT="6379"

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET=""
AWS_REGION="us-east-1"

# Email (optional)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM=""

# App
PORT=3001
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## License

MIT License
