'use client'

import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // Base
          'inline-flex items-center justify-center gap-2 font-semibold rounded-pill transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
          // Sizes
          size === 'sm' && 'px-4 py-1.5 text-[12.5px]',
          size === 'md' && 'px-5 py-2 text-[13.5px]',
          size === 'lg' && 'px-7 py-3 text-[15px]',
          // Variants
          variant === 'primary' && [
            'bg-gradient-to-br from-[#b47cff] to-[#7c3dff] text-white',
            'shadow-[0_8px_24px_-8px_rgba(124,61,255,0.6)]',
            'hover:shadow-[0_8px_32px_-6px_rgba(124,61,255,0.75)] hover:brightness-110',
            'active:scale-[0.98]',
          ],
          variant === 'ghost' && [
            'bg-transparent text-text-dim hover:text-text hover:bg-white/5',
          ],
          variant === 'outline' && [
            'bg-transparent border border-border-default text-text-dim',
            'hover:border-purple-soft hover:text-text',
          ],
          variant === 'danger' && [
            'bg-transparent border border-red/30 text-red',
            'hover:bg-red/10 hover:border-red/60',
          ],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
