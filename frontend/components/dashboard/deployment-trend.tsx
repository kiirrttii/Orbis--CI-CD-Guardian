'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { DeploymentHistory } from '@/lib/api-types'

interface DeploymentTrendProps {
  data: DeploymentHistory[]
}

export function DeploymentTrend({ data }: DeploymentTrendProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <Card className="p-6 h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading trend data...</p>
      </Card>
    )
  }

  // Group by date and calculate average risk score
  const byDate = data.reduce(
    (acc, item) => {
      const date = new Date(item.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      if (!acc[date]) {
        acc[date] = { date, scores: [], count: 0 }
      }
      acc[date].scores.push(item.risk_score)
      acc[date].count++
      return acc
    },
    {} as Record<string, { date: string; scores: number[]; count: number }>
  )

  const chartData = Object.values(byDate)
    .map((d) => ({
      date: d.date,
      avgRisk: Math.round(d.scores.reduce((a, b) => a + b) / d.scores.length),
      count: d.count,
    }))
    .slice(-7)

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Deployment Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" stroke="var(--muted-foreground)" />
          <YAxis stroke="var(--muted-foreground)" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="avgRisk"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ fill: 'var(--primary)', r: 4 }}
            activeDot={{ r: 6 }}
            name="Avg Risk Score"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
