type Variant = 'success' | 'warn' | 'danger' | 'info' | 'neutral'
const V: Record<Variant, string> = {
  success: 'bg-neon-green/20 text-neon-green',
  warn:    'bg-neon-gold/20 text-neon-gold',
  danger:  'bg-neon-red/20 text-neon-red',
  info:    'bg-neon-blue/20 text-neon-blue',
  neutral: 'bg-white/10 text-white/70',
}
export function Badge({ variant = 'neutral', label }: { variant?: Variant; label: string }) {
  return <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${V[variant]}`}>{label}</span>
}
