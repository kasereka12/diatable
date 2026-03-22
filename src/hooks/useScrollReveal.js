import { useEffect, useRef } from 'react'

/**
 * Returns a ref — attach it to a container.
 * Children with data-reveal will animate in when they enter the viewport.
 */
export function useScrollReveal() {
  const containerRef = useRef(null)

  useEffect(() => {
    const els = containerRef.current
      ? containerRef.current.querySelectorAll('[data-reveal]')
      : []

    if (!els.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity  = '1'
            entry.target.style.transform = 'translateY(0)'
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    els.forEach((el) => {
      el.style.opacity   = '0'
      el.style.transform = 'translateY(32px)'
      el.style.transition = `opacity 0.7s ease ${el.dataset.delay || '0s'}, transform 0.7s ease ${el.dataset.delay || '0s'}`
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return containerRef
}
