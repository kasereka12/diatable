import { useEffect, useRef, type RefObject } from 'react'

export function useScrollReveal(): RefObject<HTMLDivElement | null> {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const els = container.querySelectorAll<HTMLElement>('[data-reveal]')
    if (!els.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity   = '1';
            (entry.target as HTMLElement).style.transform = 'translateY(0)'
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    els.forEach((el) => {
      el.style.opacity    = '0'
      el.style.transform  = 'translateY(32px)'
      const delay = (el as HTMLElement & { dataset: DOMStringMap }).dataset['delay'] || '0s'
      el.style.transition = `opacity 0.7s ease ${delay}, transform 0.7s ease ${delay}`
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return containerRef
}
