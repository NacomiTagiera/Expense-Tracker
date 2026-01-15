'use client';

import {
  ArrowDown,
  ArrowUp,
  DollarSign,
  Minus,
  Receipt,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PeriodData {
  income: number;
  expenses: number;
  net: number;
  transactionCount: number;
}

interface Props {
  current: PeriodData;
  compare: PeriodData;
  changes: {
    income: number;
    expenses: number;
    net: number;
    transactionCount: number;
  };
}

function ChangeIndicator({
  change,
  inverted = false,
}: {
  change: number;
  inverted?: boolean;
}) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  // For expenses, positive change (spending more) is bad, negative is good
  const isGood = inverted ? isNegative : isPositive;
  const isBad = inverted ? isPositive : isNegative;

  const colorClass = isGood
    ? 'text-green-600'
    : isBad
      ? 'text-red-600'
      : 'text-muted-foreground';

  const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : Minus;

  return (
    <div className={`flex items-center gap-1 text-sm font-medium ${colorClass}`}>
      <Icon className="size-4" />
      <span>{isNeutral ? '0%' : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`}</span>
    </div>
  );
}

function ComparisonValue({
  current,
  compare,
  prefix = '$',
}: {
  current: number;
  compare: number;
  prefix?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="text-2xl font-bold">
        {prefix}
        {current.toFixed(prefix === '$' ? 2 : 0)}
      </div>
      <div className="text-xs text-muted-foreground">
        vs {prefix}
        {compare.toFixed(prefix === '$' ? 2 : 0)}
      </div>
    </div>
  );
}

export function ComparisonCards({ current, compare, changes }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <TrendingUp className="size-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <ComparisonValue current={current.income} compare={compare.income} />
            <ChangeIndicator change={changes.income} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <TrendingDown className="size-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <ComparisonValue
              current={current.expenses}
              compare={compare.expenses}
            />
            <ChangeIndicator change={changes.expenses} inverted />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          <DollarSign className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <div
                className={`text-2xl font-bold ${current.net >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {current.net >= 0 ? '+' : ''}${current.net.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                vs {compare.net >= 0 ? '+' : ''}${compare.net.toFixed(2)}
              </div>
            </div>
            <ChangeIndicator change={changes.net} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          <Receipt className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <ComparisonValue
              current={current.transactionCount}
              compare={compare.transactionCount}
              prefix=""
            />
            <ChangeIndicator change={changes.transactionCount} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
