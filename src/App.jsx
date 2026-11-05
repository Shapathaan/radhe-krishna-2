import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { gsap, ScrollTrigger, initSmoothScroll, prefersReduced } from './lib/motion'
import { useLang } from './lib/i18n'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Vision from './components/Vision'
import Stats from './components/Stats'
import MasterPlan from './components/MasterPlan'
import Amenities from './components/Amenities'
import Gallery from './components/Gallery'
import Location from './components/Location'
import Footer from './components/Footer'
import Cursor from './components/Cursor'
import Divider from './components/Divider'
import EnquiryModal from './components/EnquiryModal'

export default function App() {
  const { lang } = useLang()
  const [enq, setEnq] = useState({ open: false, interest: '' })
  const [loaderVisible, setLoaderVisible] = useState(true)
  const [loaderExit, setLoaderExit] = useState(false)
  const openEnquiry = useCallback((interest = '') => setEnq({ open: true, interest: typeof interest === 'string' ? interest : '' }), [])
  const closeEnquiry = useCallback(() => setEnq((e) => ({ ...e, open: false })), [])

  useEffect(() => initSmoothScroll(), [])

  useEffect(() => {
    let minDone = false
    let pageDone = document.readyState === 'complete'
    let exitTimer
    const minTimer = window.setTimeout(() => { minDone = true; finishIfReady() }, 1250)
    const safetyTimer = window.setTimeout(() => { pageDone = true; minDone = true; finishIfReady() }, 4800)
    const onLoad = () => { pageDone = true; finishIfReady() }
    function finishIfReady() {
      if (!minDone || !pageDone) return
      setLoaderExit(true)
      exitTimer = window.setTimeout(() => setLoaderVisible(false), 760)
    }
    if (!pageDone) window.addEventListener('load', onLoad, { once: true })
    else { pageDone = true }
    return () => {
      window.clearTimeout(minTimer)
      window.clearTimeout(safetyTimer)
      window.clearTimeout(exitTimer)
      window.removeEventListener('load', onLoad)
    }
  }, [])

  /* ── Luxury entry loader ── */
  // Global scroll choreography: reveals, headings, dividers, tone transitions.
  useLayoutEffect(() => {
    const reduced = prefersReduced()
    const ctx = gsap.context(() => {
      gsap.utils.toArray('[data-tone]').forEach((el) => {
        ScrollTrigger.create({
          trigger: el, start: 'top 55%', end: 'bottom 55%',
          onToggle: (self) => { if (self.isActive) document.body.dataset.tone = el.dataset.tone },
        })
      })
      if (reduced) return
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        if (el.dataset.reveal === 'mask') {
          gsap.fromTo(el, { clipPath: 'inset(10% 6% 10% 6% round 28px)', opacity: 0.4 }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', opacity: 1, duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
        } else {
          gsap.fromTo(el, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 91%', once: true } })
        }
      })
      gsap.utils.toArray('.display').forEach((h) => {
        const chars = h.querySelectorAll('.rv')
        if (!chars.length) return
        gsap.fromTo(chars, { yPercent: 115, rotateX: -60, opacity: 0 }, { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.15, ease: 'expo.out', stagger: { each: lang === 'en' ? 0.018 : 0.07 }, scrollTrigger: { trigger: h, start: 'top 86%', once: true } })
      })
      gsap.utils.toArray('[data-divider]').forEach((svg) => {
        gsap.fromTo(svg.querySelectorAll('path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: svg, start: 'top 95%', end: 'top 55%', scrub: true } })
      })
    })
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recalculate trigger positions once fonts/images settle and when text reflows.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh()
    const id = setTimeout(refresh, 400)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh)
    window.addEventListener('load', refresh)
    return () => { clearTimeout(id); window.removeEventListener('load', refresh) }
  }, [lang])

  return (
    <>
      {loaderVisible && (
        <div className={`site-loader${loaderExit ? ' is-leaving' : ''}`} role="status" aria-label="Preparing your experience">
          <div className="site-loader-inner">
            <div className="site-loader-mark">RK</div>
            <div className="site-loader-rule"><span /></div>
            <p>{lang === 'gu' ? 'રાધે કૃષ્ણા' : 'RADHE KRISHNA'} <i>RESIDENCY · PHASE 02</i></p>
            <small>{lang === 'gu' ? 'તમારો અનુભવ તૈયાર થઈ રહ્યો છે' : 'PREPARING YOUR EXPERIENCE'}</small>
          </div>
        </div>
      )}
      <Cursor />
      <Nav onEnquire={openEnquiry} />
      <main>
        <Hero onEnquire={openEnquiry} />
        <Vision />
        <Stats />
        <Divider />
        <MasterPlan onEnquire={openEnquiry} />
        <Amenities />
        <Gallery />
        <Location />
      </main>
      <Footer onEnquire={openEnquiry} />
      <EnquiryModal open={enq.open} interest={enq.interest} onClose={closeEnquiry} />
    </>
  )
}
