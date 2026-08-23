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
                  style={{ background: 'linear-gradient(135deg, #b47cff, #7c3dff)' }}
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
