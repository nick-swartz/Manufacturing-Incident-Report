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

  // Calculate statistics for aria-label
  const totalIncidents = chartData.reduce((sum, item) => sum + item.count, 0);
  const avgIncidents = chartData.length > 0 ? (totalIncidents / chartData.length).toFixed(1) : 0;
  const maxIncidents = chartData.length > 0 ? Math.max(...chartData.map(d => d.count)) : 0;

  const chartSummary = chartData.length > 0
    ? `Line chart showing incident timeline from ${formatDate(chartData[0].date)} to ${formatDate(chartData[chartData.length - 1].date)}. Total: ${totalIncidents} incidents, Average: ${avgIncidents} per day, Peak: ${maxIncidents} incidents`
    : 'Line chart showing incident timeline';

  return (
    <ChartContainer
      title="Incident Timeline"
      description="Incidents over time"
      loading={loading}
      error={error}
    >
      {isEmpty ? (
        <div className="flex items-center justify-center h-64 text-text-muted">
          No data available
        </div>
      ) : (
        <figure role="img" aria-label={chartSummary}>
          <figcaption className="sr-only">
            {chartSummary}
          </figcaption>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                className="stroke-foreground-muted"
                style={{ fontSize: '12px' }}
              />
              <YAxis className="stroke-foreground-muted" style={{ fontSize: '12px' }} allowDecimals={false} />
              <Tooltip
                labelFormatter={formatDate}
                formatter={(value: number) => [value, 'Incidents']}
                contentStyle={{
                  backgroundColor: 'var(--color-background-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  color: 'var(--color-foreground)'
                }}
                labelStyle={{
                  color: 'var(--color-foreground)'
                }}
                itemStyle={{
                  color: 'var(--color-foreground)'
                }}
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

          {/* Screen reader accessible data table */}
          <table className="sr-only">
            <caption>Incident Timeline Data</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Number of Incidents</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((item, index) => (
                <tr key={index}>
                  <th scope="row">{formatDate(item.date)}</th>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      )}
    </ChartContainer>
  );
};
