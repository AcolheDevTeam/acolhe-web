<script setup lang="ts">
// `min`/`max` fixam a escala (ex.: humor 1–5); sem eles, a linha usa o menor e o
// maior valor da série. `guides` desenha as três linhas-guia do protótipo.
const props = withDefaults(defineProps<{
  values?: number[]
  width?: number
  height?: number
  min?: number
  max?: number
  strokeWidth?: number
  guides?: boolean
}>(), {
  width: 200,
  height: 40,
  strokeWidth: 1.5,
})

const points = computed(() => {
  const vals = props.values ?? []
  if (vals.length < 2) return ''
  const min = props.min ?? Math.min(...vals)
  const max = props.max ?? Math.max(...vals)
  const span = max - min || 1
  // Margem de meio traço para a linha não ser cortada no topo e na base.
  const pad = props.strokeWidth
  const stepX = props.width / (vals.length - 1)
  return vals
    .map((v, i) => {
      const x = i * stepX
      const y = pad + (props.height - 2 * pad) * (1 - (v - min) / span)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})

const guideLines = computed(() =>
  [1, 2, 3].map(n => (props.height / 4) * n),
)
</script>

<template>
  <svg
    :viewBox="`0 0 ${width} ${height}`"
    :width="width"
    :height="height"
    class="text-foreground"
    preserveAspectRatio="none"
    fill="none"
  >
    <template v-if="guides">
      <line
        v-for="y in guideLines"
        :key="y"
        x1="0"
        :x2="width"
        :y1="y"
        :y2="y"
        class="stroke-secondary"
        stroke-width="1"
        vector-effect="non-scaling-stroke"
      />
    </template>
    <polyline
      v-if="points"
      :points="points"
      stroke="currentColor"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>
