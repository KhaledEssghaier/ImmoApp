'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { moderationApi } from '@/lib/api'
import { Shield, Ban, AlertTriangle, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

type ModalType = 'ban' | 'warning' | 'remove' | null

export default function ModerationPage() {
  const [activeTab, setActiveTab] = useState<'actions' | 'banned'>('actions')
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [formData, setFormData] = useState({
    userId: '',
    propertyId: '',
    targetId: '',
    targetType: 'user',
    reason: '',
    durationDays: null as number | null,
  })
  
  const queryClient = useQueryClient()

  const { data: actions, isLoading } = useQuery({
    queryKey: ['moderation-actions'],
    queryFn: () => moderationApi.getAll({ page: 1, limit: 20 }).then(res => res.data),
    enabled: activeTab === 'actions',
  })

  const { data: bannedUsers, isLoading: isLoadingBanned } = useQuery({
    queryKey: ['banned-users'],
    queryFn: () => moderationApi.getBannedUsers({ page: 1, limit: 20 }).then(res => res.data),
    enabled: activeTab === 'banned',
  })

  const banUserMutation = useMutation({
    mutationFn: (data: any) => moderationApi.banUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-actions'] })
      toast.success('User banned successfully')
      setActiveModal(null)
      resetForm()
    },
    onError: () => {
      toast.error('Failed to ban user')
    },
  })

  const issueWarningMutation = useMutation({
    mutationFn: (data: any) => moderationApi.issueWarning(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-actions'] })
      toast.success('Warning issued successfully')
      setActiveModal(null)
      resetForm()
    },
    onError: () => {
      toast.error('Failed to issue warning')
    },
  })

  const removePropertyMutation = useMutation({
    mutationFn: (data: any) => moderationApi.removeProperty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-actions'] })
      toast.success('Property removed successfully')
      setActiveModal(null)
      resetForm()
    },
    onError: () => {
      toast.error('Failed to remove property')
    },
  })

  const resetForm = () => {
    setFormData({
      userId: '',
      propertyId: '',
      targetId: '',
      targetType: 'user',
      reason: '',
      durationDays: null,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (activeModal === 'ban') {
      const banData: any = {
        userId: formData.userId,
        reason: formData.reason,
      }
      // Only include durationDays if it's not null (permanent ban)
      if (formData.durationDays !== null) {
        banData.durationDays = formData.durationDays
      }
      banUserMutation.mutate(banData)
    } else if (activeModal === 'warning') {
      issueWarningMutation.mutate({
        targetType: formData.targetType,
        targetId: formData.targetId,
        reason: formData.reason,
      })
    } else if (activeModal === 'remove') {
      removePropertyMutation.mutate({
        propertyId: formData.propertyId,
        reason: formData.reason,
      })
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Moderation Tools</h1>
        <p className="text-gray-600 mt-2">Manage users, properties, and content moderation</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'actions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Moderation Actions
          </button>
          <button
            onClick={() => setActiveTab('banned')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'banned'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Banned Users
          </button>
        </nav>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button 
          onClick={() => setActiveModal('ban')}
          className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-red-300 hover:shadow-md transition-all text-left"
        >
          <Ban className="w-8 h-8 text-red-500 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Ban User</h3>
          <p className="text-sm text-gray-600">Permanently ban a user from the platform</p>
        </button>

        <button 
          onClick={() => setActiveModal('warning')}
          className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all text-left"
        >
          <AlertTriangle className="w-8 h-8 text-orange-500 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Issue Warning</h3>
          <p className="text-sm text-gray-600">Send a warning to a user for policy violation</p>
        </button>

        <button 
          onClick={() => setActiveModal('remove')}
          className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left"
        >
          <Trash2 className="w-8 h-8 text-purple-500 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Remove Property</h3>
          <p className="text-sm text-gray-600">Remove a property listing from the platform</p>
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {(activeTab === 'actions' && isLoading) || (activeTab === 'banned' && isLoadingBanned) ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        ) : activeTab === 'actions' && actions?.data && actions.data.length > 0 ? (
          <div className="space-y-4">
            {actions.data.map((action: any) => (
              <div key={action._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{action.actionType}</p>
                    <p className="text-sm text-gray-600 mt-1">{action.reason}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(action.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                    {action.targetType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'banned' && bannedUsers?.data && bannedUsers.data.length > 0 ? (
          <div className="space-y-4">
            {bannedUsers.data.map((user: any) => {
              const daysLeft = user.ban?.expiresAt 
                ? Math.ceil((new Date(user.ban.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;
              
              const badgeText = user.ban?.isPermanent 
                ? 'Permanent Ban' 
                : daysLeft && daysLeft > 0 
                  ? `${daysLeft} Day${daysLeft !== 1 ? 's' : ''}` 
                  : daysLeft === 0 || (daysLeft && daysLeft < 0)
                    ? 'Expired'
                    : 'Temporary';

              const badgeClass = user.ban?.isPermanent 
                ? 'bg-red-100 text-red-700' 
                : 'bg-orange-100 text-orange-700';

              // Build complete date string
              let dateString = user.ban?.bannedAt ? new Date(user.ban.bannedAt).toLocaleString() : 'Date unknown';
              if (user.ban?.expiresAt) {
                dateString += ` • Expires: ${new Date(user.ban.expiresAt).toLocaleString()}`;
              }
              if (daysLeft !== null) {
                if (daysLeft > 0) {
                  dateString += ` (${daysLeft} day${daysLeft !== 1 ? 's' : ''} left)`;
                } else if (daysLeft <= 0) {
                  dateString += ' (Expired)';
                }
              }

              return (
                <div key={user._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{user.email || user.username}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Banned: {user.ban?.reason || 'No reason provided'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {dateString}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${badgeClass}`}>
                        {badgeText}
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(`Unban user ${user.email}?`)) {
                            moderationApi.unbanUser(user._id, 'Admin unban').then(() => {
                              queryClient.invalidateQueries({ queryKey: ['banned-users'] })
                              toast.success('User unbanned')
                            }).catch(() => toast.error('Failed to unban user'))
                          }
                        }}
                        className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        Unban
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            {activeTab === 'actions' ? (
              <>
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No moderation actions found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Recent moderation actions will appear here
                </p>
              </>
            ) : (
              <>
                <Ban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No banned users</p>
                <p className="text-sm text-gray-400 mt-2">
                  Banned users will appear here
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {activeModal === 'ban' && 'Ban User'}
                {activeModal === 'warning' && 'Issue Warning'}
                {activeModal === 'remove' && 'Remove Property'}
              </h3>
              <button
                onClick={() => { setActiveModal(null); resetForm(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeModal === 'ban' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="Enter user ID..."
                    required
                  />
                </div>
              )}

              {activeModal === 'warning' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Type
                    </label>
                    <select
                      value={formData.targetType}
                      onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    >
                      <option value="user">User</option>
                      <option value="property">Property</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target ID
                    </label>
                    <input
                      type="text"
                      value={formData.targetId}
                      onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                      placeholder="Enter target ID..."
                      required
                    />
                  </div>
                </>
              )}

              {activeModal === 'remove' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property ID
                  </label>
                  <input
                    type="text"
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="Enter property ID..."
                    required
                  />
                </div>
              )}

              {activeModal === 'ban' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (leave empty for permanent)
                  </label>
                  <select
                    value={formData.durationDays === null ? '' : formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  >
                    <option value="">Permanent</option>
                    <option value="30">30 Days</option>
                    <option value="7">7 Days</option>
                    <option value="1">1 Day</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  rows={4}
                  placeholder="Explain the reason for this action..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setActiveModal(null); resetForm(); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={banUserMutation.isPending || issueWarningMutation.isPending || removePropertyMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {(banUserMutation.isPending || issueWarningMutation.isPending || removePropertyMutation.isPending) ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
