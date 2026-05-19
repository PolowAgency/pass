'use client'

import { forwardRef } from 'react'
import clsx from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 cursor-pointer select-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-lime text-bg hover:opacity-90 active:scale-95 glow-lime': variant === 'primary',
            'bg-surface2 text-text border border-border hover:border-muted active:scale-95': variant === 'secondary',
            'bg-transparent text-muted hover:text-text hover:bg-surface2 active:scale-95': variant === 'ghost',
            'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 active:scale-95': variant === 'danger',
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-5 py-2.5 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
          },
          className
        )}
        style={variant === 'primary' ? { backgroundColor: '#C8FF00', color: '#0C0C10' } : undefined}
        {...props}
      >
        {loading && (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
