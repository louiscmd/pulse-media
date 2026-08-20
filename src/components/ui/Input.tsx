import { cn } from '@/lib/utils'
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-panel-2 border border-border-default rounded-xl px-4 py-2.5',
            'text-text text-[13.5px] placeholder:text-text-faint',
            'transition-colors duration-150',
            'focus:outline-none focus:border-purple-soft focus:ring-1 focus:ring-purple/20',
            error && 'border-red/50 focus:border-red/70',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-[12px] text-red">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-2"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-panel-2 border border-border-default rounded-xl px-4 py-2.5',
            'text-text text-[13.5px] placeholder:text-text-faint resize-none',
            'transition-colors duration-150',
            'focus:outline-none focus:border-purple-soft focus:ring-1 focus:ring-purple/20',
            error && 'border-red/50 focus:border-red/70',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-[12px] text-red">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export default Input
