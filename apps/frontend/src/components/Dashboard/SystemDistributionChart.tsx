import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DistributionData } from '@incident-system/shared';
import { ChartContainer } from './ChartContainer';

interface SystemDistributionChartProps {
  data: DistributionData[];
  loading: boolean;
  error?: string | null;
}

export const SystemDistributionChart: React.FC<SystemDistributionChartProps> = ({ data, loading, error }) => {
  const chartData = data.map((item) => ({
    system: item.label,
    count: item.count,
    percentage: item.percentage
  }));

  const isEmpty = !loading && !error && data.length === 0;

  return (
    <ChartContainer
      title="System Distribution"
      description="Incidents by affected system"
      loading={loading}
      error={error}
    >
      {isEmpty ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="system"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              width={90}
            />
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `${value} incidents (${props.payload.percentage.toFixed(1)}%)`,
                'Count'
              ]}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px' }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#2563eb" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
};
