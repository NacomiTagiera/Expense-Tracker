# Smart Budget - Expense Tracker

A comprehensive expense tracking application built with Next.js 15, React 19, TypeScript, and Prisma.

## Features

- User authentication with JWT
- Multi-wallet support (up to 3 wallets per user)
- Transaction management (income/expense)
- Recurring transactions with automatic payment processing
- Wallet sharing with permissions
- Financial reports and analytics
- Clean Architecture with tRPC

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: tRPC, Prisma, PostgreSQL (Neon)
- **State Management**: TanStack Query
- **Testing**: Vitest, Playwright
- **Linting**: Biome
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon recommended)

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   \`\`\`env
   DATABASE_URL="your-postgresql-connection-string"
   JWT_SECRET="your-secret-key"
   CRON_SECRET="optional-secret-for-cron-endpoint-security"
   \`\`\`

4. Push the database schema:
   \`\`\`bash
   npm run db:push
   \`\`\`

5. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

6. Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run Biome linter
- `npm run lint:fix` - Fix linting issues
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run test:e2e` - Run E2E tests
- `npm run test:e2e:ui` - Run E2E tests with UI
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:generate` - Generate Prisma Client

## Testing

The project uses Test-Driven Development (TDD) principles:

### Unit Tests (Vitest)
- Component testing with React Testing Library
- Utility function testing
- Authentication logic testing

Run unit tests:
\`\`\`bash
npm test
\`\`\`

Run with coverage:
\`\`\`bash
npm run test:coverage
\`\`\`

### E2E Tests (Playwright)
- Authentication flow testing
- Dashboard navigation testing
- Wallet management testing

Run E2E tests:
\`\`\`bash
npm run test:e2e
\`\`\`

Run with UI mode:
\`\`\`bash
npm run test:e2e:ui
\`\`\`

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

### Pipeline Stages
1. **Lint** - Code quality checks with Biome
2. **Type Check** - TypeScript compilation
3. **Unit Tests** - Vitest with coverage reporting
4. **E2E Tests** - Playwright across multiple browsers
5. **Build** - Next.js production build
6. **Deploy** - Automatic deployment to Vercel (main branch)

### Required Secrets
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## Project Structure

\`\`\`
├── app/                  # Next.js app directory
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Dashboard pages
│   └── api/             # API routes
├── components/          # React components
│   ├── wallets/         # Wallet management
│   ├── auth/            # Authentication
│   ├── dashboard/       # Dashboard layout
│   ├── reports/         # Financial reports
│   ├── sharing/         # Wallet sharing
│   ├── recurring-transactions/  # Recurring transaction management
│   ├── transactions/    # Transaction management
│   └── ui/              # UI components
├── lib/                 # Utility functions
├── prisma/              # Database schema
├── server/              # tRPC routers and procedures
├── tests/               # Test files
│   ├── unit/           # Unit tests
│   └── e2e/            # E2E tests
└── public/              # Static assets
\`\`\`

## Recurring Transaction Auto-Payment

The application includes an automated recurring transaction payment system that processes recurring transactions and automatically:

- Creates transactions when recurring payments are due
- Updates wallet balances by adding/subtracting the amount based on transaction type
- Schedules the next payment date based on frequency (daily, weekly, monthly, yearly)

### How It Works

1. When a recurring transaction is created or updated, the system calculates the `nextRunAt` date based on the frequency
2. A cron job runs daily (configured in `vercel.json`) to check for due recurring transactions
3. The cron endpoint (`/api/cron/process-recurring-transactions`) processes all recurring transactions where `nextRunAt <= now`
4. For each due recurring transaction, it:
   - Creates a transaction linked to the recurring transaction
   - Updates the wallet balance (increments for INCOME, decrements for EXPENSE)
   - Updates `lastRunAt` and calculates the next `nextRunAt` date
   - Automatically deactivates recurring transactions that have passed their `endDate`

### Setting Up Cron Jobs

#### For Vercel Deployments

The `vercel.json` file is already configured with a cron schedule that runs daily. Vercel will automatically trigger the endpoint.

#### For Other Platforms

You can use any cron service (e.g., GitHub Actions, external cron services) to call:
\`\`\`
GET/POST https://your-domain.com/api/cron/process-recurring-transactions
\`\`\`

If you set the `CRON_SECRET` environment variable, include it in the Authorization header:
\`\`\`
Authorization: Bearer your-cron-secret
\`\`\`

### Manual Testing

You can manually trigger recurring transaction processing by calling the endpoint:
\`\`\`bash
curl -X GET https://your-domain.com/api/cron/process-recurring-transactions
\`\`\`
