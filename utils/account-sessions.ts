import { formatDate } from './format'

// Textos da lista "Sessões ativas" (ACO-98). O User-Agent cru vira "Chrome no
// macOS". A rede do IP fica fora da tela por enquanto: em produção a API vê o
// IP do BFF, não o do navegador, até o Caddy confiar no X-Forwarded-For
// (trusted_proxies) e TRUSTED_PROXY_CIDRS incluir as faixas do BFF.

export type DeviceKind = 'phone' | 'desktop'

const browsers: [RegExp, string][] = [
  [/Edg(e|A|iOS)?\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/SamsungBrowser\//, 'Samsung Internet'],
  [/Firefox\/|FxiOS\//, 'Firefox'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Safari\//, 'Safari'],
]

const systems: [RegExp, string][] = [
  [/iPhone/, 'iPhone'],
  [/iPad/, 'iPad'],
  [/Android/, 'Android'],
  [/Windows/, 'Windows'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/CrOS/, 'ChromeOS'],
  [/Linux/, 'Linux'],
]

export function describeDevice(userAgent: string): { label: string, kind: DeviceKind } {
  const browser = browsers.find(([pattern]) => pattern.test(userAgent))?.[1]
  const system = systems.find(([pattern]) => pattern.test(userAgent))?.[1]
  const kind: DeviceKind = /iPhone|Android.+Mobile|Mobile Safari|Mobi/.test(userAgent) ? 'phone' : 'desktop'
  if (browser && system) return { label: `${browser} no ${system}`, kind }
  if (browser) return { label: browser, kind }
  if (system) return { label: `Navegador no ${system}`, kind }
  return { label: 'Navegador não identificado', kind }
}

// Último uso, gravado no máximo a cada 5 minutos: abaixo disso é "agora".
export function lastSeenLabel(iso: string, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000)
  if (minutes < 5) return 'ativa agora'
  if (minutes < 60) return `ativa há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours === 1 ? 'ativa há 1 hora' : `ativa há ${hours} horas`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'ativa há 1 dia' : `ativa há ${days} dias`
}

export function sessionMeta(session: { startedAt: string, lastSeenAt: string, current: boolean }, now: Date = new Date()): string {
  return [`desde ${formatDate(session.startedAt)}`, session.current ? 'ativa agora' : lastSeenLabel(session.lastSeenAt, now)].join(' · ')
}
