import { useMemo } from 'react'
import { useLang } from '../lib/i18n'

/**
 * Splits text for staggered reveals. Latin text → characters. Gujarati → words,
 * because separating Gujarati glyph clusters into different inline boxes breaks
 * conjunct/matra shaping.
 */
export default function SplitText({ text, className = '', charClass = 'ch' }) {
  const { lang } = useLang()
  const words = useMemo(() => text.split(' '), [text])
  const byChar = lang === 'en'
  return (
    <span className={`split ${className}`} aria-label={text}>
      {words.map((w, wi) => (
        <span className="split-word" key={wi} aria-hidden="true">
          <span className="split-mask">
            {byChar
              ? Array.from(w).map((c, ci) => <span className={charClass} key={ci}>{c}</span>)
              : <span className={charClass}>{w}</span>}
          </span>
          {wi < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  )
}
