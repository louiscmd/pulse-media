'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavLink {
  href: string
  label: string
  badge?: number
}

interface TopNavProps {
  clientName?: string
  avatarUrl?: string | null
  pendingEdits?: number
}

export default function TopNav({ clientName, avatarUrl, pendingEdits = 0 }: TopNavProps) {
  const pathname = usePathname()

  const NAV_LINKS: NavLink[] = [
    { href: '/', label: 'Home' },
    { href: '/content', label: 'Content' },
    { href: '/edit-review', label: 'Edit Review', badge: pendingEdits },
    { href: '/comms', label: 'Comms' },
    { href: '/reports', label: 'Reports' },
  ]

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-panel/80 backdrop-blur-xl border-b border-border-default">
      {/* Brand mark */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        {/* S-bolt logo */}
        <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 10px rgba(29,217,197,0.4))' }}>
          <defs>
            <linearGradient id="teal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1DD9C5" />
              <stop offset="100%" stopColor="#0CBCAA" />
            </linearGradient>
          </defs>
          {/* Upper bar: full-width top, narrows toward bottom-center-left */}
          <polygon fill="url(#teal-grad)" points="10,8 90,8 90,22 52,58 34,58 10,22" />
          {/* Lower bar: starts right-center, widens to full-width bottom */}
          <polygon fill="url(#teal-grad)" points="48,60 90,60 90,74 66,92 10,92 10,78" />
        </svg>
        <span className="font-semibold text-[15px] text-text tracking-tight">Socialy</span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-5">
        {NAV_LINKS.map(({ href, label, badge }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-1.5 text-[13.5px] font-medium transition-colors duration-150',
                active ? 'text-text' : 'text-text-dim hover:text-text'
              )}
            >
              {label}
              {badge != null && badge > 0 && (
                <span
                  className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10.5px] font-bold text-white leading-none"
                  style={{ background: 'linear-gradient(135deg, #1DD9C5, #0CBCAA)' }}
                >
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
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
