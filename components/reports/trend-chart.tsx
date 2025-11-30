'use client';

import { format } from 'date-fns';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface Props {
  title: string;
  description: string;
  data: Array<{
    date: string;
    income: number;
    expense: number;
    net: number;
  }>;
  interval?: 'daily' | 'weekly' | 'monthly';
}

export function TrendChart({
  title,
  description,
  data,
  interval = 'daily',
}: Props) {
  const chartConfig = {
    income: {
      label: 'Income',
      color: 'hsl(142, 76%, 36%)',
    },
    expense: {
      label: 'Expense',
      color: 'hsl(0, 84%, 60%)',
    },
    net: {
      label: 'Net',
      color: 'hsl(217, 91%, 60%)',
    },
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      if (interval === 'daily') {
        return format(new Date(dateStr), 'MMM d');
      }
      if (interval === 'weekly') {
        const weekStart = dateStr.replace('W', '');
        return format(new Date(weekStart), 'MMM d');
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No data available for this period
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={formatDateLabel}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      `$${Number(value).toFixed(2)}`,
                      chartConfig[name as keyof typeof chartConfig]?.label ||
                        name,
                    ]}
                    labelFormatter={(label) => formatDateLabel(label)}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke={chartConfig.income.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Income"
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke={chartConfig.expense.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Expense"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
