'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Info, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SHAPMiniProps {
  explainability: Array<{
    feature: string
    shap_value: number
    impact_percent: number
    interpretation: string
    direction: 'increase_risk' | 'decrease_risk'
  }>
}

export function SHAPMini({ explainability }: SHAPMiniProps) {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null)

  // Map from backend structure
  const data = (explainability || [])
    .map((item) => ({
      feature: item.feature,
      impact: item.impact_percent, // Backend already provides 0-100 range
      interpretation: item.interpretation,
      isIncrease: item.direction === 'increase_risk'
    }))
    .sort((a, b) => b.impact - a.impact)

  if (data.length === 0) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground italic">Explainability data unavailable for this prediction.</p>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-card border-border overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Risk Contribution Analysis
          </h3>
          <p className="text-xs text-muted-foreground">Relative influence of code metrics on deployment risk</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-status-critical" />
            <span className="text-[10px] uppercase font-medium text-muted-foreground">Increases Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-status-low" />
            <span className="text-[10px] uppercase font-medium text-muted-foreground">Reduces Risk</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Visualization */}
        <div className="lg:col-span-3 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 20, bottom: 0 }}
              onMouseMove={(state) => {
                if (state.activeLabel) setHoveredFeature(state.activeLabel as string)
              }}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis 
                type="number" 
                domain={[0, 100]} 
                hide 
              />
              <YAxis 
                dataKey="feature" 
                type="category" 
                width={100} 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--foreground)', fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip
                cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-card border border-border p-3 rounded-xl shadow-2xl max-w-[260px] animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-foreground uppercase tracking-wider">{d.feature}</span>
                          <span className={cn(
                            "text-xs font-mono font-black",
                            d.isIncrease ? "text-status-critical" : "text-status-low"
                          )}>
                            {d.isIncrease ? '+' : '-'}{d.impact.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted-foreground italic">
                          "{d.interpretation}"
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="impact" 
                radius={[0, 4, 4, 0]} 
                barSize={24}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isIncrease ? 'var(--status-critical)' : 'var(--status-low)'}
                    fillOpacity={hoveredFeature === entry.feature ? 1 : 0.8}
                    className="transition-all duration-300"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Core Risk Drivers</h4>
          <div className="space-y-3">
            {data.slice(0, 5).map((item, index) => (
              <div 
                key={item.feature} 
                className={cn(
                  "p-3 rounded-xl border transition-all duration-200",
                  hoveredFeature === item.feature 
                    ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10" 
                    : "bg-secondary/30 border-transparent hover:border-border"
                )}
                onMouseEnter={() => setHoveredFeature(item.feature)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold",
                      item.isIncrease ? "bg-status-critical/10 text-status-critical" : "bg-status-low/10 text-status-low"
                    )}>
                      {index + 1}
                    </div>
                    <span className="text-sm font-bold text-foreground">{item.feature}</span>
                  </div>
                  <span className={cn(
                    "text-xs font-mono font-bold",
                    item.isIncrease ? "text-status-critical" : "text-status-low"
                  )}>
                    {item.isIncrease ? '+' : '-'}{item.impact.toFixed(1)}%
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 pl-8">
                  {item.interpretation}
                </p>
              </div>
            ))}
          </div>
          
          <div className="pt-4 flex items-center gap-2 text-muted-foreground">
            <Info className="w-4 h-4" />
            <p className="text-[10px] leading-tight">
              Values calculated using SHAP (SHapley Additive exPlanations). 
              Percentages represent the relative contribution to the final risk score.
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
