import { NextResponse } from 'next/server';
import { processDueRecurringTransactions } from '@/lib/process-recurring-transactions';

/**
 * API route for processing due recurring transactions
 * This should be called by a cron job (e.g., Vercel Cron, external cron service)
 *
 * Security: Protect this endpoint with a secret token in production
 */
export async function GET(request: Request) {
  // Optional: Verify cron secret in production
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const processedCount = await processDueRecurringTransactions();

    return NextResponse.json({
      success: true,
      processedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing recurring transactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * Allow POST as well for cron services that use POST
 */
export const POST = GET;

