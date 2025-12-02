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
import { SubscriptionChart } from './subscription-chart';
import { SummaryCards } from './summary-cards';
import { TrendChart } from './trend-chart';

interface Props {
  accountId: string;
}

export function ReportsDashboard({ accountId }: Props) {
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
      accountId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

  const { data: incomeByCategory, isLoading: incomeLoading } =
    trpc.report.byCategory.useQuery({
      accountId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type: 'INCOME' as TransactionType,
    });

  const { data: expenseByCategory, isLoading: expenseLoading } =
    trpc.report.byCategory.useQuery({
      accountId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type: 'EXPENSE' as TransactionType,
    });

  const { data: userData, isLoading: userLoading } =
    trpc.report.byUser.useQuery({
      accountId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

  const { data: subscriptionData, isLoading: subscriptionLoading } =
    trpc.report.bySubscription.useQuery({
      accountId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

  const { data: trendData, isLoading: trendLoading } =
    trpc.report.trends.useQuery({
      accountId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      interval: trendInterval,
    });

  const isLoading =
    summaryLoading ||
    incomeLoading ||
    expenseLoading ||
    userLoading ||
    subscriptionLoading ||
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

          {/* <div className="grid gap-6 md:grid-cols-2">
            <CategoryChart
              title="Income by Category"
              description="Breakdown of your income sources"
              data={incomeByCategory || []}
              type="INCOME"
            />
            <CategoryChart
              title="Expenses by Category"
              description="Breakdown of your spending"
              data={expenseByCategory || []}
              type="EXPENSE"
            />
          </div> */}

          {userData && userData.length > 1 && (
            <MemberChart
              title="Spending by Member"
              description="Income and expenses breakdown by wallet members"
              data={userData}
            />
          )}

          {subscriptionData && subscriptionData.length > 0 && (
            <SubscriptionChart
              title="Subscription Spending"
              description="Total spending on recurring transactions"
              data={subscriptionData}
            />
          )}

          {/* {summary && Object.keys(summary.categoryBreakdown).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
                <CardDescription>
                  Detailed breakdown by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(summary.categoryBreakdown).map(
                    ([category, data]) => (
                      <div
                        key={category}
                        className="flex items-center justify-between border-b pb-3 last:border-0"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{category}</p>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            {data.income > 0 && (
                              <span className="flex items-center gap-1 text-green-600">
                                <TrendingUp className="h-3 w-3" />
                                Income: ${data.income.toFixed(2)}
                              </span>
                            )}
                            {data.expense > 0 && (
                              <span className="flex items-center gap-1 text-red-600">
                                <TrendingDown className="h-3 w-3" />
                                Expense: ${data.expense.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${Math.abs(data.income - data.expense).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {data.income > data.expense
                              ? 'Net Income'
                              : 'Net Expense'}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )} */}
        </>
      )}
    </div>
  );
}
