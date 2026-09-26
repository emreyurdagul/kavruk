import { useEffect, useMemo, useRef, useState } from 'react'
import RoastProfile from './RoastProfile'
import { COFFEES, FREE_SHIPPING_FROM, GRINDS, priceFor, tl, type Coffee, type Grind, type Weight } from './data'
import { beanColor } from './roast'

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
            <h1>Perşembe kavrulur, cumartesi fincanınızda.</h1>
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
          <ol>
            <li><b>Çarşamba 23.59</b><span>Siparişler kapanır, kavrum listesi çıkar.</span></li>
            <li><b>Perşembe</b><span>Sabah kavrulur, akşam dinlenmeye bırakılır. Paket üzerine tarih basılır.</span></li>
            <li><b>Cuma</b><span>Valfli paketlerle kargoya verilir.</span></li>
            <li><b>Cumartesi</b><span>İstanbul içi teslim. Diğer şehirlere pazartesi.</span></li>
          </ol>
        </section>

        <section className="wholesale" id="kafeler" aria-labelledby="ws-title">
          <div>
            <h2 id="ws-title">Kafeniz için kavuruyoruz</h2>
            <p>
              Menünüze göre espresso harmanı ve filtre seçkisi hazırlıyoruz. Önce 1 kiloluk deneme paketi
              gönderiyoruz, beğenirseniz haftalık teslimata geçiyoruz.
            </p>
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
