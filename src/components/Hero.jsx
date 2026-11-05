import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Volume2, VolumeX, ArrowDown, MessageCircle, Box } from 'lucide-react'
import { gsap, prefersReduced, isFinePointer, scrollToId, useMagnetic } from '../lib/motion'
import { useLang } from '../lib/i18n'
import { PROJECT } from '../data/project'
import SplitText from './SplitText'

function SoundToggle({ video }) {
  const { t } = useLang()
  const [on, setOn] = useState(false)
  // The supplied film has no audio track (verified), so the control is shown
  // as a disabled "silent film" state instead of pretending to play sound.
  if (!PROJECT.film.hasAudio) {
    return (
      <div className="sound disabled" role="status" title={t.hero.silentHint}>
        <VolumeX size={16} /><span>{t.hero.silent}</span>
      </div>
    )
  }
  const click = () => {
    const v = video.current
    if (!v) return
    const next = !on
    v.muted = !next // only ever unmuted by an explicit user gesture
    if (next) v.play().catch(() => {})
    setOn(next)
  }
  return (
    <button type="button" className={`sound ${on ? 'on' : ''}`} onClick={click} aria-pressed={on} data-cursor="view">
      <span className="ico"><VolumeX size={16} className="i-off" /><Volume2 size={16} className="i-on" /></span>
      <span className="lbl"><span className="l-off">{t.hero.soundOff}</span><span className="l-on">{t.hero.soundOn}</span></span>
    </button>
  )
}

export default function Hero({ onEnquire }) {
  const { t } = useLang()
  const root = useRef(null)
  const video = useRef(null)
  const magA = useMagnetic(0.3)
  const magB = useMagnetic(0.3)

  // Pause the film when the hero is off-screen.
  useEffect(() => {
    const v = video.current
    if (!v) return
    const io = new IntersectionObserver(([e]) => { e.isIntersecting ? v.play().catch(() => {}) : v.pause() }, { threshold: 0.1 })
    io.observe(v)
    return () => io.disconnect()
  }, [])

  useLayoutEffect(() => {
    const reduced = prefersReduced()
    let off = null
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root)
      const paths = q('.draw')
      paths.forEach((p) => {
        const len = p.getTotalLength ? p.getTotalLength() : 1000
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: reduced ? 0 : len })
      })
      if (!reduced) {
        gsap.set(q('.ch'), { yPercent: 115, rotateX: -75, opacity: 0, transformOrigin: '50% 100%' })
        gsap.set(q('.h-eyebrow, .h-sub, .h-cta > *, .h-scroll, .sound'), { opacity: 0, y: 24 })
        gsap.set(q('.hero-film'), { clipPath: 'inset(100% 0% 0% 0%)' })
        gsap.set(q('.hero-bg'), { opacity: 0, scale: 1.35 })

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.15 })
        tl.to(q('.hero-bg'), { opacity: 1, scale: 1.08, duration: 2.6, ease: 'power2.out' }, 0)
          .to(q('.hero-film'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.out' }, 0.35)
          .to(paths, { strokeDashoffset: 0, duration: 2.2, stagger: 0.14, ease: 'power2.inOut' }, 0.5)
          .to(q('.h-eyebrow'), { opacity: 1, y: 0, duration: 1 }, 1.1)
          .to(q('.t-main .ch'), { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.25, stagger: 0.028, ease: 'expo.out' }, 1.3)
          .to(q('.t-ghost .ch'), { yPercent: 0, rotateX: 0, opacity: 0.55, duration: 1.45, stagger: 0.028, ease: 'expo.out' }, 1.45)
          .to(q('.h-sub'), { opacity: 1, y: 0, duration: 1.1 }, 2.15)
          .to(q('.h-cta > *'), { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 }, 2.4)
          .to(q('.sound, .h-scroll'), { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 }, 2.7)

        // scroll choreography
        const st = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.8 }
        gsap.to(q('.hero-bg'), { yPercent: 14, scale: 1.2, ease: 'none', scrollTrigger: st })
        gsap.to(q('.hero-film'), { yPercent: -12, ease: 'none', scrollTrigger: st })
        gsap.to(q('.hero-copy'), { yPercent: -20, opacity: 0.1, ease: 'none', scrollTrigger: { ...st, end: 'bottom 30%' } })
        gsap.to(q('.hero-lines'), { yPercent: -8, opacity: 0.2, ease: 'none', scrollTrigger: st })
        gsap.to(q('.hero-inner'), { scale: 0.94, rotateX: 3, borderRadius: 36, transformOrigin: '50% 100%', ease: 'none', scrollTrigger: { ...st, start: 'center top' } })

        // pointer parallax (desktop)
        if (isFinePointer()) {
          const bx = gsap.quickTo(q('.hero-bg')[0], 'x', { duration: 1.2, ease: 'power3.out' })
          const by = gsap.quickTo(q('.hero-bg')[0], 'y', { duration: 1.2, ease: 'power3.out' })
          const fx = gsap.quickTo(q('.hero-film')[0], 'x', { duration: 1.0, ease: 'power3.out' })
          const gx = gsap.quickTo(q('.t-ghost')[0], 'x', { duration: 0.9, ease: 'power3.out' })
          const gy = gsap.quickTo(q('.t-ghost')[0], 'y', { duration: 0.9, ease: 'power3.out' })
          const ry = gsap.quickTo(q('.hero-3d')[0], 'rotationY', { duration: 1.1, ease: 'power3.out' })
          const rx = gsap.quickTo(q('.hero-3d')[0], 'rotationX', { duration: 1.1, ease: 'power3.out' })
          gsap.set(q('.hero-3d')[0], { transformPerspective: 1200 })
          const move = (e) => {
            const nx = e.clientX / window.innerWidth - 0.5
            const ny = e.clientY / window.innerHeight - 0.5
            bx(-nx * 28); by(-ny * 18); fx(nx * 22); gx(nx * 26); gy(ny * 16); ry(nx * 5); rx(-ny * 4)
          }
          const node = root.current
          node.addEventListener('pointermove', move)
          off = () => node.removeEventListener('pointermove', move)
        }
      }
    }, root)
    return () => { off && off(); ctx.revert() }
  }, [])

  return (
    <section id="top" ref={root} className="hero" data-tone="dark">
      <div className="hero-inner">
        <div className="hero-bg" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}assets/site-02.jpeg`} alt="" fetchpriority="high" decoding="async" /></div>
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />

        <svg className="hero-lines" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" fill="none">
          <path className="draw" d="M0 720 L1600 650" />
          <path className="draw" d="M0 760 L1600 700" opacity=".5" />
          <path className="draw" d="M180 0 V900" opacity=".35" />
          <path className="draw" d="M1090 0 V900" opacity=".35" />
          <path className="draw" d="M180 700 V470 L360 385 L540 470 V700 Z" />
          <path className="draw" d="M360 385 V610 M180 470 L360 555 L540 470 M360 555 V700" opacity=".7" />
          <path className="draw" d="M180 770 H540 M180 758 V782 M540 758 V782" />
          <path className="draw" d="M1090 120 H1500 V780 H1090 Z" opacity=".4" />
          <path className="draw" d="M80 120 H180 M80 120 V200" opacity=".6" />
        </svg>

        <div className="hero-film" data-cursor="view">
          <video ref={video} src={PROJECT.film.src} poster={PROJECT.film.poster} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
          <span className="film-corner tl" /><span className="film-corner br" />
        </div>

        <div className="hero-copy">
          <div className="hero-3d">
            <p className="eyebrow h-eyebrow">{t.hero.eyebrow}</p>
            <h1 className="h-title">
              <span className="t-ghost" aria-hidden="true">
                <span className="tl"><SplitText text={t.hero.l1} /></span>
                <span className="tl"><SplitText text={t.hero.l2} /></span>
              </span>
              <span className="t-main">
                <span className="tl"><SplitText text={t.hero.l1} /></span>
                <span className="tl em"><SplitText text={t.hero.l2} /></span>
              </span>
            </h1>
            <p className="h-sub">{t.hero.sub}</p>
            <div className="h-cta">
              <button ref={magA} type="button" className="btn-solid" onClick={() => onEnquire()} data-cursor="view"><MessageCircle size={17} />{t.hero.cta1}</button>
              <button ref={magB} type="button" className="btn-ghost" onClick={() => scrollToId('plan')} data-cursor="explore"><Box size={17} />{t.hero.cta2}</button>
            </div>
          </div>
        </div>

        <SoundToggle video={video} />
        <button type="button" className="h-scroll" onClick={() => scrollToId('vision')} aria-label={t.hero.scroll}>
          <span>{t.hero.scroll}</span><i><ArrowDown size={14} /></i>
        </button>
      </div>
    </section>
  )
}
