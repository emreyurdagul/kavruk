import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Bean from './Bean'
import { beanColor } from './roast'

const SEEN_KEY = 'kavruk-intro-seen'
const GREEN: [number, number, number] = [150, 162, 112]
const YELLOW: [number, number, number] = [196, 168, 110]

/** Çiğ yeşilden sarıya, sonra kavrum yelpazesine */
function roastingColor(p: number): string {
  if (p < 0.35) {
    const f = p / 0.35
    return `rgb(${GREEN.map((v, i) => Math.round(v + (YELLOW[i] - v) * f)).join(',')})`
  }
  return beanColor(((p - 0.35) / 0.65) * 0.62)
}
const CRACK_TEMP = 196

function shouldPlay(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (new URLSearchParams(location.search).has('intro')) return true
  try {
    return localStorage.getItem(SEEN_KEY) !== '1'
  } catch {
    return true
  }
}

/**
 * İlk ziyarette açılış: yeşil çekirdek dönen tamburda kavrulur (92 → 205 °C),
 * 196 °C'de birinci çatlama, sonra tamburdan düşer ve sayfa açılır.
 */
export default function Loader({ onDone }: { onDone: () => void }) {
  const [play] = useState(shouldPlay)
  const root = useRef<HTMLDivElement>(null)
  const beanWrap = useRef<HTMLDivElement>(null)
  const tempRef = useRef<HTMLSpanElement>(null)
  const stageRef = useRef<HTMLParagraphElement>(null)
  const cracks = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!play) {
      onDone()
      return
    }
    const body = beanWrap.current!.querySelector<SVGEllipseElement>('.bean-body')!
    const state = { p: 0 }
    let cracked = false
    const tl = gsap.timeline({
      onComplete: () => {
        try { localStorage.setItem(SEEN_KEY, '1') } catch { /* gizli sekme */ }
        if (root.current) root.current.style.display = 'none'
      },
    })
    tl.to(state, {
      p: 1,
      duration: 2.1,
      ease: 'power1.inOut',
      onUpdate: () => {
        const temp = 92 + 113 * state.p
        body.setAttribute('fill', roastingColor(state.p))
        tempRef.current!.textContent = `${Math.round(temp)} °C`
        stageRef.current!.textContent = temp < 150 ? 'Kurutma' : temp < CRACK_TEMP ? 'Maillard' : 'Gelişim'
        if (!cracked && temp >= CRACK_TEMP) {
          cracked = true
          gsap.fromTo(beanWrap.current, { y: 0 }, { y: -14, duration: 0.09, yoyo: true, repeat: 1, ease: 'power2.out' })
          gsap.fromTo(cracks.current, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.18 })
        }
      },
    })
      .to(cracks.current, { opacity: 0, duration: 0.2 }, '+=0.1')
      .to(beanWrap.current, { y: '65vh', rotation: 140, duration: 0.55, ease: 'power2.in' }, '<')
      .to('.loader-meta, .loader-drum', { opacity: 0, duration: 0.3 }, '<')
      .to(root.current, { backgroundColor: '#dcdfc8', duration: 0.35 }, '<0.15')
      .call(onDone) // başlık, perde kalkarken kavrulmaya başlasın
      .to(root.current, { opacity: 0, duration: 0.35 })
    return () => { tl.kill() }
  }, [play, onDone])

  if (!play) return null
  return (
    <div className="loader" ref={root} role="status" aria-label="Sayfa yükleniyor">
      <svg className="loader-drum" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="92" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1="100" y1="12" x2="100" y2="24" transform={`rotate(${i * 30} 100 100)`} />
        ))}
      </svg>
      <div className="loader-bean" ref={beanWrap}>
        <Bean color={roastingColor(0)} className="loader-bean-svg" />
        <svg ref={cracks} className="loader-cracks" viewBox="0 0 120 150" aria-hidden="true">
          <path d="M8 40 l-8 -8 M112 60 l9 -6 M14 112 l-10 5" />
        </svg>
      </div>
      <div className="loader-meta">
        <span ref={tempRef}>92 °C</span>
        <p ref={stageRef}>Kurutma</p>
      </div>
    </div>
  )
}
