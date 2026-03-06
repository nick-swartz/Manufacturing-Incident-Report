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

  // Calculate top systems for aria-label
  const topSystems = chartData.slice(0, 3).map(d => `${d.system} (${d.count} incidents)`).join(', ');
  const chartSummary = chartData.length > 0
    ? `Horizontal bar chart showing incident distribution across ${chartData.length} systems. Top systems: ${topSystems}`
    : 'Horizontal bar chart showing incident distribution by system';

  return (
    <ChartContainer
      title="System Distribution"
      description="Incidents by affected system"
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

          <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 50)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis type="number" style={{ fontSize: '12px', fill: 'rgb(var(--color-foreground-secondary))' }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="system"
                style={{ fontSize: '13px', fill: 'rgb(var(--color-foreground-secondary))' }}
                width={180}
                tick={{ fill: 'rgb(var(--color-foreground-secondary))' }}
              />
              <Tooltip
                formatter={(value: number, name: string, props: any) => [
                  `${value} incidents (${props.payload.percentage.toFixed(1)}%)`,
                  'Count'
                ]}
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
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#2563eb" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Screen reader accessible data table */}
          <table className="sr-only">
            <caption>System Distribution Data</caption>
            <thead>
              <tr>
                <th scope="col">System</th>
                <th scope="col">Number of Incidents</th>
                <th scope="col">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((item) => (
                <tr key={item.system}>
                  <th scope="row">{item.system}</th>
                  <td>{item.count}</td>
                  <td>{item.percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      )}
    </ChartContainer>
  );
};
