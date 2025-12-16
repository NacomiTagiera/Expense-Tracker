'use client';

import type { TransactionType } from '@prisma/client';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc-client';
import { CategoryChart } from './category-chart';
import { MemberChart } from './member-chart';
import { PieChart } from './pie-chart';
import { RecurringTransactionChart } from './recurring-transaction-chart';
import { SummaryCards } from './summary-cards';
import { TrendChart } from './trend-chart';

interface Props {
  walletId: string;
}

export function ReportsDashboard({ walletId }: Props) {
  const defaultStartDate = startOfMonth(subMonths(new Date(), 1));
  const defaultEndDate = endOfMonth(new Date());

  const [startDate, setStartDate] = useState(
    defaultStartDate.toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = useState(
    defaultEndDate.toISOString().split('T')[0],
  );
  const [trendInterval, setTrendInterval] = useState<
    'daily' | 'weekly' | 'monthly'
  >('daily');

  const { data: summary, isLoading: summaryLoading } =
    trpc.report.summary.useQuery({
      walletId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

  const { data: incomeByCategory, isLoading: incomeLoading } =
    trpc.report.byCategory.useQuery({
      walletId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type: 'INCOME' as TransactionType,
    });

  const { data: expenseByCategory, isLoading: expenseLoading } =
    trpc.report.byCategory.useQuery({
      walletId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type: 'EXPENSE' as TransactionType,
    });

  const { data: userData, isLoading: userLoading } =
    trpc.report.byUser.useQuery({
      walletId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

  const { data: recurringTransactionData, isLoading: recurringTransactionLoading } =
    trpc.report.byRecurringTransaction.useQuery({
      walletId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

  const { data: trendData, isLoading: trendLoading } =
    trpc.report.trends.useQuery({
      walletId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      interval: trendInterval,
    });

  const isLoading =
    summaryLoading ||
    incomeLoading ||
    expenseLoading ||
    userLoading ||
    recurringTransactionLoading ||
    trendLoading;

  const incomePieData =
    incomeByCategory?.map((item) => ({
      name: item.category,
      value: item.amount,
    })) || [];

  const expensePieData =
    expenseByCategory?.map((item) => ({
      name: item.category,
      value: item.amount,
    })) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
          <CardDescription>
            Select the period for your financial report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trendInterval">Trend Interval</Label>
              <Select
                value={trendInterval}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                  setTrendInterval(value)
                }
              >
                <SelectTrigger id="trendInterval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <SummaryCards summary={summary} />

          <TrendChart
            title="Income & Expense Trends"
            description={`${trendInterval.charAt(0).toUpperCase() + trendInterval.slice(1)} trends over time`}
            data={trendData || []}
            interval={trendInterval}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <PieChart
              title="Income Distribution"
              description="Percentage breakdown of income by category"
              data={incomePieData}
            />
            <PieChart
              title="Expense Distribution"
              description="Percentage breakdown of expenses by category"
              data={expensePieData}
            />
          </div>

          {userData && userData.length > 1 && (
            <MemberChart
              title="Spending by Member"
              description="Income and expenses breakdown by wallet members"
              data={userData}
            />
          )}

          {recurringTransactionData && recurringTransactionData.length > 0 && (
            <RecurringTransactionChart
              title="Recurring Transaction Spending"
              description="Total spending on recurring transactions"
              data={recurringTransactionData}
            />
          )}
        </>
      )}
    </div>
  );
}
