import React from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?:    Size
  loading?: boolean
  children: React.ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary:   'bg-neon-blue text-space-dark hover:brightness-110 active:brightness-90',
  secondary: 'bg-space-light text-white border border-neon-blue/40 hover:border-neon-blue',
  danger:    'bg-neon-red/20 text-neon-red border border-neon-red/40 hover:bg-neon-red/30',
  ghost:     'bg-transparent text-white hover:bg-white/10',
}
const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-base',   // 44px = touch target mínimo
  lg: 'h-12 px-6 text-lg',
}

export function Button({ variant = 'primary', size = 'md', loading, disabled, className = '', children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all
        ${VARIANTS[variant]} ${SIZES[size]}
        disabled:opacity-40 disabled:cursor-not-allowed
        min-w-[44px] ${className}`}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : children}
    </button>
  )
}
