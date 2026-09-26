import { useId, useMemo, useRef, useState } from 'react'
import { beanColor, beanTemp, DROP_MAX, DROP_MIN, FIRST_CRACK, roastFor } from './roast'

const W = 560
const H = 300
const PAD = { l: 44, r: 16, t: 18, b: 34 }
const T_MAX = 13.5
const Y_MIN = 80
const Y_MAX = 235

const x = (t: number) => PAD.l + (t / T_MAX) * (W - PAD.l - PAD.r)
const y = (c: number) => PAD.t + (1 - (c - Y_MIN) / (Y_MAX - Y_MIN)) * (H - PAD.t - PAD.b)
const tFromX = (px: number) => ((px - PAD.l) / (W - PAD.l - PAD.r)) * T_MAX

function pathTo(drop: number) {
  const pts: string[] = []
  for (let t = 0; t <= drop + 1e-6; t += 0.1) pts.push(`${x(t).toFixed(1)},${y(beanTemp(t)).toFixed(1)}`)
  pts.push(`${x(drop).toFixed(1)},${y(beanTemp(drop)).toFixed(1)}`)
  return 'M' + pts.join(' L')
}

function Bean({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 120 150" className="bean" aria-hidden="true">
      <ellipse cx="60" cy="75" rx="46" ry="62" fill={color} />
      <path d="M60 16 C 40 50, 80 100, 60 134" stroke="rgba(20,10,5,.55)" strokeWidth="6" fill="none" strokeLinecap="round" />
      <ellipse cx="42" cy="52" rx="10" ry="20" fill="rgba(255,255,255,.14)" transform="rotate(-18 42 52)" />
    </svg>
  )
}

const fmtTime = (m: number) => {
  const mm = Math.floor(m)
  const ss = Math.round((m - mm) * 60)
  return `${mm}:${String(ss).padStart(2, '0')}`
}

export default function RoastProfile() {
  const [drop, setDrop] = useState(9.8)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const inputId = useId()
  const r = useMemo(() => roastFor(drop), [drop])
  const color = beanColor(r.darkness)

  const setFromPointer = (clientX: number) => {
    const svg = svgRef.current
    if (!svg) return
    const box = svg.getBoundingClientRect()
    const px = ((clientX - box.left) / box.width) * W
    setDrop(Math.min(DROP_MAX, Math.max(DROP_MIN, Math.round(tFromX(px) * 10) / 10)))
  }

  const hx = x(drop)
  const hy = y(beanTemp(drop))

  return (
    <figure className="roast">
      <div className="roast-top">
        <Bean color={color} />
        <div>
          <p className="roast-coffee">Etiyopya Guji, Hambela</p>
          <p className="roast-level" style={{ color: r.darkness > 0.5 ? 'var(--roast)' : 'var(--cinnamon)' }}>
            {r.level} kavrum
          </p>
          <p className="roast-stats">
            Kavrum bitişi {fmtTime(drop)} dk, {Math.round(r.dropTemp)} °C. Gelişim %{Math.round(r.development * 100)}
          </p>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="roast-chart"
        onPointerDown={e => {
          dragging.current = true
          ;(e.target as Element).setPointerCapture?.(e.pointerId)
          setFromPointer(e.clientX)
        }}
        onPointerMove={e => dragging.current && setFromPointer(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        role="img"
        aria-label={`Kavrum eğrisi: ${fmtTime(drop)} dakikada ${Math.round(r.dropTemp)} derecede bitiyor`}
      >
        {[100, 140, 180, 220].map(c => (
          <g key={c}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(c)} y2={y(c)} className="gridline" />
            <text x={PAD.l - 8} y={y(c) + 4} className="axis" textAnchor="end">{c}°</text>
          </g>
        ))}
        {[0, 3, 6, 9, 12].map(t => (
          <text key={t} x={x(t)} y={H - 10} className="axis" textAnchor="middle">{t} dk</text>
        ))}
        <rect x={x(FIRST_CRACK)} y={PAD.t} width={x(DROP_MAX) - x(FIRST_CRACK)} height={H - PAD.t - PAD.b} className="dev-zone" />
        <line x1={x(FIRST_CRACK)} x2={x(FIRST_CRACK)} y1={PAD.t} y2={H - PAD.b} className="crack" />
        <text x={x(FIRST_CRACK) + 6} y={PAD.t + 14} className="crack-label">1. çatlama</text>
        <path d={pathTo(drop)} className="curve" />
        <line x1={hx} x2={hx} y1={hy} y2={H - PAD.b} className="drop-line" />
        <circle cx={hx} cy={hy} r="13" className="handle-halo" />
        <circle cx={hx} cy={hy} r="7" className="handle" style={{ fill: color }} />
      </svg>

      <label htmlFor={inputId} className="roast-hint">
        Noktayı sürükleyin ya da ok tuşlarıyla kavrumu uzatıp kısaltın
      </label>
      <input
        id={inputId}
        type="range"
        className="roast-range"
        min={DROP_MIN}
        max={DROP_MAX}
        step={0.1}
        value={drop}
        onChange={e => setDrop(Number(e.target.value))}
      />

      <dl className="roast-out">
        <div>
          <dt>Fincanda</dt>
          <dd>{r.notes.join(', ')}</dd>
        </div>
        <div>
          <dt>Önerimiz: {r.brew.method}</dt>
          <dd>{r.brew.recipe}</dd>
        </div>
      </dl>
    </figure>
  )
}
