'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { LogOut, User } from 'lucide-react'

export default function TopBar() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await authApi.logout()
      logout()
      toast.success('Logged out successfully')
      router.push('/login')
    } catch (error) {
      logout()
      router.push('/login')
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-lg">
            <User size={20} className="text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
