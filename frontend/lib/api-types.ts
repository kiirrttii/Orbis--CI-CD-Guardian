// API Types for Orbis backend

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
}

export interface ModelStatusResponse {
  model_id: string
  status: 'ready' | 'loading' | 'error'
  version: string
  accuracy: number
  last_updated: string
}

export interface AnalysisRequest {
  LOC: number
  CYCLO: number
  LENGTH: number
  VOLUME: number
  DIFFICULTY: number
  INT_FAN_IN: number
  INT_FAN_OUT: number
  NUM_OPERATORS: number
  NUM_OPERANDS: number
  BRANCH_COUNT: number
}

export interface AnalysisResponse {
  workflow_run_id: string
  prediction_id: string
  target_name: string
  inference: {
    prediction: number
    probability: number
    risk_score: number
    severity: SeverityLevel
    analysis_type: string
    confidence: number
    confidence_level: string
    model_version: string
    timestamp: string
  }
  explainability: Array<{
    feature: string
    shap_value: number
    impact_percent: number
    interpretation: string
    direction: 'increase_risk' | 'decrease_risk'
  }>
  recommendations: ActionableInsight[]
}

export interface ActionableInsight {
  title: string
  reason: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  action_type: string
}

// ── Authentication ───────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  full_name: string
}

export interface UserResponse {
  id: string
  email: string
  full_name: string | null
}

export interface UserPreferences {
  version: number
  theme: 'light' | 'dark' | 'system'
  notifications: boolean
  export_format: 'pdf' | 'csv' | 'json'
  refresh_interval: number
  experimental_features: Record<string, boolean>
}

export interface UserUpdate {
  full_name?: string
  email?: string
  role?: 'Developer' | 'Analyst' | 'Viewer' | 'Administrator'
  preferences?: Partial<UserPreferences>
}

export interface UserDetailedResponse extends UserResponse {
  role: string
  preferences: UserPreferences
  created_at: string
  updated_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: UserResponse
}

export interface VerifyResponse {
  valid: boolean
  user: UserResponse
}

// ── Operational Analysis ─────────────────────────────────────────────────────

export interface RepositoryAnalysisRequest {
  repository_url: string
  branch?: string
  pipeline_type?: string
}

export interface TelemetryAnalysisRequest {
  workflow_run_id: string
}

export interface DeploymentHistory {
  id: string
  repository: string
  run_id: string
  timestamp: string
  severity: SeverityLevel
  risk_score: number
  branch: string
  commit_sha: string
}

export interface TelemetryData {
  workflow_run_id: string
  source: 'github' | 'jenkins'
  workflow_name: string
  status: 'running' | 'success' | 'failed' | 'cancelled'
  timestamp: string
  duration: number
  runs_count: number
}

export interface IntegrationInfo {
  name: string
  description: string
  status: 'connected' | 'disconnected' | 'error'
  last_sync?: string
  health?: 'healthy' | 'degraded' | 'error'
}

export interface ActivityFeedItem {
  id: string
  type: 'analysis' | 'deployment' | 'alert'
  title: string
  description: string
  severity: SeverityLevel
  timestamp: string
}

export interface SummaryStats {
  total_runs: number
  critical_deployments: number
  average_risk_score: number
  active_alerts: number
}
