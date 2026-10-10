import type { Ref } from 'vue'
import { revealDelay } from '~/utils/landing'

// Entrada ao rolar (landing): elementos com `data-reveal` sobem e aparecem uma
// vez quando entram na tela. `data-reveal="2"` atrasa 2 passos (80ms cada).
// O SSR entrega tudo visível; só no cliente, e só abaixo da dobra, o elemento
// é escondido antes de animar. Sem IntersectionObserver ou com
// prefers-reduced-motion, nada é escondido.
export function useReveal(root: Ref<HTMLElement | null>) {
  let observer: IntersectionObserver | undefined

  onMounted(() => {
    const el = root.value
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        // Rolagem rápida pode pular o elemento: o que já passou pelo topo também entra.
        if (!entry.isIntersecting && entry.boundingClientRect.top > 0) continue
        entry.target.classList.remove('reveal-pending')
        observer?.unobserve(entry.target)
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })

    const fold = window.innerHeight
    for (const target of el.querySelectorAll<HTMLElement>('[data-reveal]')) {
      if (target.getBoundingClientRect().top < fold) continue
      target.style.setProperty('--reveal-delay', `${revealDelay(Number(target.dataset.reveal))}ms`)
      target.classList.add('reveal', 'reveal-pending')
      observer.observe(target)
    }
  })

  onBeforeUnmount(() => observer?.disconnect())
}
