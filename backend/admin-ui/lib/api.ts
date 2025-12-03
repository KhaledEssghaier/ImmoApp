import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010'

export const apiClient = axios.create({
  baseURL: `${API_URL}/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface LoginDto {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: {
    id: string
    email: string
    name: string
    role: string
    permissions: string[]
  }
}

export interface Report {
  _id: string
  reporterId: string
  targetType: 'property' | 'user' | 'message'
  targetId: string
  reason: string
  description?: string
  status: 'open' | 'in_review' | 'resolved' | 'invalid'
  assignedTo?: string
  resolution?: string
  createdAt: string
  updatedAt: string
}

export interface ModerationAction {
  _id: string
  actionType: string
  performedBy: string
  targetType: string
  targetId: string
  reason: string
  createdAt: string
}

// Moderation DTOs
export interface BanUserDto {
  userId: string
  reason: string
  durationDays?: number | null
  relatedReportId?: string
  metadata?: any
}

export interface WarningDto {
  targetType: 'user' | 'property'
  targetId: string
  reason: string
  relatedReportId?: string
  metadata?: any
}

export interface RemovePropertyDto {
  propertyId: string
  reason: string
  relatedReportId?: string
  metadata?: any
}

export interface AuditLog {
  _id: string
  actorId: string
  action: string
  resource: {
    type: string
    id: string
  }
  ip: string
  createdAt: string
}

// Auth API
export const authApi = {
  login: (data: LoginDto) => apiClient.post<LoginResponse>('/users/login', data),
  logout: () => apiClient.post('/users/logout'),
  getMe: () => apiClient.get<any>('/users/me'),
}

// Reports API
export const reportsApi = {
  getAll: (params?: any) => apiClient.get<{ data: Report[]; total: number }>('/reports', { params }),
  getOne: (id: string) => apiClient.get<Report>(`/reports/${id}`),
  create: (data: any) => apiClient.post<Report>('/reports', data),
  assign: (id: string, assignedTo: string) => apiClient.post(`/reports/${id}/assign`, { assignedTo }),
  updateStatus: (id: string, status: string) => apiClient.post(`/reports/${id}/status`, { status }),
  export: (params?: any) => apiClient.get('/reports/export', { params, responseType: 'blob' }),
}

// Moderation API
export const moderationApi = {
  getAll: (params?: any) => apiClient.get<{ data: ModerationAction[]; total: number }>('/actions', { params }),
  getBannedUsers: (params?: any) => apiClient.get<{ data: any[]; total: number }>('/actions/banned-users', { params }),
  banUser: (data: BanUserDto) => apiClient.post<ModerationAction>('/actions/ban-user', data),
  unbanUser: (userId: string, reason: string) => apiClient.post<ModerationAction>(`/actions/unban-user/${userId}`, { reason }),
  removeProperty: (data: RemovePropertyDto) => apiClient.post<ModerationAction>('/actions/remove-property', data),
  restoreProperty: (propertyId: string, reason: string) => apiClient.post<ModerationAction>(`/actions/restore-property/${propertyId}`, { reason }),
  issueWarning: (data: WarningDto) => apiClient.post<ModerationAction>('/actions/warning', data),
}

// Audit API
export const auditApi = {
  getAll: (params?: any) => apiClient.get<{ data: AuditLog[]; total: number }>('/audit', { params }),
  getOne: (id: string) => apiClient.get<AuditLog>(`/audit/${id}`),
  export: (params?: any) => apiClient.get('/audit/export', { params, responseType: 'blob' }),
}

// Admin Users API
export const adminUsersApi = {
  getAll: (params?: any) => apiClient.get<{ data: any[]; total: number }>('/users', { params }),
  getOne: (id: string) => apiClient.get<any>(`/users/${id}`),
  create: (data: any) => apiClient.post<any>('/users', data),
  update: (id: string, data: any) => apiClient.patch<any>(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
}
