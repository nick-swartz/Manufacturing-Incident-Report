import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TimeSeriesDataPoint } from '@incident-system/shared';
import { ChartContainer } from './ChartContainer';

interface TimelineChartProps {
  data: TimeSeriesDataPoint[];
  loading: boolean;
  error?: string | null;
}

export const TimelineChart: React.FC<TimelineChartProps> = ({ data, loading, error }) => {
  const chartData = data.map((item) => ({
    date: item.date,
    count: item.count
  }));

  const isEmpty = !loading && !error && data.length === 0;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <ChartContainer
      title="Incident Timeline"
      description="Incidents over time"
      loading={loading}
      error={error}
    >
      {isEmpty ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} allowDecimals={false} />
            <Tooltip
              labelFormatter={formatDate}
              formatter={(value: number) => [value, 'Incidents']}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              name="Incidents"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: '#2563eb', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
};
