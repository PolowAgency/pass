'use client'

import { forwardRef } from 'react'
import clsx from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium" style={{ color: '#F0F0F8' }}>
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B6B88' }}>
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full rounded-xl border text-sm transition-all duration-200',
              'placeholder:text-muted focus:outline-none',
              leftIcon ? 'pl-10 pr-4 py-3' : 'px-4 py-3',
              error
                ? 'border-red-500/50 bg-red-500/5 focus:border-red-500'
                : 'border-border bg-surface2 focus:border-lime/50',
              className
            )}
            style={{
              color: '#F0F0F8',
              backgroundColor: '#1E1E28',
              borderColor: error ? undefined : '#2A2A38',
            }}
            {...props}
          />
        </div>
        {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
