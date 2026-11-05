import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)
export { gsap, ScrollTrigger }

export const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const isFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
export const isMobileViewport = () => typeof window !== 'undefined' && window.innerWidth < 820

let lenis = null

export function initSmoothScroll() {
  if (prefersReduced()) return () => {}
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  })
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (time) => lenis.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  return () => {
    gsap.ticker.remove(tick)
    lenis.destroy()
    lenis = null
  }
}

export function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { offset: -8, duration: 1.6 })
  else el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth' })
}
export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { duration: 1.6 })
  else window.scrollTo({ top: 0 })
}
export function stopScroll() { lenis && lenis.stop() }
export function startScroll() { lenis && lenis.start() }

/** Subtle magnetic pull for desktop pointers. Returns a ref for the element. */
export function useMagnetic(strength = 0.3) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !isFinePointer() || prefersReduced()) return
    const xTo = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' })
    const move = (e) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * strength)
      yTo((e.clientY - (r.top + r.height / 2)) * strength)
    }
    const leave = () => { xTo(0); yTo(0) }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      gsap.set(el, { clearProps: 'x,y' })
    }
  }, [strength])
  return ref
}

/** Animated counter helper — returns formatted string setter via callback. */
export function countTo(el, to, { decimals = 0, duration = 1.8, trigger } = {}) {
  const o = { v: 0 }
  el.textContent = (0).toFixed(decimals)
  if (prefersReduced()) { el.textContent = to.toFixed(decimals); return null }
  return gsap.to(o, {
    v: to, duration, ease: 'power2.out',
    scrollTrigger: { trigger: trigger || el, start: 'top 85%', once: true },
    onUpdate: () => { el.textContent = o.v.toFixed(decimals) },
  })
}
