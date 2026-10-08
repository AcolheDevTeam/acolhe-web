<script setup lang="ts">
import type { PatientCheckin } from '~/types'
defineProps<{ items: PatientCheckin[], emptyMessage?: string }>()
</script>

<template>
  <div v-if="items.length" class="max-h-[28rem] divide-y overflow-y-auto" aria-label="Histórico de check-ins">
    <article v-for="item in items" :key="item.id" class="flex flex-col gap-2 py-4 first:pt-0">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm font-medium">{{ checkinDateLabel(item.day) }}</p>
        <p class="font-mono text-sm tabular-nums" :aria-label="`Humor ${item.mood} de 5`">{{ item.mood }} / 5</p>
      </div>
      <p v-if="item.note" class="whitespace-pre-wrap break-words text-sm leading-relaxed">{{ item.note }}</p>
      <p v-else class="text-xs text-muted-foreground">Sem observação.</p>
      <p v-if="new Date(item.updatedAt).getTime() > new Date(item.createdAt).getTime()" class="text-xs text-muted-foreground">Editado no dia do registro.</p>
    </article>
  </div>
  <p v-else class="text-sm leading-relaxed text-muted-foreground">{{ emptyMessage ?? 'Nenhum check-in registrado ainda.' }}</p>
</template>
