import { useEffect, useRef, useState } from 'react'
import { gsap, isFinePointer } from '../lib/motion'
import { useLang } from '../lib/i18n'

// Desktop-only cursor. Elements opt in with data-cursor="explore|drag|view|plot".
export default function Cursor() {
  const { t } = useLang()
  const [enabled] = useState(isFinePointer)
  const [mode, setMode] = useState('default')
  const dot = useRef(null)
  const ring = useRef(null)

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('has-cursor')
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.08, ease: 'none' })
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.08, ease: 'none' })
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.45, ease: 'power3.out' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.45, ease: 'power3.out' })
    const move = (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY) }
    const over = (e) => {
      const el = e.target.closest ? e.target.closest('[data-cursor]') : null
      setMode(el ? el.dataset.cursor : e.target.closest && e.target.closest('a,button') ? 'link' : 'default')
    }
    const custom = (e) => setMode(e.detail)
    const leave = () => gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.2 })
    const enter = () => gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.2 })
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerover', over, { passive: true })
    window.addEventListener('rkr-cursor', custom)
    document.documentElement.addEventListener('mouseleave', leave)
    document.documentElement.addEventListener('mouseenter', enter)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerover', over)
      window.removeEventListener('rkr-cursor', custom)
      document.documentElement.removeEventListener('mouseleave', leave)
      document.documentElement.removeEventListener('mouseenter', enter)
    }
  }, [enabled])

  if (!enabled) return null
  const label = ['explore', 'drag', 'view', 'plot'].includes(mode) ? t.cursor[mode] : ''
  return (
    <div className={`cursor mode-${mode}`} aria-hidden="true">
      <div className="c-ring" ref={ring}><span>{label}</span></div>
      <div className="c-dot" ref={dot} />
    </div>
  )
}
