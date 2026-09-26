export type Grind = 'cekirdek' | 'filtre' | 'french' | 'espresso' | 'turk'

export const GRINDS: { id: Grind; label: string }[] = [
  { id: 'cekirdek', label: 'Çekirdek' },
  { id: 'filtre', label: 'Filtre (V60, Chemex)' },
  { id: 'french', label: 'French press' },
  { id: 'espresso', label: 'Espresso' },
  { id: 'turk', label: 'Türk kahvesi' },
]

export type Weight = 250 | 1000

export interface Coffee {
  id: string
  origin: string
  farm: string
  region: string
  process: string
  altitude: string
  /** 0 = çok açık, 1 = koyu */
  roast: number
  roastLabel: string
  notes: string[]
  price250: number
  suggestion: string
}

export const COFFEES: Coffee[] = [
  {
    id: 'guji',
    origin: 'Etiyopya',
    farm: 'Guji, Hambela',
    region: 'Oromia bölgesi',
    process: 'Doğal işlem',
    altitude: '2.100 m',
    roast: 0.18,
    roastLabel: 'Açık',
    notes: ['yaban mersini', 'yasemin', 'bergamot'],
    price250: 520,
    suggestion: 'Filtre kahvede meyvemsi yanını en iyi gösterir.',
  },
  {
    id: 'huila',
    origin: 'Kolombiya',
    farm: 'Huila, Finca El Mirador',
    region: 'Pitalito',
    process: 'Yıkanmış',
    altitude: '1.750 m',
    roast: 0.38,
    roastLabel: 'Orta açık',
    notes: ['kırmızı elma', 'panela şekeri', 'portakal kabuğu'],
    price250: 460,
    suggestion: 'Her demleme yöntemiyle dengeli, günlük kahve.',
  },
  {
    id: 'nyeri',
    origin: 'Kenya',
    farm: 'Nyeri, Gichathaini AA',
    region: 'Merkez eyalet',
    process: 'Yıkanmış',
    altitude: '1.800 m',
    roast: 0.24,
    roastLabel: 'Açık',
    notes: ['frenk üzümü', 'greyfurt', 'kamış şekeri'],
    price250: 590,
    suggestion: 'Canlı asidite sevenler için; soğuk demlemede de güzel.',
  },
  {
    id: 'cerrado',
    origin: 'Brezilya',
    farm: 'Cerrado Mineiro, Fazenda Rainha',
    region: 'Minas Gerais',
    process: 'Doğal işlem',
    altitude: '1.100 m',
    roast: 0.68,
    roastLabel: 'Orta koyu',
    notes: ['fındık', 'sütlü çikolata', 'karamel'],
    price250: 380,
    suggestion: 'Espresso, sütlü içecekler ve Türk kahvesi için.',
  },
]

export const priceFor = (coffee: Coffee, weight: Weight) =>
  weight === 250 ? coffee.price250 : Math.round((coffee.price250 * 3.6) / 10) * 10

export const FREE_SHIPPING_FROM = 750

export const tl = (n: number) => `${n.toLocaleString('tr-TR')} TL`
