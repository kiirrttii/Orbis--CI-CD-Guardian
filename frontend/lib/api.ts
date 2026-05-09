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
  UserDetailedResponse,
  UserUpdate,
} from './api-types'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000/api/v1'

class APIClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // ── Request Interceptor ─────────────────────────────
    this.client.interceptors.request.use((config) => {
      const token = this.getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // ── Response Interceptor ───────────────────────────
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        return Promise.reject(error)
      }
    )
  }

  // ── Token Handling ──────────────────────────────────
  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    
    const name = 'access_token='
    const decodedCookie = document.cookie
    const cookies = decodedCookie.split(';')

    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i]
      while (cookie.charAt(0) === ' ') cookie = cookie.substring(1)
      if (cookie.indexOf(name) === 0) return cookie.substring(name.length, cookie.length)
    }

    return localStorage.getItem('access_token')
  }

  // ── Health & Model Status ──────────────────────────
  async healthCheck(): Promise<HealthCheckResponse> {
    const response = await this.client.get<HealthCheckResponse>('/health')
    return response.data
  }

  async getModelStatus(): Promise<ModelStatusResponse> {
    const response = await this.client.get<ModelStatusResponse>('/predictions/model/status')
    return response.data
  }

  // ── Core Analysis ───────────────────────────────────
  async analyzeCode(payload: AnalysisRequest): Promise<AnalysisResponse> {
    const response = await this.client.post<AnalysisResponse>('/intelligence/analyze', payload)
    return response.data
  }

  // ── Authentication ──────────────────────────────────
  async login(payload: LoginRequest): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/auth/login', payload)
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token)
      if (typeof window !== 'undefined') {
        document.cookie = `access_token=${response.data.access_token}; path=/; max-age=3600; SameSite=Lax`
      }
    }
    return response.data
  }

  async signup(payload: SignupRequest): Promise<UserResponse> {
    const response = await this.client.post<UserResponse>('/auth/signup', payload)
    return response.data
  }

  async getMe(): Promise<UserDetailedResponse> {
    const response = await this.client.get<UserDetailedResponse>('/auth/me')
    return response.data
  }

  async updateMe(payload: UserUpdate): Promise<UserDetailedResponse> {
    const response = await this.client.put<UserDetailedResponse>('/auth/me', payload)
    return response.data
  }

  async verifyToken(): Promise<VerifyResponse> {
    const response = await this.client.get<VerifyResponse>('/auth/verify')
    return response.data
  }

  logout() {
    localStorage.removeItem('access_token')
    if (typeof window !== 'undefined') {
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax'
    }
  }

  // ── Operational Analysis ────────────────────────────
  async analyzeRepository(payload: RepositoryAnalysisRequest): Promise<AnalysisResponse> {
    const response = await this.client.post<AnalysisResponse>('/analysis/repository', payload)
    return response.data
  }

  async analyzeTelemetry(payload: TelemetryAnalysisRequest): Promise<AnalysisResponse> {
    const response = await this.client.post<AnalysisResponse>('/analysis/telemetry', payload)
    return response.data
  }

  async analyzeUpload(file: File): Promise<AnalysisResponse> {
    const content = await file.text()
    const response = await this.client.post<AnalysisResponse>(
      `/analysis/upload?filename=${encodeURIComponent(file.name)}`,
      content,
      { headers: { 'Content-Type': 'text/plain' } }
    )
    return response.data
  }

  // ── Deployment History ──────────────────────────────
  async getHistory(limit = 20, offset = 0): Promise<AnalysisResponse[]> {
    const response = await this.client.get<AnalysisResponse[]>('/history', { params: { limit, offset } })
    return response.data
  }

  async getHistoryDetail(predictionId: string): Promise<AnalysisResponse> {
    const response = await this.client.get<AnalysisResponse>(`/history/${predictionId}`)
    return response.data
  }
}

export const apiClient = new APIClient()