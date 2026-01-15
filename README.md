# Smart Budget

A comprehensive personal finance management application for tracking expenses, income, and managing shared wallets. Built with modern web technologies including Next.js 16, React 19, TypeScript, and Prisma.

## Features

### Core Functionality

- **User Authentication** - Secure registration and login with JWT-based sessions and bcrypt password hashing
- **Wallet Management** - Create and manage multiple wallets with different currencies (USD, EUR, PLN, etc.)
- **Transaction Tracking** - Full CRUD operations for income and expense transactions with categories
- **Category Management** - Create custom categories per wallet for organizing transactions (Income/Expense types)
- **Recurring Transactions** - Set up automatic recurring payments with configurable frequencies (daily, weekly, monthly, yearly)
- **Wallet Sharing** - Share wallets with other users with granular permissions (View/Edit)
- **Financial Reports** - Visual analytics with charts showing spending patterns, category breakdowns, and trends

### Wallet Sharing System

- Invite users by email with VIEW or EDIT permissions
- Invitation workflow with PENDING → ACCEPTED/DECLINED statuses
- Wallet owners can modify permissions or revoke access at any time
- Shared users can leave wallets voluntarily

### Recurring Transaction Automation

- Automatic transaction generation based on schedule
- Configurable cycle parameters (day of month, day of week)
- Balance updates when recurring transactions are processed
- Auto-deactivation when end date is reached

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **UI** | React 19, Tailwind CSS 4, shadcn/ui |
| **API** | tRPC |
| **ORM** | Prisma |
| **Database** | PostgreSQL (Prisma Postgres) |
| **State Management** | TanStack Query |
| **Charts** | Recharts |
| **Authentication** | JWT (jose), bcryptjs |
| **Testing** | Vitest (unit), Playwright (E2E) |
| **Linting** | Biome |
| **Deployment** | Vercel |

## Prerequisites

- **Node.js** 20.x or higher
- **pnpm** (recommended) or npm
- **PostgreSQL** database

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/expense-tracker.git
   cd expense-tracker
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Database connection string
   DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

   # JWT secret for authentication (generate a strong random string)
   JWT_SECRET="your-secure-jwt-secret-key"

   # Optional: Secret for securing the cron endpoint
   CRON_SECRET="your-cron-secret"
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma Client
   pnpm db:generate

   # Push schema to database
   pnpm db:push

   # Optional: Seed the database with sample data
   pnpm db:seed
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

6. **Open the application**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run Biome linter |
| `pnpm lint:fix` | Fix linting issues automatically |
| `pnpm test` | Run unit tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm test:e2e:ui` | Run E2E tests with interactive UI |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:push` | Push schema changes to database |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Prisma Studio for database management |
| `pnpm db:seed` | Seed database with sample data |

## Project Structure

```
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages (login, register)
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── dashboard/       # Main dashboard
│   │   └── wallets/         # Wallet management
│   ├── api/                 # API routes
│   │   ├── cron/           # Cron job endpoints
│   │   └── trpc/           # tRPC API handler
│   ├── globals.css          # Global styles
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── auth/               # Authentication forms
│   ├── categories/         # Category management
│   ├── dashboard/          # Dashboard layout components
│   ├── recurring-transactions/  # Recurring transaction management
│   ├── reports/            # Charts and analytics
│   ├── sharing/            # Wallet sharing dialogs
│   ├── transactions/       # Transaction management
│   ├── ui/                 # shadcn/ui components
│   └── wallets/            # Wallet management
├── hooks/                   # Custom React hooks
├── lib/                     # Utility functions and configurations
│   ├── auth.ts             # Authentication utilities
│   ├── prisma.ts           # Prisma client instance
│   ├── trpc-client.ts      # tRPC client setup
│   ├── trpc-provider.tsx   # tRPC React provider
│   └── wallet-access.ts    # Wallet permission utilities
├── prisma/                  # Database
│   ├── migrations/         # Database migrations
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seeding script
├── server/                  # Backend
│   ├── routers/            # tRPC routers
│   │   ├── _app.ts        # Root router
│   │   ├── auth.ts        # Authentication procedures
│   │   ├── category.ts    # Category procedures
│   │   ├── recurring-transaction.ts
│   │   ├── report.ts      # Reports procedures
│   │   ├── share.ts       # Wallet sharing procedures
│   │   ├── transaction.ts # Transaction procedures
│   │   └── wallet.ts      # Wallet procedures
│   └── trpc.ts             # tRPC context and initialization
├── tests/                   # Test files
│   ├── e2e/                # Playwright E2E tests
│   ├── unit/               # Vitest unit tests
│   └── setup.tsx           # Test setup configuration
└── styles/                  # Additional styles
```

## Database Schema

The application uses PostgreSQL with the following main entities:

- **User** - User accounts with authentication credentials
- **Wallet** - Financial wallets with currency and balance
- **WalletShare** - Wallet sharing with permissions (VIEW/EDIT) and status (PENDING/ACCEPTED/DECLINED)
- **Category** - Transaction categories per wallet (INCOME/EXPENSE types)
- **Transaction** - Individual financial transactions
- **RecurringTransaction** - Recurring payment definitions with frequency settings

## Testing

### Unit Tests (Vitest)

Unit tests cover components, utilities, and business logic.

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### E2E Tests (Playwright)

End-to-end tests verify complete user flows.

```bash
# Run all E2E tests
pnpm test:e2e

# Run with interactive UI
pnpm test:e2e:ui
```

## Recurring Transaction Processing

The application includes an automated system for processing recurring transactions.

### How It Works

1. When a recurring transaction is created, the system calculates the `nextRunAt` date based on frequency and cycle parameters
2. A cron job runs daily to process due recurring transactions
3. For each due transaction, the system:
   - Creates a new transaction linked to the recurring transaction
   - Updates the wallet balance (adds for INCOME, subtracts for EXPENSE)
   - Calculates and sets the next run date
   - Automatically deactivates if the end date has passed

### Cron Job Setup

#### Vercel Deployment

The `vercel.json` file includes cron configuration that runs daily:

```json
{
  "crons": [{
    "path": "/api/cron/process-recurring-transactions",
    "schedule": "0 0 * * *"
  }]
}
```

#### Other Platforms

Call the endpoint manually or via external cron service:

```bash
# Without authentication
curl https://your-domain.com/api/cron/process-recurring-transactions

# With CRON_SECRET configured
curl -H "Authorization: Bearer your-cron-secret" \
  https://your-domain.com/api/cron/process-recurring-transactions
```

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration:

1. **Lint** - Code quality checks with Biome
2. **Type Check** - TypeScript compilation verification
3. **Unit Tests** - Vitest with coverage reporting
4. **E2E Tests** - Playwright tests across multiple browsers
5. **Build** - Next.js production build
6. **Deploy** - Automatic deployment to Vercel (main branch)

### Required Secrets

| Secret | Description |
|--------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `VERCEL_TOKEN` | Vercel deployment token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

## Non-Functional Requirements

- **Performance** - CRUD operations complete in < 1 second
- **Security** - Passwords encrypted with bcrypt, endpoints protected with JWT
- **Scalability** - Serverless architecture (Vercel Functions)
- **Accessibility** - Responsive UI for mobile and desktop
- **UX** - Real-time form validation, intuitive interface

## Out of Scope

The following features are intentionally not included:

- Bank API integrations (PSD2)
- AI-powered categorization or predictions
- Multi-currency conversion in reports
- CSV import/export
- Native mobile applications

## License

This project is private and proprietary.
