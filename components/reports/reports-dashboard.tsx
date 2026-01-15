'use client';

import type { TransactionType } from '@prisma/client';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { Download, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { downloadCSV, toCSV } from '@/lib/csv-export';
import { trpc } from '@/lib/trpc-client';
import { ComparisonCards } from './comparison-cards';
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
  const defaultCompareStartDate = startOfMonth(subMonths(new Date(), 2));
  const defaultCompareEndDate = endOfMonth(subMonths(new Date(), 1));

  const [startDate, setStartDate] = useState(
    defaultStartDate.toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = useState(
    defaultEndDate.toISOString().split('T')[0],
  );
  const [comparisonMode, setComparisonMode] = useState(false);
  const [compareStartDate, setCompareStartDate] = useState(
    defaultCompareStartDate.toISOString().split('T')[0],
  );
  const [compareEndDate, setCompareEndDate] = useState(
    defaultCompareEndDate.toISOString().split('T')[0],
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

  const { data: comparisonData, isLoading: comparisonLoading } =
    trpc.report.comparePeriods.useQuery(
      {
        walletId,
        currentStart: new Date(startDate),
        currentEnd: new Date(endDate),
        compareStart: new Date(compareStartDate),
        compareEnd: new Date(compareEndDate),
      },
      {
        enabled: comparisonMode,
      },
    );

  const isLoading =
    summaryLoading ||
    incomeLoading ||
    expenseLoading ||
    userLoading ||
    recurringTransactionLoading ||
    trendLoading ||
    (comparisonMode && comparisonLoading);

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

  const exportSummary = useCallback(() => {
    if (!summary) return;

    const data = [
      { metric: 'Total Income', value: summary.income },
      { metric: 'Total Expenses', value: summary.expenses },
      { metric: 'Net Balance', value: summary.net },
      { metric: 'Transaction Count', value: summary.transactionCount },
    ];

    const csv = toCSV(data, [
      { key: 'metric', header: 'Metric' },
      { key: 'value', header: 'Value' },
    ]);

    downloadCSV(csv, `summary_${startDate}_to_${endDate}.csv`);
  }, [summary, startDate, endDate]);

  const exportCategories = useCallback(() => {
    const incomeData =
      incomeByCategory?.map((item) => ({
        type: 'Income',
        category: item.category,
        amount: item.amount,
      })) || [];

    const expenseData =
      expenseByCategory?.map((item) => ({
        type: 'Expense',
        category: item.category,
        amount: item.amount,
      })) || [];

    const data = [...incomeData, ...expenseData];

    const csv = toCSV(data, [
      { key: 'type', header: 'Type' },
      { key: 'category', header: 'Category' },
      { key: 'amount', header: 'Amount' },
    ]);

    downloadCSV(csv, `categories_${startDate}_to_${endDate}.csv`);
  }, [incomeByCategory, expenseByCategory, startDate, endDate]);

  const exportTrends = useCallback(() => {
    if (!trendData) return;

    const csv = toCSV(trendData, [
      { key: 'date', header: 'Date' },
      { key: 'income', header: 'Income' },
      { key: 'expense', header: 'Expense' },
      { key: 'net', header: 'Net' },
    ]);

    downloadCSV(csv, `trends_${trendInterval}_${startDate}_to_${endDate}.csv`);
  }, [trendData, trendInterval, startDate, endDate]);

  const exportAll = useCallback(() => {
    // Create a comprehensive report with all sections
    let csvContent = '';

    // Summary section
    csvContent += 'SUMMARY\n';
    if (summary) {
      csvContent += `Metric,Value\n`;
      csvContent += `Total Income,${summary.income}\n`;
      csvContent += `Total Expenses,${summary.expenses}\n`;
      csvContent += `Net Balance,${summary.net}\n`;
      csvContent += `Transaction Count,${summary.transactionCount}\n`;
    }
    csvContent += '\n';

    // Categories section
    csvContent += 'INCOME BY CATEGORY\n';
    csvContent += 'Category,Amount\n';
    incomeByCategory?.forEach((item) => {
      csvContent += `${item.category},${item.amount}\n`;
    });
    csvContent += '\n';

    csvContent += 'EXPENSES BY CATEGORY\n';
    csvContent += 'Category,Amount\n';
    expenseByCategory?.forEach((item) => {
      csvContent += `${item.category},${item.amount}\n`;
    });
    csvContent += '\n';

    // Trends section
    csvContent += `TRENDS (${trendInterval.toUpperCase()})\n`;
    csvContent += 'Date,Income,Expense,Net\n';
    trendData?.forEach((item) => {
      csvContent += `${item.date},${item.income},${item.expense},${item.net}\n`;
    });

    downloadCSV(csvContent, `full_report_${startDate}_to_${endDate}.csv`);
  }, [
    summary,
    incomeByCategory,
    expenseByCategory,
    trendData,
    trendInterval,
    startDate,
    endDate,
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle>Date Range</CardTitle>
            <CardDescription>
              Select the period for your financial report
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                <Download className="mr-2 size-4" />
                Export CSV
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportAll}>
                Full Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportSummary}>
                Summary Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportCategories}>
                Categories
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportTrends}>
                Trends
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <div className="flex items-center space-x-2">
            <Switch
              id="comparison-mode"
              checked={comparisonMode}
              onCheckedChange={setComparisonMode}
            />
            <Label htmlFor="comparison-mode">
              Compare with another period
            </Label>
          </div>

          {comparisonMode && (
            <div className="grid gap-4 rounded-lg border bg-muted/50 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="compareStartDate">Comparison Start Date</Label>
                <Input
                  id="compareStartDate"
                  type="date"
                  value={compareStartDate}
                  onChange={(e) => setCompareStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compareEndDate">Comparison End Date</Label>
                <Input
                  id="compareEndDate"
                  type="date"
                  value={compareEndDate}
                  onChange={(e) => setCompareEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {comparisonMode && comparisonData ? (
            <ComparisonCards
              current={comparisonData.current}
              compare={comparisonData.compare}
              changes={comparisonData.changes}
            />
          ) : (
            <SummaryCards summary={summary} />
          )}

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
        </>
      )}
    </div>
  );
}