'use client'

import { useQuery } from '@tanstack/react-query'
import { reportsApi, moderationApi, auditApi } from '@/lib/api'
import { FileText, Shield, Activity, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

export default function DashboardPage() {
  const { data: reportsData } = useQuery({
    queryKey: ['reports', { status: 'open', limit: 5 }],
    queryFn: () => reportsApi.getAll({ status: 'open', limit: 5 }),
  })

  const { data: actionsData } = useQuery({
    queryKey: ['actions', { limit: 5 }],
    queryFn: () => moderationApi.getAll({ limit: 5 }),
  })

  const { data: auditData } = useQuery({
    queryKey: ['audit', { limit: 5 }],
    queryFn: () => auditApi.getAll({ limit: 5 }),
  })

  const stats = [
    {
      name: 'Open Reports',
      value: reportsData?.data?.data?.length || 0,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    {
      name: 'Moderation Actions',
      value: actionsData?.data?.total || 0,
      icon: Shield,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      name: 'Audit Logs',
      value: auditData?.data?.total || 0,
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      name: 'Resolved Today',
      value: 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-2">Monitor your admin operations and moderation activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={stat.color} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Reports</h2>
            <FileText className="text-gray-400" size={20} />
          </div>
          <div className="space-y-3">
            {reportsData?.data?.data?.slice(0, 5).map((report: any) => (
              <div key={report._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{report.reason}</p>
                  <p className="text-sm text-gray-500">{report.targetType}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  report.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                  report.status === 'in_review' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {report.status}
                </span>
              </div>
            ))}
            {(!reportsData?.data?.data || reportsData.data.data.length === 0) && (
              <p className="text-center text-gray-500 py-8">No open reports</p>
            )}
          </div>
        </div>

        {/* Recent Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Actions</h2>
            <Shield className="text-gray-400" size={20} />
          </div>
          <div className="space-y-3">
            {actionsData?.data?.data?.slice(0, 5).map((action: any) => (
              <div key={action._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{action.actionType.replace('_', ' ')}</p>
                  <p className="text-sm text-gray-500">{action.targetType}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(action.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
            {(!actionsData?.data?.data || actionsData.data.data.length === 0) && (
              <p className="text-center text-gray-500 py-8">No recent actions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
