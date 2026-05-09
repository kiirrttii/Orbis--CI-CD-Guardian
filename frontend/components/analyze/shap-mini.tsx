'use client'

import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

interface SHAPMiniProps {
  explainability: Array<{
    feature: string
    shap_value: number
    impact_percent: number
    direction: number
  }>
}

export function SHAPMini({ explainability }: SHAPMiniProps) {
  // Map from new array structure
  const data = explainability
    .map((item) => ({
      feature: item.feature,
      impact: Math.round(item.impact_percent * 100),
      direction: item.direction
    }))
    .sort((a, b) => b.impact - a.impact)

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">SHAP Feature Importance</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis type="number" stroke="var(--muted-foreground)" />
          <YAxis dataKey="feature" type="category" width={90} stroke="var(--muted-foreground)" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          />
          <Bar 
            dataKey="impact" 
            radius={[0, 8, 8, 0]} 
            fill="var(--primary)"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.direction > 0 ? '#ef4444' : '#22c55e'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 pt-6 border-t border-border">
        <h4 className="font-medium text-sm text-foreground mb-3">Top Contributing Factors</h4>
        <div className="space-y-2">
          {data.slice(0, 3).map((item, index) => (
            <div key={item.feature} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-sm text-foreground">{item.feature}</span>
              </div>
              <span className={`text-sm font-bold ${item.direction > 0 ? 'text-status-critical' : 'text-status-low'}`}>
                {item.direction > 0 ? '+' : '-'}{item.impact}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
