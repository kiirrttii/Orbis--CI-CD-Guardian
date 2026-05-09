'use client'

import { 
  GitMerge, 
  FileCode2, 
  BrainCircuit, 
  Activity, 
  Lightbulb, 
  History,
  ArrowRight
} from 'lucide-react'

const steps = [
  {
    name: 'CI/CD Ingestion',
    icon: GitMerge,
    description: 'Seamlessly connects to GitHub or telemetry feeds to monitor active deployment workflows in real-time.',
    highlights: ['Repository Metadata', 'Workflow Topologies', 'Event Triggers']
  },
  {
    name: 'Feature Extraction',
    icon: FileCode2,
    description: 'Parses codebase structures to extract critical engineering metrics and logic complexity indicators.',
    highlights: ['Halstead Metrics', 'Cyclomatic Complexity', 'Dependency Fan-in/out']
  },
  {
    name: 'Risk Engine',
    icon: BrainCircuit,
    description: 'A hybrid intelligence layer combining deterministic engineering heuristics with ML-assisted probability refinement.',
    highlights: ['Heuristic Baseline', 'ML Nuance Scaling', 'Confidence Calibration']
  },
  {
    name: 'Operational Signals',
    icon: Activity,
    description: 'Translates raw statistical feature attributions into stable, DevSecOps-aligned engineering semantics.',
    highlights: ['Deployment Surface', 'Logic Complexity', 'System Coupling']
  },
  {
    name: 'Contextual Insights',
    icon: Lightbulb,
    description: 'Maps dominant operational signals to specific, actionable remediation tasks and review requirements.',
    highlights: ['Refactoring Guidance', 'Targeted Audits', 'Testing Strategies']
  },
  {
    name: 'Auditability',
    icon: History,
    description: 'Persists every analysis into an immutable timeline, providing deep historical tracking and risk trend visibility.',
    highlights: ['Execution Timestamps', 'Severity Tracking', 'Long-term Analytics']
  },
]

import { APP_NAME } from '@/lib/config'

export function WorkflowPipeline() {
  return (
    <div className="w-full">
      <div className="text-center max-w-4xl mx-auto mb-16 relative">
        <h2 className="text-3xl md:text-4xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-foreground to-primary tracking-tight">
          The {APP_NAME} Pipeline
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground">
          A seamless, end-to-end intelligence layer that integrates directly into your DevSecOps lifecycle.
        </p>
      </div>

      {/* Desktop Horizontal Scroll Flow */}
      <div className="hidden lg:block relative w-full overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar">
        {/* Continuous background connection line with animated gradient */}
        <div className="absolute top-[76px] left-0 w-max min-w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-10 bg-[length:200%_100%] animate-pulse"></div>
        
        <div className="flex w-max min-w-full px-4 pt-6 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.name} className="flex items-start snap-center relative w-[320px] flex-shrink-0">
                {/* Connector Arrow (Except for last item) */}
                {index < steps.length - 1 && (
                  <div className="absolute top-[76px] -right-4 translate-x-1/2 -translate-y-1/2 z-0 bg-background p-1.5 rounded-full border border-primary/20 shadow-sm">
                    <ArrowRight className="w-4 h-4 text-primary/80" />
                  </div>
                )}
                
                <div className="bg-card/40 backdrop-blur-md border border-border/50 hover:border-primary/40 rounded-xl p-6 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 w-full group relative z-10">
                  {/* Step Number Badge with pulse effect */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md shadow-primary/20 border-2 border-background z-20 group-hover:scale-110 transition-transform duration-300">
                    {index + 1}
                  </div>
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary/40 animate-ping opacity-0 group-hover:opacity-100"></div>
                  
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 shadow-inner">
                    <Icon className="w-7 h-7 text-primary group-hover:text-primary transition-colors" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold text-foreground mb-3">{step.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6 h-16 leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Highlights */}
                  <div className="space-y-2 pt-4 border-t border-border/30">
                    {step.highlights.map(highlight => (
                      <div key={highlight} className="flex items-center gap-2 text-xs font-medium text-foreground/70 group-hover:text-foreground/90 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 group-hover:bg-primary transition-colors"></div>
                        {highlight}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile Vertical Flow */}
      <div className="lg:hidden space-y-6 relative">
        {/* Vertical connection line */}
        <div className="absolute top-0 bottom-0 left-[27px] w-0.5 bg-gradient-to-b from-primary/10 via-primary/30 to-primary/10 -z-10"></div>
        
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={step.name} className="relative z-10 flex gap-6 group">
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-card/60 backdrop-blur-sm border-2 border-primary/20 shadow-sm flex items-center justify-center relative z-10 group-hover:scale-105 transition-transform duration-300">
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-md shadow-primary/20">
                    {index + 1}
                  </div>
                  <Icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              
              <div className="bg-card/40 backdrop-blur-sm border border-border/50 hover:border-primary/30 rounded-xl p-5 shadow-sm flex-1 group-hover:shadow-md transition-all duration-300">
                <h3 className="text-lg font-bold text-foreground mb-2">{step.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {step.description}
                </p>
                <div className="space-y-1.5 pt-3 border-t border-border/30">
                  {step.highlights.map(highlight => (
                    <div key={highlight} className="flex items-center gap-2 text-xs font-medium text-foreground/70">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
                      {highlight}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
