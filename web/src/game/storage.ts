// Abstração de armazenamento — isola localStorage para portabilidade futura
// (React Native usaria AsyncStorage por trás da mesma interface).
const memoryFallback: Record<string, string> = {}
const hasLS = typeof window !== 'undefined' && !!window.localStorage

export const storage = {
  get(key: string): string | null {
    if (hasLS) return window.localStorage.getItem(key)
    return memoryFallback[key] ?? null
  },
  set(key: string, value: string): void {
    if (hasLS) window.localStorage.setItem(key, value)
    else memoryFallback[key] = value
  },
  remove(key: string): void {
    if (hasLS) window.localStorage.removeItem(key)
    else delete memoryFallback[key]
  },
}
