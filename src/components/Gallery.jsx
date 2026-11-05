import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import { useLang } from '../lib/i18n'
import { GALLERY } from '../data/project'
import { stopScroll, startScroll } from '../lib/motion'
import SplitText from './SplitText'

const pad = (n) => String(n).padStart(2, '0')

function Lightbox({ index, onClose, onGo }) {
  const { t } = useLang()
  const [zoom, setZoom] = useState(false)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef(null)
  const item = GALLERY[index]

  useEffect(() => { setZoom(false); setPan({ x: 0, y: 0 }) }, [index])
  useEffect(() => {
    stopScroll(); document.body.style.overflow = 'hidden'
    const key = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onGo(1)
      if (e.key === 'ArrowLeft') onGo(-1)
    }
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('keydown', key); document.body.style.overflow = ''; startScroll() }
  }, [onClose, onGo])

  const down = (e) => { drag.current = { x: e.clientX, y: e.clientY, moved: 0 }; e.currentTarget.setPointerCapture(e.pointerId) }
  const move = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x, dy = e.clientY - d.y
    d.moved = Math.max(d.moved, Math.hypot(dx, dy))
    if (zoom) { setPan((p) => ({ x: p.x + e.movementX, y: p.y + e.movementY })) }
  }
  const up = (e) => {
    const d = drag.current; drag.current = null
    if (!d) return
    const dx = e.clientX - d.x
    if (d.moved < 6) setZoom((z) => { if (z) setPan({ x: 0, y: 0 }); return !z })
    else if (!zoom && Math.abs(dx) > 60) onGo(dx < 0 ? 1 : -1)
  }

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={t.gallery.caps[index]}>
      <div className="lb-top">
        <span className="lb-count">{pad(index + 1)} <i>{t.gallery.of}</i> {pad(GALLERY.length)}</span>
        <button type="button" className="icon-btn" onClick={onClose} aria-label={t.gallery.close}><X size={22} /></button>
      </div>
      <div className="lb-stage" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => (drag.current = null)} data-cursor={zoom ? 'drag' : 'view'}>
        <img
          key={item.id} src={item.src} alt={t.gallery.caps[index]} draggable="false"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom ? 2.2 : 1})`, cursor: zoom ? 'grab' : 'zoom-in' }}
        />
      </div>
      <button type="button" className="icon-btn lb-prev" onClick={() => onGo(-1)} aria-label={t.gallery.prev}><ChevronLeft size={26} /></button>
      <button type="button" className="icon-btn lb-next" onClick={() => onGo(1)} aria-label={t.gallery.next}><ChevronRight size={26} /></button>
      <div className="lb-cap">{t.gallery.caps[index]}</div>
    </div>
  )
}

export default function Gallery() {
  const { t } = useLang()
  const n = GALLERY.length
  const [i, setI] = useState(0)
  const [box, setBox] = useState(false)
  const [loaded, setLoaded] = useState({})
  const stage = useRef(null)
  const sec = useRef(null)
  const drag = useRef(null)

  const go = useCallback((d) => setI((v) => (v + d + n) % n), [n])

  // Keyboard navigation while the gallery is on screen.
  useEffect(() => {
    let inView = false
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting }, { threshold: 0.35 })
    sec.current && io.observe(sec.current)
    const key = (e) => {
      if (!inView || box) return
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', key)
    return () => { io.disconnect(); window.removeEventListener('keydown', key) }
  }, [go, box])

  const onMove = (e) => {
    if (e.pointerType !== 'mouse' || !stage.current) return
    const r = stage.current.getBoundingClientRect()
    stage.current.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
    stage.current.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
  }
  const down = (e) => { drag.current = { x: e.clientX, moved: 0 } }
  const up = (e) => {
    const d = drag.current; drag.current = null
    if (d && Math.abs(e.clientX - d.x) > 50) go(e.clientX < d.x ? 1 : -1)
  }

  return (
    <section id="gallery" className="gallery section" data-tone="dark" ref={sec}>
      <div className="wrap">
        <div className="sec-head">
          <p className="eyebrow" data-reveal>{t.gallery.eyebrow}</p>
          <h2 className="display"><SplitText text={t.gallery.title} charClass="rv" /></h2>
          <p className="lead" data-reveal>{t.gallery.note}</p>
        </div>
      </div>

      <div className="g-stage" ref={stage} onPointerMove={onMove} onPointerDown={down} onPointerUp={up} data-cursor="drag">
        {GALLERY.map((g, k) => {
          let off = k - i
          if (off > n / 2) off -= n
          if (off < -n / 2) off += n
          const a = Math.abs(off)
          const active = off === 0
          return (
            <figure
              key={g.id}
              className={`g-slide ${active ? 'active' : ''} ${loaded[k] ? 'loaded' : ''}`}
              style={{
                transform: `translate(-50%, -50%) translate3d(${off * 56}%, 0, ${-a * 280}px) rotateY(${off * -24}deg)`,
                opacity: a > 2 ? 0 : 1 - a * 0.32,
                zIndex: 10 - a,
                pointerEvents: a > 2 ? 'none' : 'auto',
              }}
              onClick={() => (active ? setBox(true) : setI(k))}
              data-cursor={active ? 'view' : 'drag'}
              aria-hidden={a > 0 ? 'true' : undefined}
            >
              <div className="g-img">
                <img
                  src={g.src} alt={t.gallery.caps[k]} draggable="false"
                  loading={a <= 1 ? 'eager' : 'lazy'} decoding="async"
                  onLoad={() => setLoaded((l) => ({ ...l, [k]: true }))}
                />
              </div>
            </figure>
          )
        })}
      </div>

      <div className="wrap g-ui">
        <div className="g-meta">
          <span className="g-idx"><b>{pad(i + 1)}</b> <i>{t.gallery.of}</i> {pad(n)}</span>
          <p className="g-cap" key={`${i}`}>{t.gallery.caps[i]}</p>
        </div>
        <div className="g-dots" role="tablist">
          {GALLERY.map((g, k) => (
            <button key={g.id} type="button" role="tab" aria-selected={k === i} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`${t.gallery.caps[k]} ${pad(k + 1)}`}><i /></button>
          ))}
        </div>
        <div className="g-btns">
          <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label={t.gallery.prev}><ChevronLeft size={22} /></button>
          <button type="button" className="icon-btn" onClick={() => go(1)} aria-label={t.gallery.next}><ChevronRight size={22} /></button>
          <button type="button" className="icon-btn" onClick={() => setBox(true)} aria-label={t.gallery.open}><Maximize2 size={18} /></button>
        </div>
      </div>

      {box && <Lightbox index={i} onClose={() => setBox(false)} onGo={go} />}
    </section>
  )
}
