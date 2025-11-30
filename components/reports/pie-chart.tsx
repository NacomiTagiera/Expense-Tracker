'use client';

import {
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
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
  data: Array<{ name: string; value: number }>;
  colors?: string[];
}

const DEFAULT_COLORS = [
  'hsl(142, 76%, 36%)',
  'hsl(217, 91%, 60%)',
  'hsl(280, 78%, 41%)',
  'hsl(24, 95%, 53%)',
  'hsl(199, 89%, 48%)',
  'hsl(0, 84%, 60%)',
  'hsl(47, 96%, 53%)',
  'hsl(142, 71%, 45%)',
  'hsl(262, 83%, 58%)',
  'hsl(346, 77%, 50%)',
];

export function PieChart({
  title,
  description,
  data,
  colors = DEFAULT_COLORS,
}: Props) {
  const chartConfig = data.reduce(
    (acc, item, index) => {
      acc[item.name] = {
        label: item.name,
        color: colors[index % colors.length]!,
      };
      return acc;
    },
    {} as Record<string, { label: string; color: string }>,
  );

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

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ percent }) =>
                  percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                }
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                  />
                }
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.map((item, index) => {
            const color = colors[index % colors.length];
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div
                key={item.name}
                className="flex items-center gap-3 rounded-lg border p-2"
              >
                <div
                  className="h-4 w-4 shrink-0 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}% • ${item.value.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
