export default function Divider({ flip = false }) {
  return (
    <svg className={`divider ${flip ? 'flip' : ''}`} viewBox="0 0 1200 24" preserveAspectRatio="none" aria-hidden="true" data-divider>
      <path pathLength="1" d="M0 12 H1200" />
      <path pathLength="1" d="M120 4 V20 M360 8 V16 M600 4 V20 M840 8 V16 M1080 4 V20" className="ticks" />
    </svg>
  )
}
