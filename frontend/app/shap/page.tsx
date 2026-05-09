'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/ui/card'
import { mockSHAPData } from '@/lib/mock-data'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function SHAPPage() {
  const data = mockSHAPData.feature_importance
    .map((item) => ({
      ...item,
      impact_percent: Math.round(item.importance * 100),
      color: item.direction === 'increase_risk' ? '#dc2626' : '#22c55e',
    }))
    .sort((a, b) => b.importance - a.importance)

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">SHAP Explainability</h1>
          <p className="text-muted-foreground">
            Understand which code metrics contribute most to risk predictions
          </p>
        </div>

        {/* Feature Importance Chart */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">Feature Importance</h2>
          <ResponsiveContainer width="100%" height={400}>
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
                formatter={(value) => `${(value * 100).toFixed(1)}%`}
              />
              <Bar dataKey="importance" fill="var(--primary)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Contribution Table */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">Detailed Contributions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Feature</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Impact %</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Direction</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.feature} className="border-b border-border hover:bg-card/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{item.feature}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${item.impact_percent}%` }}
                          />
                        </div>
                        <span className="font-bold text-foreground">{item.impact_percent}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          item.direction === 'increase_risk'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {item.direction === 'increase_risk' ? '↑ Increases Risk' : '↓ Decreases Risk'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {item.direction === 'increase_risk'
                        ? 'Higher values indicate higher risk'
                        : 'Higher values indicate lower risk'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Most Influential Feature</p>
            <p className="text-2xl font-bold text-foreground">{data[0].feature}</p>
            <p className="text-xs text-primary mt-2">{data[0].impact_percent}% of impact</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Risk Increasing Factors</p>
            <p className="text-2xl font-bold text-foreground">
              {data.filter((d) => d.direction === 'increase_risk').length}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Features that increase risk</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Explainability Score</p>
            <p className="text-2xl font-bold text-foreground">94%</p>
            <p className="text-xs text-status-low mt-2">Model interpretability</p>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
