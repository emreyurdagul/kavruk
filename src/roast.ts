/**
 * Basit bir kavrum eğrisi modeli (çekirdek sıcaklığı, °C — dakika).
 * Şarj 200 °C'de yapılır, çekirdekler ~1,2. dakikada 92 °C'ye düşer (dönüş
 * noktası), sonra ısınma hızı azalarak yükselir. Birinci çatlama ~8,5.
 * dakikada, ~198 °C'de gelir; sonrası gelişim süresidir.
 */

export const FIRST_CRACK = 8.5
export const DROP_MIN = 9.4
export const DROP_MAX = 13

export function beanTemp(t: number): number {
  if (t <= 1.2) {
    const k = t / 1.2
    return 200 - (200 - 92) * Math.sqrt(k)
  }
  const base = 92 + 125 * (1 - Math.exp(-(t - 1.2) / 3.8))
  const after = t > FIRST_CRACK ? 3.2 * Math.pow(t - FIRST_CRACK, 1.1) : 0
  return base + after
}

export interface RoastResult {
  dropTemp: number
  development: number
  /** 0 = en açık, 1 = en koyu */
  darkness: number
  level: 'Açık' | 'Orta' | 'Koyu'
  notes: string[]
  brew: { method: string; recipe: string }
}

export function roastFor(drop: number): RoastResult {
  const dropTemp = beanTemp(drop)
  const development = (drop - FIRST_CRACK) / drop
  const darkness = Math.min(1, Math.max(0, (dropTemp - 200) / 26))
  if (darkness < 0.34) {
    return {
      dropTemp, development, darkness, level: 'Açık',
      notes: ['yasemin', 'bergamot', 'beyaz şeftali'],
      brew: { method: 'V60', recipe: '15 g kahve, 250 ml su, 94 °C, 2 dk 45 sn' },
    }
  }
  if (darkness < 0.67) {
    return {
      dropTemp, development, darkness, level: 'Orta',
      notes: ['karamel', 'sütlü çikolata', 'kırmızı elma'],
      brew: { method: 'Chemex', recipe: '30 g kahve, 480 ml su, 92 °C, 4 dk' },
    }
  }
  return {
    dropTemp, development, darkness, level: 'Koyu',
    notes: ['bitter çikolata', 'kavrulmuş fındık', 'pekmez'],
    brew: { method: 'Türk kahvesi', recipe: '7 g kahve, 70 ml su, cezvede kısık ateş' },
  }
}

/** Çiğ çekirdekten koyu kavruma renk yelpazesi */
const SPECTRUM: [number, number, number][] = [
  [196, 168, 110],
  [178, 118, 62],
  [128, 72, 38],
  [74, 42, 24],
  [44, 26, 17],
]

export function beanColor(darkness: number): string {
  const x = Math.min(0.9999, Math.max(0, darkness)) * (SPECTRUM.length - 1)
  const i = Math.floor(x)
  const f = x - i
  const [a, b] = [SPECTRUM[i], SPECTRUM[i + 1]]
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f))
  return `rgb(${c.join(',')})`
}
