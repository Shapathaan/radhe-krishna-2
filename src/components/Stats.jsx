import { useLayoutEffect, useRef } from 'react'
import { gsap, countTo, prefersReduced } from '../lib/motion'
import { useLang } from '../lib/i18n'
import { PROJECT } from '../data/project'

// Only verified facts: price (given), road widths & common plots (printed on the
// brochure plan), amenities (the six listed in the brochure).
export default function Stats() {
  const { t } = useLang()
  const root = useRef(null)
  const s = t.stats
  const items = [
    { n: PROJECT.startingPriceLakh, d: 2, pre: '₹', label: s.price, unit: s.priceUnit },
    { n: 40, d: 0, label: s.cross, unit: s.crossUnit },
    { n: 25, d: 0, label: s.road, unit: s.roadUnit },
    { n: 2, d: 0, label: s.common, unit: s.commonUnit },
    { n: 6, d: 0, label: s.amen, unit: s.amenUnit },
  ]
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      root.current.querySelectorAll('[data-count]').forEach((el) => countTo(el, parseFloat(el.dataset.count), { decimals: parseInt(el.dataset.d, 10), trigger: root.current }))
      if (!prefersReduced()) {
        gsap.from(root.current.querySelectorAll('.stat'), { y: 40, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: root.current, start: 'top 85%', once: true } })
        gsap.fromTo(root.current.querySelector('.stats-rule path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 90%', end: 'top 40%', scrub: true } })
      }
    }, root)
    return () => ctx.revert()
  }, [])
  return (
    <section className="stats" data-tone="dark" ref={root} aria-label={s.eyebrow}>
      <div className="wrap">
        <svg className="stats-rule" viewBox="0 0 1000 8" preserveAspectRatio="none" aria-hidden="true"><path d="M0 4 H1000" pathLength="1" strokeDasharray="1" strokeDashoffset="0" /></svg>
        <ul>
          {items.map((it, i) => (
            <li className="stat" key={i}>
              <div className="num">{it.pre && <span className="pre">{it.pre}</span>}<span data-count={it.n} data-d={it.d}>{it.n.toFixed(it.d)}</span></div>
              <div className="unit">{it.unit}</div>
              <div className="lbl">{it.label}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
