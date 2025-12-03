'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { reportsApi } from '@/lib/api'
import { ArrowLeft, Calendar, User, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const reportId = params.id as string

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => reportsApi.getOne(reportId).then(res => res.data),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) => reportsApi.updateStatus(reportId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', reportId] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      toast.success('Status updated successfully')
    },
    onError: () => {
      toast.error('Failed to update status')
    },
  })

  const assignMutation = useMutation({
    mutationFn: ({ assignedTo }: { assignedTo: string }) => reportsApi.assign(reportId, assignedTo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', reportId] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      toast.success('Report assigned successfully')
    },
    onError: () => {
      toast.error('Failed to assign report')
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'in_review':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'invalid':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-5 h-5" />
      case 'in_review':
        return <Clock className="w-5 h-5" />
      case 'resolved':
        return <CheckCircle className="w-5 h-5" />
      case 'invalid':
        return <XCircle className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case 'property':
        return '🏠 Property'
      case 'user':
        return '👤 User'
      case 'message':
        return '💬 Message'
      default:
        return type
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="p-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-gray-600 mb-6">The report you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/dashboard/reports')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Reports
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/reports')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Reports
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Report Details</h1>
            <p className="text-gray-600 mt-2">ID: {report._id}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(report.status)}`}>
            {getStatusIcon(report.status)}
            <span className="font-semibold capitalize">{report.status.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Target Type</label>
                <p className="text-lg text-gray-900 mt-1">{getTargetTypeLabel(report.targetType)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Target ID</label>
                <p className="text-lg text-gray-900 mt-1 font-mono">{report.targetId}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Reason</label>
                <p className="text-lg text-gray-900 mt-1 capitalize">{report.reason.replace(/_/g, ' ')}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-900 mt-1 leading-relaxed">
                  {report.description || 'No description provided'}
                </p>
              </div>

              {report.resolution && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <label className="text-sm font-medium text-green-900">Resolution</label>
                  <p className="text-green-800 mt-1 leading-relaxed">{report.resolution}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Report Created</p>
                  <p className="text-sm text-gray-600">
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {report.updatedAt !== report.createdAt && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Updated</p>
                    <p className="text-sm text-gray-600">
                      {new Date(report.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <select
                  value={report.status}
                  onChange={(e) => updateStatusMutation.mutate({ status: e.target.value })}
                  disabled={updateStatusMutation.isPending}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                >
                  <option value="open">Open</option>
                  <option value="in_review">In Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="invalid">Invalid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Reported By</label>
                <p className="text-sm text-gray-900 mt-1 font-mono">{report.reporterId}</p>
              </div>

              {report.assignedTo && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Assigned To</label>
                  <p className="text-sm text-gray-900 mt-1 font-mono">{report.assignedTo}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
