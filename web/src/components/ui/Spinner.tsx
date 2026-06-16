export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const S = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }
  return <span className={`inline-block animate-spin rounded-full border-2 border-neon-blue border-t-transparent ${S[size]}`} />
}
