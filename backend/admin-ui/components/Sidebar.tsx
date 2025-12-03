'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, Shield, History, Users, BarChart3 } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Moderation', href: '/dashboard/moderation', icon: Shield },
  { name: 'Audit Logs', href: '/dashboard/audit', icon: History },
  { name: 'Admin Users', href: '/dashboard/users', icon: Users },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <BarChart3 size={32} className="text-primary-400" />
          <div>
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <p className="text-xs text-gray-400">AppImmo</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-400 text-center">
          v1.0.0 • © 2025 AppImmo
        </p>
      </div>
    </div>
  )
}
