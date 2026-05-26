'use client'

import React from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from 'framer-motion'
import { type ReactNode } from 'react'

/* ─── Motion language ─────────────────────────────────────────
 *  All motion utilities follow the same rules:
 *    • Animate only `transform` and `opacity` (GPU-composited;
 *      no layout/paint thrash, smooth on low-end Android).
 *    • Durations ≤600ms.
 *    • Every utility honors prefers-reduced-motion via
 *      framer-motion's useReducedMotion() — under reduced motion,
 *      transforms drop to zero translate, stagger drops to zero
 *      delay, parallax becomes a no-op. Opacity fades remain
 *      (they're not vestibular triggers).
 *    • Easing matches the existing brand curve:
 *      cubic-bezier(0.16, 1, 0.3, 1)
 * ───────────────────────────────────────────────────────────── */

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1]

export const pageEntrance: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easing } },
}

export const scrollReveal: Variants = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easing } },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easing } },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easing } },
}

/* ─── PageWrapper ─────────────────────────────────────────────
 *  One-shot fade-up on initial mount. For top-of-page entry.
 */
export function PageWrapper({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion()
  const variants: Variants = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 14 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easing } },
  }
  return (
    <motion.div initial="initial" animate="animate" variants={variants}>
      {children}
    </motion.div>
  )
}

/* ─── ScrollReveal ────────────────────────────────────────────
 *  Reveals children when they scroll into view. Fires once
 *  (viewport once: true) so it doesn't re-animate on scroll-up.
 *
 *  Props
 *    delay     — seconds to wait after entering view
 *    y         — px to translate from (default 20). Set higher
 *                for more dramatic reveals; under reduced-motion
 *                it's silently zeroed.
 *    margin    — IntersectionObserver margin offset; default
 *                triggers slightly before the element enters.
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 20,
  margin = '-80px',
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  margin?: string
}) {
  const prefersReducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: margin as `-${number}px` }}
      transition={{
        duration: 0.5,
        ease: easing,
        delay: prefersReducedMotion ? 0 : delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── StaggerContainer / StaggerItem ──────────────────────────
 *  Wrap a list with StaggerContainer; wrap each child with
 *  StaggerItem. Children reveal one after another. Under
 *  reduced-motion, stagger drops to zero — everything appears
 *  together but still fades in.
 */
export function StaggerContainer({
  children,
  className,
  stagger = 0.06,
  delayChildren = 0.1,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  delayChildren?: number
}) {
  const prefersReducedMotion = useReducedMotion()
  return (
    <motion.div
      initial="initial"
      whileInView="whileInView"
      viewport={{ once: true, margin: '-80px' }}
      variants={{
        initial: {},
        whileInView: {
          transition: {
            staggerChildren: prefersReducedMotion ? 0 : stagger,
            delayChildren: prefersReducedMotion ? 0 : delayChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const prefersReducedMotion = useReducedMotion()
  const variants: Variants = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
    whileInView: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: easing },
    },
  }
  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  )
}

/* ─── FadeUp ──────────────────────────────────────────────────
 *  Non-scroll-triggered fade-up. Used for hero entries that
 *  should animate on initial mount (above-the-fold).
 */
export function FadeUp({
  children,
  className,
  delay = 0,
  y = 14,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}) {
  const prefersReducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: easing,
        delay: prefersReducedMotion ? 0 : delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── Parallax ────────────────────────────────────────────────
 *  Subtle vertical parallax driven by the wrapped element's
 *  scroll progress through the viewport. The element translates
 *  Y by ±strength% of its own height as it moves through view.
 *
 *  Performance notes
 *    • Single transform (translateY) per element — composited.
 *    • useScroll's offset model means the browser only computes
 *      progress once per scroll event, not once per frame.
 *    • Wrap ONE element per section, max. Stacking many parallax
 *      elements per viewport degrades fast on low-end Android.
 *    • Under reduced-motion this becomes a static container —
 *      no transform at all.
 *
 *  Tasteful range: strength = 8–25. Default 15 is a gentle
 *  background-vs-foreground feel without seasickness.
 */
export function Parallax({
  children,
  className,
  strength = 15,
}: {
  children: ReactNode
  className?: string
  strength?: number
}) {
  const prefersReducedMotion = useReducedMotion()
  const ref = React.useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? ['0%', '0%'] : [`${strength}%`, `-${strength}%`]
  )
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  )
}

/* ─── ScaleIn ─────────────────────────────────────────────────
 *  For elements that should "land" rather than rise.
 *  Subtle scale + opacity. Used for big numerals, badges,
 *  punctuation moments.
 */
export function ScaleIn({
  children,
  className,
  delay = 0,
  from = 0.92,
}: {
  children: ReactNode
  className?: string
  delay?: number
  from?: number
}) {
  const prefersReducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : from }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.5,
        ease: easing,
        delay: prefersReducedMotion ? 0 : delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── CountUp ─────────────────────────────────────────────────
 *  Eases an integer from 0 to `value` over ~1.2s when the
 *  element enters viewport. Preserved from earlier version.
 *  Already lightweight (single rAF loop, single state).
 */
export function CountUp({
  value,
  suffix = '',
}: {
  value: number
  suffix?: string
}) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <CountUpInner value={value} suffix={suffix} />
      </motion.span>
    </motion.span>
  )
}

function CountUpInner({ value, suffix }: { value: number; suffix: string }) {
  const prefersReducedMotion = useReducedMotion()
  const [display, setDisplay] = React.useState(prefersReducedMotion ? value : 0)
  const ref = React.useRef<HTMLSpanElement>(null)
  const hasAnimated = React.useRef(false)

  React.useEffect(() => {
    if (prefersReducedMotion || hasAnimated.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 1200
          const start = performance.now()
          const animate = (now: number) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplay(Math.round(eased * value))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, prefersReducedMotion])

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  )
}
