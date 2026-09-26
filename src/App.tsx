import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import RoastProfile from './RoastProfile'
import Loader from './Loader'
import Bean from './Bean'
import { useScrollScenes } from './useScrollScenes'
import { COFFEES, FREE_SHIPPING_FROM, GRINDS, priceFor, tl, type Coffee, type Grind, type Weight } from './data'
import { beanColor } from './roast'

const HEADLINE = 'Perşembe kavrulur, cumartesi fincanınızda.'

/** Bu haftanın kavrum günü: en yakın perşembe */
const ROAST_DATE = (() => {
  const d = new Date()
  d.setDate(d.getDate() + ((4 - d.getDay() + 7) % 7))
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
})()

interface Line { key: string; coffee: Coffee; grind: Grind; weight: Weight; qty: number }

function Wordmark() {
  return (
    <a href="#top" className="wordmark" aria-label="Kavruk ana sayfa">
      <svg viewBox="0 0 24 30" aria-hidden="true"><ellipse cx="12" cy="15" rx="10" ry="13.5" /><path d="M12 2.5 C 7.5 10, 16.5 20, 12 27.5" /></svg>
      kavruk
    </a>
  )
}

function ShelfRow({ coffee, onAdd }: { coffee: Coffee; onAdd: (c: Coffee, g: Grind, w: Weight) => void }) {
  const [grind, setGrind] = useState<Grind>(coffee.roast > 0.5 ? 'espresso' : 'filtre')
  const [weight, setWeight] = useState<Weight>(250)
  const [added, setAdded] = useState(false)
  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(t)
  }, [added])

  return (
    <article className="shelf-row">
      <div className="bag" style={{ ['--bean' as string]: beanColor(coffee.roast) }}>
        <span className="bag-date">Kavrum<b>{ROAST_DATE}</b></span>
        <span className="bag-origin">{coffee.origin}</span>
        <span className="bag-roast" aria-label={`Kavrum: ${coffee.roastLabel}`}>
          <i style={{ left: `${coffee.roast * 100}%` }} />
        </span>
        <span className="bag-level">{coffee.roastLabel}</span>
      </div>
      <div className="shelf-info">
        <h3>{coffee.farm}</h3>
        <p className="shelf-meta">{coffee.region}, {coffee.altitude}. {coffee.process}.</p>
        <p className="shelf-notes">{coffee.notes.join(', ')}</p>
        <p className="shelf-tip">{coffee.suggestion}</p>
      </div>
      <form
        className="shelf-buy"
        onSubmit={e => {
          e.preventDefault()
          onAdd(coffee, grind, weight)
          setAdded(true)
        }}
      >
        <label>
          Öğütme
          <select value={grind} onChange={e => setGrind(e.target.value as Grind)}>
            {GRINDS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </label>
        <fieldset className="weights">
          <legend>Paket</legend>
          {([250, 1000] as Weight[]).map(w => (
            <label key={w} className={weight === w ? 'on' : ''}>
              <input type="radio" name={`w-${coffee.id}`} checked={weight === w} onChange={() => setWeight(w)} />
              {w === 250 ? '250 g' : '1 kg'}
            </label>
          ))}
        </fieldset>
        <button type="submit" className="add">
          {added ? 'Sepete eklendi' : `Sepete ekle, ${tl(priceFor(coffee, weight))}`}
        </button>
      </form>
    </article>
  )
}

function Cart({ open, lines, onClose, onQty }: {
  open: boolean
  lines: Line[]
  onClose: () => void
  onQty: (key: string, d: number) => void
}) {
  const total = lines.reduce((s, l) => s + priceFor(l.coffee, l.weight) * l.qty, 0)
  const left = Math.max(0, FREE_SHIPPING_FROM - total)
  const [notice, setNotice] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div className={`cart-layer ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="cart-scrim" onClick={onClose} />
      <aside className="cart" role="dialog" aria-modal="true" aria-label="Sepet">
        <header>
          <h2>Sepet</h2>
          <button ref={closeRef} className="ghost" onClick={onClose}>Kapat</button>
        </header>
        {lines.length === 0 ? (
          <p className="empty">Sepet boş. Bu haftanın kavrumlarından birini ekleyin, perşembe kavrulsun.</p>
        ) : (
          <>
            <ul>
              {lines.map(l => (
                <li key={l.key}>
                  <span className="dot" style={{ background: beanColor(l.coffee.roast) }} />
                  <div>
                    <strong>{l.coffee.farm}</strong>
                    <small>{l.weight === 250 ? '250 g' : '1 kg'}, {GRINDS.find(g => g.id === l.grind)!.label}</small>
                  </div>
                  <div className="qty">
                    <button onClick={() => onQty(l.key, -1)} aria-label="Bir azalt">−</button>
                    <span>{l.qty}</span>
                    <button onClick={() => onQty(l.key, 1)} aria-label="Bir artır">+</button>
                  </div>
                  <span className="line-price">{tl(priceFor(l.coffee, l.weight) * l.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="ship">
              <div className="ship-bar"><i style={{ width: `${Math.min(100, (total / FREE_SHIPPING_FROM) * 100)}%` }} /></div>
              <p>{left > 0 ? `Ücretsiz kargoya ${tl(left)} kaldı` : 'Kargo ücretsiz'}</p>
            </div>
            <div className="total"><span>Toplam</span><strong>{tl(total)}</strong></div>
            <button className="add wide" onClick={() => setNotice(true)}>Ödemeye geç</button>
            {notice && <p className="notice" role="status">Bu bir konsept çalışma; gerçek sipariş ve ödeme alınmıyor.</p>}
          </>
        )}
      </aside>
    </div>
  )
}

function Wholesale() {
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  if (sent) {
    return <p className="form-done" role="status">Talebiniz alındı. Bir iş günü içinde deneme paketi için size yazacağız.</p>
  }
  return (
    <form
      className="wholesale-form"
      noValidate
      onSubmit={e => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const next: Record<string, string> = {}
        if (!String(f.get('name') ?? '').trim()) next.name = 'İşletmenizin adını yazın.'
        if (!/^\S+@\S+\.\S+$/.test(String(f.get('email') ?? ''))) next.email = 'Geçerli bir e-posta adresi yazın, örn. ad@kafe.com.'
        setErrors(next)
        if (!Object.keys(next).length) setSent(true)
      }}
    >
      <label>
        İşletme adı
        <input name="name" aria-invalid={!!errors.name} aria-describedby="err-name" />
        {errors.name && <span id="err-name" className="err">{errors.name}</span>}
      </label>
      <label>
        E-posta
        <input name="email" type="email" aria-invalid={!!errors.email} aria-describedby="err-email" />
        {errors.email && <span id="err-email" className="err">{errors.email}</span>}
      </label>
      <label>
        Haftalık ihtiyaç
        <select name="kg" defaultValue="5">
          <option value="2">2–5 kg</option>
          <option value="5">5–15 kg</option>
          <option value="15">15 kg üzeri</option>
        </select>
      </label>
      <button type="submit" className="add">Deneme paketi iste</button>
    </form>
  )
}

export default function App() {
  const [introDone, setIntroDone] = useState(false)
  const finishIntro = useCallback(() => setIntroDone(true), [])
  useScrollScenes(introDone)
  useLayoutEffect(() => {
    // Başlık açılıştan önce görünüp sonra kaybolmasın: harfler gizli başlar
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.set('.hero h1 .ch', { opacity: 0 })
  }, [])
  useEffect(() => {
    if (!introDone || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Başlık harfleri açıktan koyuya "kavrularak" belirir
    const tween = gsap.fromTo('.hero h1 .ch',
      { color: '#c4a86e', y: '0.35em', opacity: 0 },
      { color: '#2a1b12', y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', stagger: 0.025 })
    return () => { tween.revert() }
  }, [introDone])
  const [lines, setLines] = useState<Line[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines])

  const add = (coffee: Coffee, grind: Grind, weight: Weight) => {
    const key = `${coffee.id}-${grind}-${weight}`
    setLines(ls => ls.some(l => l.key === key)
      ? ls.map(l => (l.key === key ? { ...l, qty: l.qty + 1 } : l))
      : [...ls, { key, coffee, grind, weight, qty: 1 }])
  }
  const qty = (key: string, d: number) =>
    setLines(ls => ls.map(l => (l.key === key ? { ...l, qty: l.qty + d } : l)).filter(l => l.qty > 0))

  return (
    <>
      <Loader onDone={finishIntro} />
      <div className="flying-bean" aria-hidden="true"><Bean color={beanColor(0.3)} /></div>
      <header className="site-head" id="top">
        <Wordmark />
        <nav aria-label="Ana menü">
          <a href="#kavrumlar">Bu hafta</a>
          <a href="#takvim">Kavrum takvimi</a>
          <a href="#kafeler">Kafeler için</a>
        </nav>
        <button className="cart-btn" onClick={() => setCartOpen(true)}>
          Sepet <span className="count">{count}</span>
        </button>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <h1 aria-label={HEADLINE}>
              {HEADLINE.split(' ').map((word, w) => (
                <span className="word" key={w} aria-hidden="true">
                  {[...word].map((ch, c) => <span className="ch" key={c}>{ch}</span>)}
                </span>
              ))}
            </h1>
            <p>
              Karaköy'deki atölyemizde her hafta 15 kiloluk küçük partilerle kavuruyoruz. Her pakette kavrum
              tarihi yazar; en taze haliyle, üç gün içinde kapınızda.
            </p>
            <a className="add" href="#kavrumlar">Bu haftanın kahvelerine bakın</a>
          </div>
          <RoastProfile />
        </section>

        <section className="shelf" id="kavrumlar" aria-labelledby="shelf-title">
          <div className="section-head">
            <h2 id="shelf-title">Bu haftanın kavrumları</h2>
            <p>Siparişler çarşamba gece yarısı kapanır. Kalan stok perşembe sabahı güncellenir.</p>
          </div>
          {COFFEES.map(c => <ShelfRow key={c.id} coffee={c} onAdd={add} />)}
        </section>

        <section className="calendar" id="takvim" aria-labelledby="cal-title">
          <h2 id="cal-title">Siparişten fincana üç gün</h2>
          <div className="track" aria-hidden="true">
            <div className="track-fill" />
            <div className="track-parcel">
              <svg viewBox="0 0 34 40"><path d="M4 8 h26 l2 30 h-30 z" /><path d="M4 8 l3 -6 h20 l3 6" className="fold" /><circle cx="17" cy="22" r="5" className="seal" /></svg>
            </div>
          </div>
          <ol>
            <li><b>Çarşamba 23.59</b><span>Siparişler kapanır, kavrum listesi çıkar.</span><em>Sipariş alındı</em></li>
            <li><b>Perşembe</b><span>Sabah kavrulur, akşam dinlenmeye bırakılır. Paket üzerine tarih basılır.</span><em>Kavruldu</em></li>
            <li><b>Cuma</b><span>Valfli paketlerle kargoya verilir.</span><em>Kargoda</em></li>
            <li><b>Cumartesi</b><span>İstanbul içi teslim. Diğer şehirlere pazartesi.</span><em>Kapınızda</em></li>
          </ol>
        </section>

        <section className="wholesale" id="kafeler" aria-labelledby="ws-title">
          <div>
            <h2 id="ws-title">Kafeniz için kavuruyoruz</h2>
            <p>
              Menünüze göre espresso harmanı ve filtre seçkisi hazırlıyoruz. Önce 1 kiloluk deneme paketi
              gönderiyoruz, beğenirseniz haftalık teslimata geçiyoruz.
            </p>
            <svg className="v60" viewBox="0 0 220 230" aria-hidden="true">
              <g className="steam">
                <path d="M84 96 C 70 76, 98 62, 84 40 S 92 10, 86 0" />
                <path d="M110 96 C 96 72, 126 58, 110 34 S 118 8, 112 -4" />
                <path d="M136 96 C 124 78, 150 64, 136 42 S 142 14, 138 2" />
              </g>
              <path className="cone" d="M50 104 h120 l-34 58 h-52 z" />
              <path className="cone-rib" d="M92 112 l12 44 M110 112 v44 M128 112 l-12 44" />
              <rect className="collar" x="78" y="162" width="64" height="8" rx="2" />
              <path className="server" d="M70 172 h80 v34 a18 18 0 0 1 -18 18 h-44 a18 18 0 0 1 -18 -18 z" />
              <rect className="coffee" x="74" y="190" width="72" height="16" rx="3" />
            </svg>
          </div>
          <Wholesale />
        </section>
      </main>

      <footer className="site-foot">
        <Wordmark />
        <p>Kemankeş Karamustafa Paşa, Karaköy, İstanbul</p>
        <p className="concept">Konsept çalışma. Kavruk gerçek bir işletme değildir.</p>
      </footer>

      <Cart open={cartOpen} lines={lines} onClose={() => setCartOpen(false)} onQty={qty} />
    </>
  )
}
