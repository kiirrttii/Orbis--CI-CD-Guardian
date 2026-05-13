'use client'

import { Card } from '@/components/ui/card'
import type { RiskDimensionsPayload, RiskDimensionResult } from '@/lib/api-types'
import { ShieldAlert, Wrench, Layers, Info, CircleDot } from 'lucide-react'

interface RiskDimensionsPanelProps {
  riskDimensions: RiskDimensionsPayload
}

// ── Grade config ─────────────────────────────────────────────────────────────

const GRADE_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  A: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    label: 'Very Low',
  },
  B: {
    bg: 'bg-teal-500/10 dark:bg-teal-500/15',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-500/30',
    label: 'Low',
  },
  C: {
    bg: 'bg-yellow-500/10 dark:bg-yellow-500/15',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-500/30',
    label: 'Moderate',
  },
  D: {
    bg: 'bg-orange-500/10 dark:bg-orange-500/15',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/30',
    label: 'High',
  },
  E: {
    bg: 'bg-red-500/10 dark:bg-red-500/15',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/30',
    label: 'Critical',
  },
}

function getGradeConfig(grade: string) {
  return GRADE_CONFIG[grade] ?? GRADE_CONFIG['C']!
}

// ── Confidence badge config ───────────────────────────────────────────────────

const CONFIDENCE_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  HIGH:   { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
  MEDIUM: { bg: 'bg-yellow-500/10',  text: 'text-yellow-600 dark:text-yellow-400',   border: 'border-yellow-500/30'  },
  LOW:    { bg: 'bg-slate-500/10',   text: 'text-slate-500 dark:text-slate-400',      border: 'border-slate-500/30'   },
}

function ConfidenceBadge({ confidence }: { confidence?: string }) {
  if (!confidence) return null
  const cfg = CONFIDENCE_CONFIG[confidence] ?? CONFIDENCE_CONFIG['MEDIUM']!
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold
        ${cfg.bg} ${cfg.text} ${cfg.border}
      `}
      title="Heuristic confidence — based on feature completeness, not ML probability"
    >
      <CircleDot className="w-2.5 h-2.5" />
      {confidence} confidence
    </span>
  )
}

// ── Score bar ─────────────────────────────────────────────────────────────────

const BAR_COLORS: Record<string, string> = {
  A: 'bg-emerald-500',
  B: 'bg-teal-500',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-500',
}

function ScoreBar({ score, grade }: { score: number; grade: string }) {
  const barColor = BAR_COLORS[grade] ?? 'bg-yellow-500'
  return (
    <div className="w-full h-1.5 rounded-full bg-muted/50 overflow-hidden mt-2">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
        style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
      />
    </div>
  )
}

// ── Single dimension card ─────────────────────────────────────────────────────

interface DimensionCardProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  result: RiskDimensionResult
}

function DimensionCard({ title, subtitle, icon, result }: DimensionCardProps) {
  const cfg = getGradeConfig(result.grade)

  return (
    <div
      className={`
        rounded-xl border p-4 flex flex-col gap-3
        bg-card hover:bg-muted/5 transition-colors duration-200
        ${cfg.border}
      `}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-lg ${cfg.bg} flex-shrink-0`}>
            <span className={cfg.text}>{icon}</span>
          </div>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-foreground block truncate">{title}</span>
            <span className="text-[10px] text-muted-foreground block">{subtitle}</span>
          </div>
        </div>

        {/* Grade badge */}
        <div
          className={`
            flex-shrink-0 w-9 h-9 rounded-lg flex flex-col items-center justify-center
            font-black text-base border ${cfg.bg} ${cfg.text} ${cfg.border}
          `}
          title={`Grade ${result.grade} — ${cfg.label}`}
        >
          {result.grade}
        </div>
      </div>

      {/* Score line */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Heuristic Score</span>
          <span className={`text-[11px] font-bold tabular-nums ${cfg.text}`}>
            {result.score.toFixed(0)}<span className="opacity-60">/100</span>
          </span>
        </div>
        <ScoreBar score={result.score} grade={result.grade} />
      </div>

      {/* Summary */}
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {result.summary}
      </p>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function RiskDimensionsPanel({ riskDimensions }: RiskDimensionsPanelProps) {
  // Graceful no-op if data is missing (Task 9 stability)
  if (!riskDimensions) return null

  return (
    <Card className="p-6 border border-border/60">
      {/* Section header */}
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground leading-tight">
              Multidimensional Risk Analysis
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Heuristic interpretation · No real-time monitoring or vulnerability scanning
            </p>
          </div>
        </div>

        {/* Confidence badge (Task 5 — small, non-intrusive) */}
        <ConfidenceBadge confidence={riskDimensions.confidence} />
      </div>

      {/* Interpretation summary banner */}
      {riskDimensions.interpretation_summary && (
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-primary/5 border border-primary/20 mb-5">
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80 leading-relaxed">
            {riskDimensions.interpretation_summary}
          </p>
        </div>
      )}

      {/* Three dimension cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <DimensionCard
          title="Maintainability"
          subtitle="Code quality &amp; complexity"
          icon={<Wrench className="w-3.5 h-3.5" />}
          result={riskDimensions.maintainability}
        />
        <DimensionCard
          title="Deployment Stability"
          subtitle="Coupling &amp; integration"
          icon={<Layers className="w-3.5 h-3.5" />}
          result={riskDimensions.deployment_stability}
        />
        <DimensionCard
          title="Review Complexity"
          subtitle="Structural heuristic only"
          icon={<ShieldAlert className="w-3.5 h-3.5" />}
          result={riskDimensions.security_exposure}
        />
      </div>

      {/* Grading legend + disclaimer */}
      <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border/40">
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
          Grade Scale:
        </span>
        {(['A', 'B', 'C', 'D', 'E'] as const).map((g) => {
          const c = getGradeConfig(g)
          return (
            <div
              key={g}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${c.bg} ${c.text} ${c.border}`}
            >
              <span className="font-black">{g}</span>
              <span className="opacity-80">{c.label}</span>
            </div>
          )
        })}
        <span className="text-[10px] text-muted-foreground ml-auto italic">
          Heuristic estimates · Not predictive of production outcomes
        </span>
      </div>
    </Card>
  )
}
