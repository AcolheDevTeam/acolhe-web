<script setup lang="ts">
const props = withDefaults(defineProps<{ values?: number[]; width?: number; height?: number }>(), {
  width: 200,
  height: 40,
})

const points = computed(() => {
  const vals = props.values ?? []
  if (vals.length < 2) return ''
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const stepX = props.width / (vals.length - 1)
  return vals
    .map((v, i) => {
      const x = i * stepX
      const y = props.height - ((v - min) / span) * props.height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})
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
    <polyline
      v-if="points"
      :points="points"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>
