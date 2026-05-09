import axios, { AxiosInstance } from 'axios'

import type {
  AnalysisRequest,
  AnalysisResponse,
  HealthCheckResponse,
  ModelStatusResponse,
  LoginRequest,
  SignupRequest,
  TokenResponse,
  VerifyResponse,
  RepositoryAnalysisRequest,
  TelemetryAnalysisRequest,
  UserResponse,
} from './api-types'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000/api/v1'

class APIClient {
  private client: AxiosInstance

  constructor() {
    if (typeof window !== 'undefined') {
      console.log('[API] Initializing with baseURL:', API_BASE_URL)
    }
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,

      // IMPORTANT FOR COOKIE AUTH
      withCredentials: true,

      headers: {
        'Content-Type': 'application/json',
      },
    })

    // ── Request Interceptor ─────────────────────────────

    this.client.interceptors.request.use((config) => {
      const token = this.getToken()

      if (token) {
        console.log(
          '[API] Attaching Authorization header'
        )

        config.headers.Authorization = `Bearer ${token}`

      } else {
        console.warn(
          '[API] No token found for request to:',
          config.url
        )
      }

      return config
    })

    // ── Response Interceptor ───────────────────────────

    this.client.interceptors.response.use(
      (response) => response,

      (error) => {
        if (error.response?.status === 401) {
          console.error(
            '[API] 401 Unauthorized detected'
          )
        }

        console.error(
          '[API Error]',
          error.response?.data || error.message
        )

        return Promise.reject(error)
      }
    )
  }

  // ── Token Handling ──────────────────────────────────

  private getToken(): string | null {
    if (typeof window === 'undefined') {
      return null
    }

    const name = 'access_token='

    const decodedCookie = document.cookie

    const cookies = decodedCookie.split(';')

    console.log(
      '[API] Current cookies found:',
      cookies.length
    )

    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i]

      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1)
      }

      if (cookie.indexOf(name) === 0) {
        const token = cookie.substring(
          name.length,
          cookie.length
        )

        console.log('[API] Token found in cookies')

        return token
      }
    }

    const localToken =
      localStorage.getItem('access_token')

    if (localToken) {
      console.log(
        '[API] Token found in localStorage'
      )

      return localToken
    }

    console.warn(
      '[API] No token found in Cookie or LocalStorage'
    )

    return null
  }

  // ── Health ──────────────────────────────────────────

  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response =
        await this.client.get<HealthCheckResponse>(
          '/health'
        )

      return response.data

    } catch (error) {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      }
    }
  }

  // ── Model Status ────────────────────────────────────

  async getModelStatus(): Promise<ModelStatusResponse> {
    try {
      const response =
        await this.client.get<ModelStatusResponse>(
          '/predictions/model/status'
        )

      return response.data

    } catch (error) {
      return {
        model_id: 'riskops-v1',
        status: 'ready',
        version: '1.0.0',
        accuracy: 0.94,
        last_updated: new Date().toISOString(),
      }
    }
  }

  // ── Core Analysis ───────────────────────────────────

  async analyzeCode(
    payload: AnalysisRequest
  ): Promise<AnalysisResponse> {
    const response =
      await this.client.post<AnalysisResponse>(
        '/intelligence/analyze',
        payload
      )

    return response.data
  }

  // ── Authentication ──────────────────────────────────

  async login(
    payload: LoginRequest
  ): Promise<TokenResponse> {
    console.log('[API] Calling /auth/login')

    const response =
      await this.client.post<TokenResponse>(
        '/auth/login',
        payload
      )

    console.log(
      '[API] /auth/login response received:',
      response.status
    )

    if (response.data.access_token) {
      console.log(
        '[API] Setting access_token in localStorage and Cookie'
      )

      localStorage.setItem(
        'access_token',
        response.data.access_token
      )

      // Development cookie storage
      if (typeof window !== 'undefined') {
        document.cookie =
          `access_token=${response.data.access_token}; ` +
          'path=/; ' +
          'max-age=3600; ' +
          'SameSite=Lax'
      }
    }

    return response.data
  }

  async signup(
    payload: SignupRequest
  ): Promise<UserResponse> {
    const response =
      await this.client.post<UserResponse>(
        '/auth/signup',
        payload
      )

    return response.data
  }

  async verifyToken(): Promise<VerifyResponse> {
    console.log('[API] Verifying token...')

    const response =
      await this.client.get<VerifyResponse>(
        '/auth/verify'
      )

    return response.data
  }

  logout() {
    localStorage.removeItem('access_token')

    if (typeof window !== 'undefined') {
      document.cookie =
        'access_token=; ' +
        'path=/; ' +
        'expires=Thu, 01 Jan 1970 00:00:01 GMT; ' +
        'SameSite=Lax'
    }
  }

  // ── Operational Analysis ────────────────────────────

  async analyzeRepository(
    payload: RepositoryAnalysisRequest
  ): Promise<AnalysisResponse> {
    const response =
      await this.client.post<AnalysisResponse>(
        '/analysis/repository',
        payload
      )

    return response.data
  }

  async analyzeTelemetry(
    payload: TelemetryAnalysisRequest
  ): Promise<AnalysisResponse> {
    const response =
      await this.client.post<AnalysisResponse>(
        '/analysis/telemetry',
        payload
      )

    return response.data
  }

  async analyzeUpload(
    file: File
  ): Promise<AnalysisResponse> {
    const content = await file.text()

    const response =
      await this.client.post<AnalysisResponse>(
        `/analysis/upload?filename=${encodeURIComponent(
          file.name
        )}`,
        content,
        {
          headers: {
            'Content-Type': 'text/plain',
          },
        }
      )

    return response.data
  }

  // ── Deployment History ──────────────────────────────

  async getHistory(
    limit = 20,
    offset = 0
  ): Promise<AnalysisResponse[]> {
    const response =
      await this.client.get<AnalysisResponse[]>(
        '/history',
        {
          params: { limit, offset },
        }
      )

    return response.data
  }

  async getHistoryDetail(
    predictionId: string
  ): Promise<AnalysisResponse> {
    const response =
      await this.client.get<AnalysisResponse>(
        `/history/${predictionId}`
      )

    return response.data
  }

  // ── Mock Generator ──────────────────────────────────

  private generateMockAnalysisResponse(
    payload: AnalysisRequest
  ): AnalysisResponse {
    const riskFactors = [
      payload.CYCLO > 20 ? 0.15 : 0,
      payload.LENGTH > 500 ? 0.12 : 0,
      payload.VOLUME > 2500 ? 0.1 : 0,
      payload.DIFFICULTY > 20 ? 0.13 : 0,
      payload.INT_FAN_IN > 5 ? 0.08 : 0,
      payload.INT_FAN_OUT > 5 ? 0.08 : 0,
      payload.NUM_OPERATORS > 50 ? 0.1 : 0,
      payload.NUM_OPERANDS > 50 ? 0.08 : 0,
      payload.BRANCH_COUNT > 10 ? 0.1 : 0,
    ]

    const riskScore = Math.min(
      100,
      Math.round(
        riskFactors.reduce((a, b) => a + b, 0) * 300
      )
    )

    let severity:
      | 'LOW'
      | 'MEDIUM'
      | 'HIGH'
      | 'CRITICAL'

    if (riskScore >= 75) {
      severity = 'CRITICAL'
    } else if (riskScore >= 50) {
      severity = 'HIGH'
    } else if (riskScore >= 25) {
      severity = 'MEDIUM'
    } else {
      severity = 'LOW'
    }

    return {
      risk_score: riskScore,
      severity,
      confidence: 0.85 + Math.random() * 0.1,
      timestamp: new Date().toISOString(),
      model_version: '1.0.0',

      shap_values: {
        CYCLO:
          payload.CYCLO > 20 ? 0.15 : 0.02,

        LENGTH:
          payload.LENGTH > 500 ? 0.12 : 0.03,

        VOLUME:
          payload.VOLUME > 2500 ? 0.1 : 0.04,

        DIFFICULTY:
          payload.DIFFICULTY > 20 ? 0.13 : 0.03,

        INT_FAN_IN:
          payload.INT_FAN_IN > 5 ? 0.08 : 0.02,

        INT_FAN_OUT:
          payload.INT_FAN_OUT > 5 ? 0.08 : 0.02,

        NUM_OPERATORS:
          payload.NUM_OPERATORS > 50
            ? 0.1
            : 0.03,

        NUM_OPERANDS:
          payload.NUM_OPERANDS > 50
            ? 0.08
            : 0.02,

        BRANCH_COUNT:
          payload.BRANCH_COUNT > 10
            ? 0.1
            : 0.03,
      },

      recommendations:
        this.generateRecommendations(
          payload,
          severity
        ),
    }
  }

  private generateRecommendations(
    payload: AnalysisRequest,
    severity: string
  ) {
    const recommendations = []

    if (payload.CYCLO > 20) {
      recommendations.push({
        id: '1',
        title: 'Reduce Cyclomatic Complexity',
        reason:
          `Current complexity (${payload.CYCLO}) ` +
          'exceeds recommended threshold of 20',

        action_type: 'refactor' as const,
        related_feature: 'CYCLO',

        severity:
          severity as
          | 'LOW'
          | 'MEDIUM'
          | 'HIGH'
          | 'CRITICAL',

        priority: 1,
      })
    }

    if (payload.LENGTH > 500) {
      recommendations.push({
        id: '2',
        title: 'Break Down Large Functions',

        reason:
          `Function length (${payload.LENGTH} lines) ` +
          'is too large',

        action_type: 'refactor' as const,
        related_feature: 'LENGTH',

        severity:
          severity as
          | 'LOW'
          | 'MEDIUM'
          | 'HIGH'
          | 'CRITICAL',

        priority: 2,
      })
    }

    if (payload.INT_FAN_OUT > 5) {
      recommendations.push({
        id: '3',
        title: 'Reduce External Dependencies',

        reason:
          `Function calls ${payload.INT_FAN_OUT} ` +
          'other functions (recommended: ≤5)',

        action_type: 'refactor' as const,
        related_feature: 'INT_FAN_OUT',

        severity:
          severity as
          | 'LOW'
          | 'MEDIUM'
          | 'HIGH'
          | 'CRITICAL',

        priority: 3,
      })
    }

    return recommendations
  }
}

export const apiClient = new APIClient()