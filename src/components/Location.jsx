import { ExternalLink, FileDown, MapPin } from 'lucide-react'
import { useLang } from '../lib/i18n'
import { PROJECT } from '../data/project'
import { useMagnetic } from '../lib/motion'
import SplitText from './SplitText'

// Regional bounding box covering Vadodara – Padra – Dabhoi (OpenStreetMap embed).
// No project pin is drawn unless verified coordinates are set in data/project.js.
function embedUrl() {
  const c = PROJECT.coordinates
  if (c) {
    const d = 0.02
    return `https://www.openstreetmap.org/export/embed.html?bbox=${c.lng - d},${c.lat - d},${c.lng + d},${c.lat + d}&layer=mapnik&marker=${c.lat},${c.lng}`
  }
  return 'https://www.openstreetmap.org/export/embed.html?bbox=73.00,22.05,73.50,22.40&layer=mapnik'
}

export default function Location() {
  const { t } = useLang()
  const a = useMagnetic(0.25)
  return (
    <section id="location" className="loc section" data-tone="light">
      <div className="wrap loc-grid">
        <div className="loc-copy">
          <p className="eyebrow" data-reveal>{t.loc.eyebrow}</p>
          <h2 className="display"><SplitText text={t.loc.title} charClass="rv" /></h2>
          <p className="lead" data-reveal>{t.loc.lead}</p>
          <ul className="loc-places" data-reveal>
            {t.loc.places.map((p) => <li key={p}><MapPin size={14} /> {p}</li>)}
          </ul>
          <div className="loc-actions" data-reveal>
            <a ref={a} className="btn-solid" href={PROJECT.mapsUrl} target="_blank" rel="noopener noreferrer" data-cursor="view"><ExternalLink size={16} /> {t.loc.open}</a>
            <a className="btn-ghost dark" href={PROJECT.brochureUrl} download><FileDown size={16} /> {t.loc.brochure}</a>
          </div>
        </div>
        <div className="loc-map" data-reveal="mask">
          <iframe title="Map — Vadodara, Padra, Dabhoi region" src={embedUrl()} loading="lazy" referrerPolicy="no-referrer" />
          <p className="map-note">{PROJECT.coordinates ? '' : t.loc.ctx}</p>
        </div>
      </div>
    </section>
  )
}
