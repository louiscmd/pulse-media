'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/content', label: 'Content' },
  { href: '/comms', label: 'Comms' },
  { href: '/reports', label: 'Reports' },
]

interface TopNavProps {
  clientName?: string
  avatarUrl?: string | null
}

export default function TopNav({ clientName, avatarUrl }: TopNavProps) {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-panel/80 backdrop-blur-xl border-b border-border-default">
      {/* Brand mark */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <div
          className="w-8 h-8 rounded-pill flex items-center justify-center text-white font-bold text-sm"
          style={{
            background: 'linear-gradient(135deg, #b47cff, #6f2dff)',
            boxShadow: '0 0 24px rgba(155,92,255,0.3)',
          }}
        >
          P
        </div>
        <span className="font-semibold text-[15px] text-text tracking-tight">Pulse Media</span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-6">
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'text-[13.5px] font-medium transition-colors duration-150',
                active ? 'text-text' : 'text-text-dim hover:text-text'
              )}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-3 shrink-0">
        <Link href="/settings">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={clientName ?? 'Account'}
              className="w-8 h-8 rounded-full object-cover border border-border-default hover:border-purple-soft transition-colors"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-purple/20 border border-purple-soft flex items-center justify-center text-[13px] font-semibold text-purple hover:bg-purple/30 transition-colors cursor-pointer">
              {clientName?.[0]?.toUpperCase() ?? 'C'}
            </div>
          )}
        </Link>
      </div>
    </nav>
  )
}
