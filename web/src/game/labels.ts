// Rótulos PT-BR para dados de jogo (reutilizados por vários painéis).

export const PLANET_TYPE_LABEL: Record<string, string> = {
  terran: 'Terran', ocean: 'Oceânico', desert: 'Desértico', volcanic: 'Vulcânico',
  frozen: 'Gelado', dead: 'Morto', gas_giant: 'Gigante Gasoso',
}
export const PLANET_SIZE_LABEL: Record<string, string> = {
  tiny: 'Minúsculo', small: 'Pequeno', medium: 'Médio', large: 'Grande', huge: 'Enorme',
}
export const RICHNESS_LABEL: Record<string, string> = {
  ultra_poor: 'Ultra Pobre', poor: 'Pobre', abundant: 'Abundante', rich: 'Rico', ultra_rich: 'Ultra Rico',
}
export const RACE_LABEL: Record<string, { name: string; color: string }> = {
  humans: { name: 'Humanos', color: '#6FC8FF' },
  zorg:   { name: 'Zorg',    color: '#FF7A7A' },
  sylar:  { name: 'Sylar',   color: '#9CF5B0' },
}
export const SHIP_LABEL: Record<string, string> = {
  scout: 'Batedor', colony: 'Nave Colônia', frigate: 'Fragata', destroyer: 'Destróier',
}
export const RELATION_LABEL: Record<string, string> = {
  peace: 'Paz', war: 'Guerra', neutral: 'Neutro', alliance: 'Aliança',
}

export function fleetSummary(f: { warships: number; colonists: number; scouts: number }): string {
  const parts: string[] = []
  if (f.warships > 0) parts.push(`${f.warships} ⚔`)
  if (f.colonists > 0) parts.push(`${f.colonists} ⚲ colono`)
  if (f.scouts > 0) parts.push(`${f.scouts} ∇ batedor`)
  return parts.join(' · ') || 'vazia'
}
