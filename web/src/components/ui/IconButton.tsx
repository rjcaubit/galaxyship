import React from 'react'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string; label: string; size?: 'sm' | 'md' | 'lg'
}
export function IconButton({ icon, label, size = 'md', className = '', ...props }: IconButtonProps) {
  const S = { sm: 'h-9 w-9 text-base', md: 'h-11 w-11 text-xl', lg: 'h-12 w-12 text-2xl' }
  return (
    <button {...props} aria-label={label}
      className={`flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 active:bg-white/20 transition-colors ${S[size]} ${className}`}>
      {icon}
    </button>
  )
}
