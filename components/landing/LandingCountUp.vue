<script setup lang="ts">
import { countUpValue } from '~/utils/landing'

// Número que conta de 0 até o valor uma vez, quando entra na tela. O SSR e
// quem pediu menos movimento veem o valor final direto.
const props = withDefaults(defineProps<{ value: number, duration?: number }>(), { duration: 1200 })

const el = ref<HTMLElement | null>(null)
const shown = ref(props.value)
let observer: IntersectionObserver | undefined
let frame = 0

function run() {
  const start = performance.now()
  const step = (now: number) => {
    shown.value = countUpValue(props.value, (now - start) / props.duration)
    if (shown.value < props.value) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
}

onMounted(() => {
  if (!el.value || typeof IntersectionObserver === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (el.value.getBoundingClientRect().top < window.innerHeight) return
  shown.value = 0
  observer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return
    observer?.disconnect()
    run()
  }, { threshold: 0.6 })
  observer.observe(el.value)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
})
</script>

<template>
  <span ref="el" class="tabular-nums">{{ shown }}</span>
</template>
