import type {
  DeploymentHistory,
  TelemetryData,
  Recommendation,
} from './api-types'



export const mockDeploymentHistory: DeploymentHistory[] = [
  {
    id: '1',
    repository: 'frontend-app',
    run_id: 'GH-2024-001',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    severity: 'MEDIUM',
    risk_score: 45,
    branch: 'main',
    commit_sha: 'abc123def456',
  },
  {
    id: '2',
    repository: 'api-service',
    run_id: 'GH-2024-002',
    timestamp: "2024-05-09T07:00:00Z",
    severity: 'LOW',
    risk_score: 22,
    branch: 'develop',
    commit_sha: 'def456ghi789',
  },
  {
    id: '3',
    repository: 'auth-service',
    run_id: 'GH-2024-003',
    timestamp: "2024-05-09T04:00:00Z",
    severity: 'CRITICAL',
    risk_score: 78,
    branch: 'main',
    commit_sha: 'ghi789jkl012',
  },
  {
    id: '4',
    repository: 'database-migration',
    run_id: 'GH-2024-004',
    timestamp: "2024-05-09T01:00:00Z",
    severity: 'HIGH',
    risk_score: 62,
    branch: 'feature/db-optimization',
    commit_sha: 'jkl012mno345',
  },
  {
    id: '5',
    repository: 'monitoring-service',
    run_id: 'GH-2024-005',
    timestamp: "2024-05-08T12:00:00Z",
    severity: 'LOW',
    risk_score: 18,
    branch: 'main',
    commit_sha: 'mno345pqr678',
  },
  {
    id: '6',
    repository: 'payment-processor',
    run_id: 'GH-2024-006',
    timestamp: "2024-05-08T00:00:00Z",
    severity: 'HIGH',
    risk_score: 55,
    branch: 'develop',
    commit_sha: 'pqr678stu901',
  },
  {
    id: '7',
    repository: 'cache-layer',
    run_id: 'GH-2024-007',
    timestamp: "2024-05-07T12:00:00Z",
    severity: 'MEDIUM',
    risk_score: 38,
    branch: 'optimization',
    commit_sha: 'stu901uvw234',
  },
  {
    id: '8',
    repository: 'notification-service',
    run_id: 'GH-2024-008',
    timestamp: "2024-05-06T12:00:00Z",
    severity: 'LOW',
    risk_score: 15,
    branch: 'main',
    commit_sha: 'uvw234vxy567',
  },
]

export const mockTelemetryData: TelemetryData[] = [
  {
    workflow_run_id: '5c21504d-9383-4419-ab64-cba3e6d7dfdb',
    source: 'github',
    workflow_name: 'Build and Deploy - Main',
    status: 'success',
    timestamp: "2024-05-09T11:00:00Z",
    duration: 245,
    runs_count: 856,
  },
  {
    workflow_run_id: '21aa7db1-3904-47cb-9570-7beb924b7941',
    source: 'github',
    workflow_name: 'Run Tests - PR',
    status: 'success',
    timestamp: "2024-05-09T10:00:00Z",
    duration: 320,
    runs_count: 1203,
  },
  {
    workflow_run_id: '94bb85ec-1e25-45ae-974b-f665c8933b81',
    source: 'jenkins',
    workflow_name: 'Nightly Build',
    status: 'running',
    timestamp: "2024-05-09T12:00:00Z",
    duration: 0,
    runs_count: 45,
  },
  {
    workflow_run_id: '9fe692f8-40e5-419e-87a4-1bc65c7919a2',
    source: 'jenkins',
    workflow_name: 'Security Scan',
    status: 'success',
    timestamp: "2024-05-09T08:00:00Z",
    duration: 180,
    runs_count: 124,
  },
  {
    workflow_run_id: '6c1c615c-e09d-4f5d-afe1-d8defb142e73',
    source: 'github',
    workflow_name: 'Deploy to Staging',
    status: 'success',
    timestamp: "2024-05-09T06:00:00Z",
    duration: 520,
    runs_count: 267,
  },
]



export interface MockRecommendation {
  id: string;
  title: string;
  explanation: string;
  impact: string;
  suggested_action: string;
  triggered_by: string[];
  action_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priority: number;
}

export const mockRecommendations: MockRecommendation[] = [
  {
    id: '1',
    title: 'Reduce Logic Complexity',
    explanation: 'The authentication service has complex decision trees with 28 branches.',
    impact: 'High logic complexity increases maintenance difficulty, makes the code harder to read, and elevates the risk of deployment instability.',
    suggested_action: 'Consider splitting complex logic into smaller, reusable functions to improve readability and testability.',
    triggered_by: ['Logic Complexity', 'Impact: 18%'],
    action_type: 'refactor',
    severity: 'CRITICAL',
    priority: 1,
  },
  {
    id: '2',
    title: 'Modularize Large Files',
    explanation: 'Several functions exceed 600 lines, packing complex logic into dense spaces.',
    impact: 'Large monolithic components are difficult to audit, harder to test, and exponentially more prone to regressions during updates.',
    suggested_action: 'Extract separate responsibilities into their own modules or files to reduce volume and improve modularity.',
    triggered_by: ['Code Volume', 'Impact: 15%'],
    action_type: 'refactor',
    severity: 'HIGH',
    priority: 2,
  },
  {
    id: '3',
    title: 'Consolidate Execution Paths',
    explanation: 'Test coverage is below 60% for critical paths with elevated branch density.',
    impact: 'Having too many untested branches makes it nearly impossible to achieve full test coverage, increasing the risk of unexpected bugs in production.',
    suggested_action: 'Consolidate overlapping logic and review test cases to ensure all critical execution paths are properly covered.',
    triggered_by: ['Branch Density'],
    action_type: 'testing',
    severity: 'HIGH',
    priority: 3,
  },
  {
    id: '4',
    title: 'Reduce Module Dependency Spread',
    explanation: 'Payment service depends on 12 external modules to function.',
    impact: 'High dependency spread creates tight coupling. If any of those external dependencies change or fail, this module will likely break.',
    suggested_action: 'Decouple components where possible. Consider using interfaces or an event-driven architecture.',
    triggered_by: ['External Dependencies', 'Impact: 10%'],
    action_type: 'refactor',
    severity: 'MEDIUM',
    priority: 4,
  },
  {
    id: '5',
    title: 'Simplify Code Interactions',
    explanation: 'Complex API endpoints lack proper documentation and have high cognitive load.',
    impact: 'Hard-to-read code leads to a steeper learning curve for new developers and a higher likelihood of introducing defects during maintenance.',
    suggested_action: 'Simplify operator interactions, use descriptive variable names, and add comprehensive docstrings.',
    triggered_by: ['Cognitive Load'],
    action_type: 'document',
    severity: 'MEDIUM',
    priority: 5,
  },
  {
    id: '6',
    title: 'Optimize Database Queries',
    explanation: 'Several N+1 query patterns were detected during data retrieval.',
    impact: 'Inefficient database queries will rapidly degrade system performance under heavy load.',
    suggested_action: 'Use batch fetching or join queries to reduce the total number of database calls.',
    triggered_by: ['Database Operations'],
    action_type: 'optimize',
    severity: 'MEDIUM',
    priority: 6,
  },
  {
    id: '7',
    title: 'Fix Performance Bottleneck',
    explanation: 'Caching layer is underutilized, which could reduce latency by 40%.',
    impact: 'High latency negatively impacts the user experience and increases infrastructure costs.',
    suggested_action: 'Implement Redis or Memcached for frequently accessed, immutable data points.',
    triggered_by: ['Performance Analysis'],
    action_type: 'optimize',
    severity: 'MEDIUM',
    priority: 7,
  },
  {
    id: '8',
    title: 'Improve Error Handling',
    explanation: 'Several exception handlers are overly broad (e.g., catching generic Exceptions).',
    impact: 'Catching broad exceptions masks underlying systemic failures and makes debugging production incidents extremely difficult.',
    suggested_action: 'Implement specific exception catching and ensure error logs contain sufficient context.',
    triggered_by: ['Error Handling'],
    action_type: 'bug_fix',
    severity: 'LOW',
    priority: 8,
  },
]

export const mockSHAPData = {
  feature_importance: [
    { feature: 'CYCLO', importance: 0.18, direction: 'increase_risk' as const },
    { feature: 'LENGTH', importance: 0.15, direction: 'increase_risk' as const },
    { feature: 'DIFFICULTY', importance: 0.14, direction: 'increase_risk' as const },
    { feature: 'VOLUME', importance: 0.12, direction: 'increase_risk' as const },
    { feature: 'NUM_OPERATORS', importance: 0.11, direction: 'increase_risk' as const },
    { feature: 'INT_FAN_OUT', importance: 0.1, direction: 'increase_risk' as const },
    { feature: 'NUM_OPERANDS', importance: 0.09, direction: 'increase_risk' as const },
    { feature: 'INT_FAN_IN', importance: 0.08, direction: 'decrease_risk' as const },
    { feature: 'BRANCH_COUNT', importance: 0.03, direction: 'increase_risk' as const },
  ],
}

export const mockIntegrations = [
  {
    name: 'Prometheus',
    description: 'Metrics monitoring and alerting',
    status: 'connected' as const,
    last_sync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    health: 'healthy' as const,
  },
  {
    name: 'Grafana',
    description: 'Visualization and dashboards',
    status: 'connected' as const,
    last_sync: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    health: 'healthy' as const,
  },
  {
    name: 'Kibana',
    description: 'Log analysis and visualization',
    status: 'connected' as const,
    last_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    health: 'degraded' as const,
  },
  {
    name: 'Jaeger',
    description: 'Distributed tracing',
    status: 'connected' as const,
    last_sync: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    health: 'healthy' as const,
  },
  {
    name: 'SonarQube',
    description: 'Code quality analysis',
    status: 'connected' as const,
    last_sync: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    health: 'healthy' as const,
  },
  {
    name: 'Snyk',
    description: 'Security vulnerability scanning',
    status: 'disconnected' as const,
  },
  {
    name: 'Docker',
    description: 'Container management',
    status: 'connected' as const,
    last_sync: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    health: 'healthy' as const,
  },
  {
    name: 'Kubernetes',
    description: 'Orchestration platform',
    status: 'connected' as const,
    last_sync: new Date().toISOString(),
    health: 'healthy' as const,
  },
]
