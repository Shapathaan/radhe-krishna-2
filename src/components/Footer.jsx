import { useLayoutEffect, useRef } from 'react'
import { ArrowUp, MessageCircle, Phone } from 'lucide-react'
import { gsap, prefersReduced, scrollToTop, useMagnetic } from '../lib/motion'
import { useLang } from '../lib/i18n'
import { PROJECT } from '../data/project'
import SplitText from './SplitText'

export default function Footer({ onEnquire }) {
  const { t, lang, toggle } = useLang()
  const root = useRef(null)
  const a = useMagnetic(0.3)
  const b = useMagnetic(0.3)
  useLayoutEffect(() => {
    if (prefersReduced()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(root.current.querySelector('.cta-bg'), { yPercent: -12, scale: 1.12 }, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom bottom', scrub: true } })
    }, root)
    return () => ctx.revert()
  }, [])
  return (
    <footer ref={root} className="cta" data-tone="dark">
      <div className="cta-bg" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}assets/site-05.jpeg`} alt="" loading="lazy" decoding="async" /></div>
      <div className="cta-shade" aria-hidden="true" />
      <div className="wrap cta-body">
        <p className="eyebrow" data-reveal>{t.cta.eyebrow}</p>
        <h2 className="display big"><SplitText text={t.cta.title} charClass="rv" /></h2>
        <p className="lead" data-reveal>{t.cta.sub}</p>
        <div className="cta-btns" data-reveal>
          <button ref={a} type="button" className="btn-solid" onClick={() => onEnquire()} data-cursor="view"><MessageCircle size={17} /> {t.hero.cta1}</button>
          <a ref={b} className="btn-ghost" href={`tel:+${PROJECT.whatsappNumber}`}><Phone size={17} /> {t.cta.call} · {PROJECT.phone}</a>
        </div>
      </div>
      <div className="wrap foot">
        <span>© {t.foot.rights}</span>
        <span>{t.foot.arch}</span>
        <button type="button" className="lang" onClick={toggle} aria-label={t.foot.lang}>
          <span className={lang === 'en' ? 'on' : ''}>EN</span><span className="sep" /><span className={lang === 'gu' ? 'on' : ''} lang="gu">ગુ</span>
        </button>
        <button type="button" className="to-top" onClick={scrollToTop}>{t.foot.top} <ArrowUp size={15} /></button>
      </div>
    </footer>
  )
}
