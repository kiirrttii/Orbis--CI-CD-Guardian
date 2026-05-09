'use client'

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'

interface RiskGaugeProps {
  score: number
  severity: string
}

export function RiskGauge({ score, severity }: RiskGaugeProps) {
  // Create a semi-circle gauge using pie chart
  const data = [
    { name: 'Risk', value: score },
    { name: 'Safe', value: 100 - score },
  ]

  const getColor = (severity: string): string => {
    switch (severity) {
      case 'CRITICAL':
        return '#dc2626'
      case 'HIGH':
        return '#f97316'
      case 'MEDIUM':
        return '#eab308'
      case 'LOW':
        return '#22c55e'
      default:
        return '#3b82f6'
    }
  }

  const riskColor = getColor(severity)

  return (
    <div className="flex flex-col items-center">
      <div className="w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              startAngle={180}
              endAngle={0}
              dataKey="value"
            >
              <Cell fill={riskColor} />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-4">
        <p className="text-4xl font-bold text-foreground">{score}</p>
        <p className="text-muted-foreground text-sm">Risk Score</p>
      </div>
    </div>
  )
}
