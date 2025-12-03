'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { reportsApi } from '@/lib/api'
import { FileText, Download, Eye, AlertCircle, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const router = useRouter()
  const [filters, setFilters] = useState({
    status: '',
    targetType: '',
    page: 1,
    limit: 20,
  })
  const [showExportMenu, setShowExportMenu] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reports', filters],
    queryFn: () => {
      // Remove empty string values from filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      )
      return reportsApi.getAll(cleanFilters)
    },
  })

  const handleExport = async (status?: string | null) => {
    try {
      setShowExportMenu(false)
      toast.loading('Exporting reports...')
      
      // Build export filters
      const exportFilters: any = {}
      if (status === null) {
        // Export all reports - no filters
      } else if (status !== undefined) {
        // Export specific status
        exportFilters.status = status
      } else {
        // Use current filters if no specific option selected
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== '' && key !== 'page' && key !== 'limit') {
            exportFilters[key] = value
          }
        })
      }
      
      const response = await reportsApi.export(exportFilters)
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      
      // Create download link
      const link = document.createElement('a')
      link.href = url
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const statusLabel = status ? `-${status}` : ''
      link.setAttribute('download', `reports${statusLabel}-${timestamp}.csv`)
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.dismiss()
      toast.success('Reports exported successfully')
    } catch (error: any) {
      toast.dismiss()
      console.error('Export error:', error)
      const errorMsg = error.response?.data?.message || 'Failed to export reports'
      toast.error(errorMsg)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_review':
        return 'bg-blue-100 text-blue-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'invalid':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports Management</h1>
          <p className="text-gray-600 mt-2">Review and manage user reports</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={20} />
            Export CSV
          </button>
          
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="py-2">
                <button
                  onClick={() => handleExport()}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-900 flex items-center gap-2"
                >
                  <Download size={16} />
                  <span>Current Filters</span>
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => handleExport('open')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-900 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>Open Reports</span>
                </button>
                <button
                  onClick={() => handleExport('in_review')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-900 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>In Review Reports</span>
                </button>
                <button
                  onClick={() => handleExport('resolved')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-900 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Resolved Reports</span>
                </button>
                <button
                  onClick={() => handleExport('invalid')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-900 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  <span>Invalid Reports</span>
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => handleExport(null)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-900 flex items-center gap-2"
                >
                  <Download size={16} />
                  <span>All Reports</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Click outside to close menu */}
      {showExportMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowExportMenu(false)}
        ></div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="invalid">Invalid</option>
          </select>

          <select
            value={filters.targetType}
            onChange={(e) => setFilters({ ...filters, targetType: e.target.value, page: 1 })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
          >
            <option value="">All Types</option>
            <option value="property">Property</option>
            <option value="user">User</option>
            <option value="message">Message</option>
          </select>

          <button
            onClick={() => setFilters({ status: '', targetType: '', page: 1, limit: 20 })}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading reports...</p>
          </div>
        ) : data?.data?.data && data.data.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.data.data.map((report: any) => (
                    <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        {report._id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{report.reason}</p>
                          {report.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {report.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full capitalize">
                          {report.targetType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(report.status)}`}>
                          {report.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => router.push(`/dashboard/reports/${report._id}`)}
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Total: {data.data.total} reports
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page * filters.limit >= (data.data.total || 0)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No reports found</p>
          </div>
        )}
      </div>
    </div>
  )
}
