import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/motion'
import { useLang } from '../lib/i18n'
import SplitText from './SplitText'

const IMGS = ['site-03.jpeg', 'site-04.jpeg', 'site-06.jpeg'].map((name) => `${import.meta.env.BASE_URL}assets/${name}`)

export default function Vision() {
  const { t } = useLang()
  const root = useRef(null)
  const panels = [[t.vision.p1t, t.vision.p1], [t.vision.p2t, t.vision.p2], [t.vision.p3t, t.vision.p3]]

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    const el = root.current
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const track = el.querySelector('.v-track')
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth)
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: el.querySelector('.v-pin'), pin: true, scrub: 0.6, start: 'top top', end: () => '+=' + dist(), invalidateOnRefresh: true, anticipatePin: 1 },
      })
      el.querySelectorAll('.v-num').forEach((n) => {
        gsap.fromTo(n, { x: 160 }, { x: -160, ease: 'none', scrollTrigger: { trigger: n.closest('.v-panel'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } })
      })
      el.querySelectorAll('.v-img img').forEach((img) => {
        gsap.fromTo(img, { xPercent: -9 }, { xPercent: 9, ease: 'none', scrollTrigger: { trigger: img.closest('.v-panel'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } })
      })
    })
    mm.add('(max-width: 1023px), (prefers-reduced-motion: reduce)', () => {
      el.querySelectorAll('.v-panel').forEach((p) => {
        gsap.fromTo(p, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 88%', once: true } })
      })
    })
    return () => mm.revert()
  }, [])

  return (
    <section id="vision" className="vision" data-tone="light" ref={root}>
      <div className="v-pin">
        <div className="v-track">
          <div className="v-intro">
            <p className="eyebrow">{t.vision.eyebrow}</p>
            <h2 className="display big"><SplitText text={t.vision.title} charClass="rv" /></h2>
          </div>
          {panels.map(([title, body], i) => (
            <article className="v-panel" key={i}>
              <span className="v-num" aria-hidden="true">0{i + 1}</span>
              <div className="v-img"><img src={IMGS[i]} alt="" loading="lazy" decoding="async" /></div>
              <div className="v-txt"><h3>{title}</h3><p>{body}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
