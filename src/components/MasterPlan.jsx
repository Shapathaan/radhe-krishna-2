import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Map as MapIcon } from 'lucide-react'
import { useLang } from '../lib/i18n'
import { PROJECT } from '../data/project'
import ErrorBoundary from './ErrorBoundary'
import SplitText from './SplitText'

// The three.js stack + geometry live in their own chunk, fetched only when the
// section approaches the viewport.
const Experience = lazy(() => import('./MasterPlanExperience'))

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch { return false }
}

function Loader({ label }) {
  return (
    <div className="mp-loader" role="status">
      <div className="bar"><i /></div>
      <span>{label}</span>
    </div>
  )
}

function BrochurePlan({ note }) {
  return (
    <figure className="mp-flat">
      <img src={PROJECT.planImage} alt="Brochure master plan" loading="lazy" decoding="async" />
      {note && <figcaption>{note}</figcaption>}
    </figure>
  )
}

export default function MasterPlan({ onEnquire }) {
  const { t } = useLang()
  const sec = useRef(null)
  const [near, setNear] = useState(false)
  const [view, setView] = useState('3d')
  const webgl = useMemo(hasWebGL, [])

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect() } }, { rootMargin: '900px 0px' })
    sec.current && io.observe(sec.current)
    return () => io.disconnect()
  }, [])

  const fallback = <BrochurePlan note={t.plan.error} />

  return (
    <section id="plan" className="plan section" data-tone="dark" ref={sec}>
      <div className="wrap">
        <div className="sec-head">
          <p className="eyebrow" data-reveal>{t.plan.eyebrow}</p>
          <h2 className="display"><SplitText text={t.plan.title} charClass="rv" /></h2>
          <p className="lead" data-reveal>{t.plan.lead}</p>
        </div>

        <div className="mp-bar" data-reveal>
          <div className="seg" role="tablist">
            <button type="button" role="tab" aria-selected={view === '3d'} className={view === '3d' ? 'on' : ''} onClick={() => setView('3d')}><Box size={15} /> {t.plan.model3d}</button>
            <button type="button" role="tab" aria-selected={view === 'plan'} className={view === 'plan' ? 'on' : ''} onClick={() => setView('plan')}><MapIcon size={15} /> {t.plan.brochure}</button>
          </div>
          <p className="notice">{t.plan.notice}</p>
        </div>

        <div className="mp-frame" data-reveal="mask">
          {view === 'plan' || !webgl ? (
            <BrochurePlan note={!webgl ? t.plan.noWebgl : null} />
          ) : near ? (
            <ErrorBoundary fallback={fallback}>
              <Suspense fallback={<Loader label={t.plan.loading} />}>
                <Experience onEnquire={onEnquire} />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <Loader label={t.plan.loading} />
          )}
        </div>
      </div>
    </section>
  )
}
