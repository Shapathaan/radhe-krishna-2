import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useLang } from '../lib/i18n'
import { scrollToId, scrollToTop, stopScroll, startScroll, useMagnetic } from '../lib/motion'

const LINKS = ['vision', 'plan', 'amenities', 'gallery', 'location']

export default function Nav({ onEnquire }) {
  const { t, lang, toggle } = useLang()
  const [active, setActive] = useState('')
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  const magA = useMagnetic(0.25)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const els = LINKS.map((id) => document.getElementById(id)).filter(Boolean)
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id) }),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    const top = document.getElementById('top')
    const ioTop = new IntersectionObserver(([e]) => e.isIntersecting && setActive(''), { threshold: 0.5 })
    top && ioTop.observe(top)
    return () => { io.disconnect(); ioTop.disconnect() }
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    open ? stopScroll() : startScroll()
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', esc)
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; startScroll() }
  }, [open])

  const go = (id) => (e) => { e.preventDefault(); setOpen(false); setTimeout(() => scrollToId(id), open ? 250 : 0) }

  return (
    <>
      <header className={`nav ${solid ? 'solid' : ''}`}>
        <a href="#top" className="brand" onClick={(e) => { e.preventDefault(); scrollToTop() }} aria-label="Radhe Krishna Residency Phase 02">
          <span className="mark" aria-hidden="true">RK</span>
          <span className="brand-txt"><b>Radhe Krishna</b><i>Residency · Phase 02</i></span>
        </a>

        <nav className="nav-links" aria-label="Primary">
          {LINKS.map((id) => (
            <a key={id} href={`#${id}`} className={active === id ? 'on' : ''} onClick={go(id)}>
              {t.nav[id]}
              {active === id && <motion.span layoutId="navline" className="navline" transition={{ type: 'spring', stiffness: 380, damping: 34 }} />}
            </a>
          ))}
        </nav>

        <div className="nav-end">
          <button type="button" className="lang" onClick={toggle} aria-label={t.foot.lang} lang={lang === 'en' ? 'gu' : 'en'}>
            <span className={lang === 'en' ? 'on' : ''}>EN</span><span className="sep" />
            <span className={lang === 'gu' ? 'on' : ''} lang="gu">ગુ</span>
          </button>
          <button ref={magA} type="button" className="btn-solid nav-cta" onClick={() => onEnquire()} data-cursor="view">{t.nav.enquire}</button>
          <button type="button" className="burger" onClick={() => setOpen(true)} aria-label={t.nav.menu} aria-expanded={open}><Menu size={22} /></button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div className="menu" initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }} exit={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }} role="dialog" aria-modal="true">
            <button type="button" className="menu-x" onClick={() => setOpen(false)} aria-label={t.nav.close}><X size={26} /></button>
            <ul>
              {LINKS.map((id, i) => (
                <motion.li key={id} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                  <a href={`#${id}`} onClick={go(id)}><small>0{i + 1}</small>{t.nav[id]}</a>
                </motion.li>
              ))}
            </ul>
            <div className="menu-foot">
              <button type="button" className="btn-solid" onClick={() => { setOpen(false); onEnquire() }}>{t.nav.enquire}</button>
              <button type="button" className="lang" onClick={toggle}><span className={lang === 'en' ? 'on' : ''}>EN</span><span className="sep" /><span className={lang === 'gu' ? 'on' : ''} lang="gu">ગુ</span></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
