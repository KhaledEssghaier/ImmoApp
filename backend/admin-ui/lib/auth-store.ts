import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        localStorage.setItem('admin_token', token)
        localStorage.setItem('admin_user', JSON.stringify(user))
        set({ user, token, isAuthenticated: true })
      },
      logout: () => {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'admin-auth-storage',
    }
  )
)
