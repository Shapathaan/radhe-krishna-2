import { Lightbulb, Trees, Zap, Route, Droplets, DoorOpen } from 'lucide-react'
import { useLang } from '../lib/i18n'
import SplitText from './SplitText'

const ICONS = [Lightbulb, Trees, Zap, Route, Droplets, DoorOpen]

export default function Amenities() {
  const { t } = useLang()
  return (
    <section id="amenities" className="amen section" data-tone="light">
      <div className="wrap">
        <div className="sec-head">
          <p className="eyebrow" data-reveal>{t.amen.eyebrow}</p>
          <h2 className="display"><SplitText text={t.amen.title} charClass="rv" /></h2>
          <p className="lead" data-reveal>{t.amen.note}</p>
        </div>
        <ol className="amen-list">
          {t.amen.items.map(([name, desc], i) => {
            const Icon = ICONS[i]
            return (
              <li key={i} data-reveal data-cursor="explore">
                <span className="idx">0{i + 1}</span>
                <h3>{name}</h3>
                <p>{desc}</p>
                <span className="ico"><Icon size={22} strokeWidth={1.4} /></span>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
