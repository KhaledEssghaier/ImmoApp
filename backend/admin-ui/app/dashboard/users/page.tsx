'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, UserPlus, Shield, Mail, Calendar, X } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { adminUsersApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function AdminUsersPage() {
  const { user } = useAuthStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'moderator' as 'moderator' | 'admin' | 'superadmin',
  })
  
  const queryClient = useQueryClient()

  // Debug: Log user ID
  console.log('Current user:', user)
  console.log('User ID:', user?.id)

  const { data: admins, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminUsersApi.getAll().then(res => res.data),
  })

  const createAdminMutation = useMutation({
    mutationFn: (data: any) => adminUsersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Admin created successfully')
      setShowCreateModal(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create admin')
    },
  })

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'moderator',
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createAdminMutation.mutate(formData)
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Users</h1>
          <p className="text-gray-600 mt-2">Manage admin accounts and permissions</p>
        </div>
        {user?.role === 'superadmin' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <UserPlus size={20} />
            Create Admin
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Admins</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{admins?.total || 0}</p>
            </div>
            <Users className="w-12 h-12 text-primary-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {admins?.data?.filter((a: any) => a.isActive).length || 0}
              </p>
            </div>
            <Shield className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-3xl font-bold text-gray-600 mt-2">
                {admins?.data?.filter((a: any) => !a.isActive).length || 0}
              </p>
            </div>
            <Users className="w-12 h-12 text-gray-400 opacity-20" />
          </div>
        </div>
      </div>

      {/* Admin Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Admin Accounts</h3>
        </div>

        {/* Current User Card */}
        {user && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{user.name}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <Mail size={14} />
                      {user.email}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'superadmin'
                        ? 'bg-purple-100 text-purple-700'
                        : user.role === 'admin'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Active (You)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        ) : admins?.data && admins.data.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {admins.data.map((admin: any) => (
              <div key={admin._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{admin.name}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail size={14} />
                          {admin.email}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          admin.role === 'superadmin'
                            ? 'bg-purple-100 text-purple-700'
                            : admin.role === 'admin'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {admin.role}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          admin.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {admin.email === user?.email && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                            (You)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {user?.id === '69220b65217c55ce71287f66' && admin._id !== '69220b65217c55ce71287f66' && (
                    <button
                      onClick={async () => {
                        if (confirm(`Are you sure you want to remove ${admin.name}?\n\nThis will permanently delete the admin account and revoke all their active sessions.`)) {
                          try {
                            await adminUsersApi.delete(admin._id)
                            await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
                            toast.success(`${admin.name} removed successfully`)
                          } catch (error: any) {
                            const errorMsg = error.response?.data?.message || 'Failed to remove admin'
                            toast.error(errorMsg)
                            console.error('Delete admin error:', error)
                          }
                        }
                      }}
                      className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      title="Remove this admin user"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No admin users found</p>
            {user?.role === 'superadmin' && (
              <p className="text-sm text-gray-400 mt-2">
                Click "Create Admin" to add new administrators
              </p>
            )}
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Create Admin User</h3>
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  required
                >
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAdminMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
