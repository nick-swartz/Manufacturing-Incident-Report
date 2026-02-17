import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DistributionData, SEVERITY_COLORS, Severity } from '@incident-system/shared';
import { ChartContainer } from './ChartContainer';

interface SeverityChartProps {
  data: DistributionData[];
  loading: boolean;
  error?: string | null;
}

export const SeverityChart: React.FC<SeverityChartProps> = ({ data, loading, error }) => {
  const COLORS: { [key: string]: string } = {
    CRITICAL: SEVERITY_COLORS[Severity.CRITICAL],
    HIGH: SEVERITY_COLORS[Severity.HIGH],
    MEDIUM: SEVERITY_COLORS[Severity.MEDIUM],
    LOW: SEVERITY_COLORS[Severity.LOW]
  };

  const chartData = data.map((item) => ({
    name: item.label,
    value: item.count,
    percentage: item.percentage
  }));

  const isEmpty = !loading && !error && data.length === 0;

  return (
    <ChartContainer
      title="Severity Distribution"
      description="Breakdown of incidents by severity level"
      loading={loading}
      error={error}
    >
      {isEmpty ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `${value} incidents (${props.payload.percentage.toFixed(1)}%)`,
                name
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
};
