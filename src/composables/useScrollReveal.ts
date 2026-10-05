import { onMounted, onUnmounted, ref, type Ref } from 'vue'

export type RevealVariant = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade'

/**
 * Animation d'apparition au scroll via IntersectionObserver (performant).
 * Usage: const { el } = useScrollReveal('up')
 * <div ref="el" class="reveal reveal-up">...</div>
 */
export function useScrollReveal(variant: RevealVariant = 'up', options?: {
  threshold?: number
  rootMargin?: string
  once?: boolean
}) {
  const el = ref<HTMLElement | null>(null)
  let observer: IntersectionObserver | null = null
  const once = options?.once !== false

  onMounted(() => {
    const node = el.value
    if (!node || typeof IntersectionObserver === 'undefined') {
      node?.classList.add('reveal-visible')
      return
    }

    node.classList.add('reveal', `reveal-${variant}`)

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible')
            if (once) observer?.unobserve(entry.target)
          } else if (!once) {
            entry.target.classList.remove('reveal-visible')
          }
        })
      },
      {
        threshold: options?.threshold ?? 0.15,
        rootMargin: options?.rootMargin ?? '0px 0px -8% 0px'
      }
    )
    observer.observe(node)
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  return { el }
}

/** Applique le reveal sur tous les [data-reveal] d'un conteneur */
export function initScrollReveals(root: ParentNode | Document = document) {
  if (typeof IntersectionObserver === 'undefined') return () => {}

  const nodes = root.querySelectorAll<HTMLElement>('[data-reveal]')
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  )

  nodes.forEach((node, i) => {
    const variant = node.dataset.reveal || 'up'
    const delay = node.dataset.revealDelay || ''
    node.classList.add('reveal', `reveal-${variant}`)
    if (delay) node.style.transitionDelay = delay
    // stagger optionnel via data-reveal-stagger="80"
    const stagger = node.dataset.revealStagger
    if (stagger) {
      node.style.transitionDelay = `${i * Number(stagger)}ms`
    }
    observer.observe(node)
  })

  return () => observer.disconnect()
}
