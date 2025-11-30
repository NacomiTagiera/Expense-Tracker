# Smart Budget - Expense Tracker

A comprehensive expense tracking application built with Next.js 15, React 19, TypeScript, and Prisma.

## Features

- User authentication with JWT
- Multi-account support (up to 3 accounts per user)
- Transaction management (income/expense)
- Recurring subscriptions with automatic payment processing
- Account sharing with permissions
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
- Account management testing

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
│   ├── accounts/        # Account management
│   ├── auth/            # Authentication
│   ├── dashboard/       # Dashboard layout
│   ├── reports/         # Financial reports
│   ├── sharing/         # Account sharing
│   ├── subscriptions/   # Subscription management
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

## Subscription Auto-Payment

The application includes an automated subscription payment system that processes recurring subscriptions and automatically:

- Creates expense transactions when subscriptions are due
- Updates account balances by subtracting the subscription amount
- Schedules the next payment date based on subscription frequency (daily, weekly, monthly, yearly)

### How It Works

1. When a subscription is created or updated, the system calculates the `nextRunAt` date based on the frequency
2. A cron job runs hourly (configured in `vercel.json`) to check for due subscriptions
3. The cron endpoint (`/api/cron/process-subscriptions`) processes all subscriptions where `nextRunAt <= now`
4. For each due subscription, it:
   - Creates an EXPENSE transaction linked to the subscription
   - Updates the account balance (decrements by subscription amount)
   - Updates `lastRunAt` and calculates the next `nextRunAt` date
   - Automatically deactivates subscriptions that have passed their `endDate`

### Setting Up Cron Jobs

#### For Vercel Deployments

The `vercel.json` file is already configured with a cron schedule that runs hourly. Vercel will automatically trigger the endpoint.

#### For Other Platforms

You can use any cron service (e.g., GitHub Actions, external cron services) to call:
\`\`\`
GET/POST https://your-domain.com/api/cron/process-subscriptions
\`\`\`

If you set the `CRON_SECRET` environment variable, include it in the Authorization header:
\`\`\`
Authorization: Bearer your-cron-secret
\`\`\`

### Manual Testing

You can manually trigger subscription processing by calling the endpoint:
\`\`\`bash
curl -X GET https://your-domain.com/api/cron/process-subscriptions
\`\`\`


