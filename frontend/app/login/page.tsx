import { LoginForm } from '@/components/auth/login-form'
import { Zap } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Sign In - RiskOps AI',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card flex">
      {/* Left Panel - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">RiskOps AI</h1>
                <p className="text-sm text-muted-foreground">DevOps Intelligence</p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h2>
              <p className="text-muted-foreground">Sign in to your RiskOps AI workspace</p>
            </div>
          </div>

          <LoginForm />

          <p className="text-center text-sm text-muted-foreground mt-8">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Illustration */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-primary/10 to-accent/10 items-center justify-center p-8">
        <div className="max-w-md">
          <div className="bg-card rounded-2xl p-8 shadow-xl mb-6">
            <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg mb-4 flex items-center justify-center">
              <Zap className="w-16 h-16 text-primary opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">AI Risk Intelligence</h3>
            <p className="text-muted-foreground text-sm">
              Get real-time AI-powered risk analysis for your CI/CD pipelines with explainable predictions and actionable recommendations.
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary font-bold text-xs">✓</span>
              </div>
              <p className="text-foreground">SHAP explainability for every prediction</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary font-bold text-xs">✓</span>
              </div>
              <p className="text-foreground">Context-aware recommendations</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary font-bold text-xs">✓</span>
              </div>
              <p className="text-foreground">Comprehensive deployment monitoring</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
