import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Kaydırmaya bağlı sahneler (hepsi scrub: yukarı kaydırınca geri sarar).
 *  1. Hero → raf: hero'daki çekirdek düşüp ilk pakete girer, paketler sırayla
 *     yerine düşer, kavrum tarihi etiketleri dönerek yapışır.
 *  2. Kavrum takvimi: çizgi dolar, paket çarşambadan cumartesiye ilerler.
 *  3. Kafeler: V60'tan buhar yükselir, başlık buharın içinden netleşir.
 * Hareket azaltma tercihinde hiçbiri çalışmaz.
 */
export function useScrollScenes(ready: boolean) {
  useEffect(() => {
    if (!ready) return
    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // 1a. Paketler dökülür, etiketler yapışır
      gsap.utils.toArray<HTMLElement>('.shelf-row').forEach((row, i) => {
        const bag = row.querySelector('.bag')
        const sticker = row.querySelector('.bag-date')
        gsap.timeline({
          scrollTrigger: { trigger: row, start: 'top 95%', end: 'top 55%', scrub: 0.6 },
        })
          .fromTo(bag, { y: -90, rotation: i % 2 ? 9 : -9, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, ease: 'bounce.out' })
          .fromTo(sticker, { rotationY: 90, opacity: 0 }, { rotationY: 0, opacity: 1, ease: 'back.out(2)' }, '>-0.1')
      })

      // 2. Takvim: çizgi + paket + geçilen günler
      const steps = gsap.utils.toArray<HTMLElement>('.calendar li')
      gsap.timeline({
        scrollTrigger: {
          trigger: '.calendar',
          start: 'top 70%',
          end: 'bottom 60%',
          scrub: 0.5,
          onUpdate: self => steps.forEach((li, i) => li.classList.toggle('passed', self.progress >= i / (steps.length - 0.4))),
        },
      })
        .fromTo('.track-fill', { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0)
        .fromTo('.track-parcel', { left: '0%' }, { left: '100%', ease: 'none' }, 0)

      // 3. Buhar ve başlık
      gsap.timeline({ scrollTrigger: { trigger: '.wholesale', start: 'top 85%', end: 'top 25%', scrub: 0.8 } })
        .fromTo('.steam path', { strokeDashoffset: 120, opacity: 0, y: 30 }, { strokeDashoffset: 0, opacity: 0.85, y: -20, stagger: 0.12, ease: 'none' }, 0)
        .fromTo('.wholesale h2', { opacity: 0.08, filter: 'blur(8px)', y: 18 }, { opacity: 1, filter: 'blur(0px)', y: 0, ease: 'none' }, 0.2)
    })

    // 1b. Hero çekirdeği pakete düşer — yalnız geniş ekranda (mobilde düzen tek sütun)
    mm.add('(prefers-reduced-motion: no-preference) and (min-width: 961px)', () => {
      const flyer = document.querySelector<HTMLElement>('.flying-bean')
      const from = document.querySelector<HTMLElement>('.roast .bean')
      const to = document.querySelector<HTMLElement>('.shelf-row .bag')
      if (!flyer || !from || !to) return
      const pos = (el: HTMLElement) => {
        const r = el.getBoundingClientRect()
        return { x: r.left + r.width / 2 + window.scrollX, y: r.top + r.height / 2 + window.scrollY }
      }
      gsap.fromTo(
        flyer,
        { x: () => pos(from).x, y: () => pos(from).y, rotation: 0, scale: 1, opacity: 0 },
        {
          keyframes: {
            '0%': { opacity: 0 },
            '8%': { opacity: 1 },
            '85%': { opacity: 1, scale: 0.8 },
            '100%': { opacity: 0, scale: 0.35 },
          },
          x: () => pos(to).x,
          y: () => pos(to).y,
          rotation: 620,
          ease: 'power1.in',
          scrollTrigger: {
            trigger: '.hero',
            start: 'center 40%',
            endTrigger: '.shelf-row',
            end: 'top 45%',
            scrub: 0.4,
            invalidateOnRefresh: true,
          },
        },
      )
    })

    ScrollTrigger.refresh()
    return () => mm.revert()
  }, [ready])
}
