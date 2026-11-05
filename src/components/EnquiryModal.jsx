import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, MessageCircle, X } from 'lucide-react'
import { useLang } from '../lib/i18n'
import { PROJECT } from '../data/project'
import { stopScroll, startScroll } from '../lib/motion'

function normalisePhone(raw) {
  let d = raw.replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return /^[6-9]\d{9}$/.test(d) ? d : null
}

export default function EnquiryModal({ open, interest, onClose }) {
  const { t, lang } = useLang()
  const [f, setF] = useState({ name: '', phone: '', msg: '' })
  const [touched, setTouched] = useState({})
  const [state, setState] = useState('idle')
  const first = useRef(null)
  const panel = useRef(null)

  const errors = {
    name: f.name.trim().length < 2 ? t.form.eName : '',
    phone: normalisePhone(f.phone) ? '' : t.form.ePhone,
  }
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }))
  const blur = (k) => () => setTouched((v) => ({ ...v, [k]: true }))

  useEffect(() => {
    if (!open) return
    setState('idle'); setTouched({})
    stopScroll(); document.body.style.overflow = 'hidden'
    const id = setTimeout(() => first.current && first.current.focus(), 450)
    const key = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && panel.current) { // simple focus trap
        const nodes = panel.current.querySelectorAll('button, input, textarea, a[href]')
        if (!nodes.length) return
        const a = nodes[0], z = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
      }
    }
    window.addEventListener('keydown', key)
    return () => { clearTimeout(id); window.removeEventListener('keydown', key); document.body.style.overflow = ''; startScroll() }
  }, [open, onClose])

  const submit = (e) => {
    e.preventDefault()
    setTouched({ name: true, phone: true })
    if (errors.name || errors.phone) return
    const lines = [t.form.prefix, '', `${t.form.name}: ${f.name.trim()}`, `${t.form.phone}: ${normalisePhone(f.phone)}`]
    if (interest) lines.push(`${t.form.plotLine}: ${interest}`)
    if (f.msg.trim()) lines.push('', f.msg.trim())
    const url = `https://wa.me/${PROJECT.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`
    setState('opening')
    setTimeout(() => {
      window.open(url, '_blank', 'noopener,noreferrer')
      setState('sent')
      setTimeout(() => { onClose(); setF({ name: '', phone: '', msg: '' }) }, 1800)
    }, 500)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            ref={panel} className="modal" role="dialog" aria-modal="true" aria-labelledby="enq-title" lang={lang}
            initial={{ y: 60, opacity: 0, clipPath: 'inset(0 0 100% 0 round 24px)' }}
            animate={{ y: 0, opacity: 1, clipPath: 'inset(0 0 0% 0 round 24px)' }}
            exit={{ y: 40, opacity: 0, clipPath: 'inset(0 0 100% 0 round 24px)' }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            <button type="button" className="icon-btn modal-x" onClick={onClose} aria-label={t.form.close}><X size={20} /></button>
            <p className="eyebrow">{PROJECT.name} · {PROJECT.phase}</p>
            <h3 id="enq-title" className="modal-title">{t.form.title}</h3>
            <p className="modal-sub">{t.form.sub}</p>
            {interest && <p className="modal-interest">{t.form.plotLine}: <b>{interest}</b></p>}
            <form onSubmit={submit} noValidate>
              <label className={touched.name && errors.name ? 'err' : ''}>
                <span>{t.form.name}</span>
                <input ref={first} value={f.name} onChange={set('name')} onBlur={blur('name')} autoComplete="name" aria-invalid={!!(touched.name && errors.name)} />
                {touched.name && errors.name && <em role="alert">{errors.name}</em>}
              </label>
              <label className={touched.phone && errors.phone ? 'err' : ''}>
                <span>{t.form.phone}</span>
                <input value={f.phone} onChange={set('phone')} onBlur={blur('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="98XXXXXXXX" aria-invalid={!!(touched.phone && errors.phone)} />
                {touched.phone && errors.phone && <em role="alert">{errors.phone}</em>}
              </label>
              <label>
                <span>{t.form.msg}</span>
                <textarea rows={3} value={f.msg} onChange={set('msg')} />
              </label>
              <button type="submit" className={`btn-solid wide ${state}`} disabled={state !== 'idle'}>
                {state === 'sent' ? <><Check size={18} /> {t.form.sent}</> : <><MessageCircle size={18} /> {state === 'opening' ? t.form.sending : t.form.send}</>}
              </button>
            </form>
            <p className="modal-phone">{PROJECT.phone}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
