'use client'

import { Card } from '@/components/ui/card'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import type { DeploymentHistory } from '@/lib/api-types'

interface RiskDistributionProps {
  data: DeploymentHistory[]
}

export function RiskDistribution({ data }: RiskDistributionProps) {
  const severity_counts = {
    CRITICAL: data.filter((d) => d.severity === 'CRITICAL').length,
    HIGH: data.filter((d) => d.severity === 'HIGH').length,
    MEDIUM: data.filter((d) => d.severity === 'MEDIUM').length,
    LOW: data.filter((d) => d.severity === 'LOW').length,
  }

  const chartData = [
    { name: 'Critical', value: severity_counts.CRITICAL, fill: '#dc2626' },
    { name: 'High', value: severity_counts.HIGH, fill: '#f97316' },
    { name: 'Medium', value: severity_counts.MEDIUM, fill: '#eab308' },
    { name: 'Low', value: severity_counts.LOW, fill: '#22c55e' },
  ].filter((d) => d.value > 0)

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Risk Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}
