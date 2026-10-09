<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { X } from 'lucide-vue-next'
import type { Appointment } from '~/types'
import { Button } from '@/components/ui/button'

// Detalhe do evento da agenda (protótipo: cartão flutuante à direita; no
// celular fica preso embaixo). Não bloqueia a grade: clicar em outro evento
// troca o conteúdo. Esc ou o X fecham.
const props = defineProps<{ appointment: Appointment }>()
const emit = defineEmits<{ close: [] }>()
const appointment = toRef(props, 'appointment')
const { busy, active, hasStarted, canOpenRecord, pendingStatus, confirmation, askStatus, decideStatus, changeStatus, openRecord } = useAppointmentStatus(appointment)

const when = computed(() => {
  const day = zonedDay(appointment.value.scheduledFor)
  return `${weekdayAbbr(day)} · ${dayLongLabel(day).split(', ')[1]}`
})
const canReschedule = computed(() => active.value && !appointment.value.sessionId)

// Foco entra no painel ao abrir (e ao trocar de evento) e volta para quem o
// abriu ao fechar.
const panel = ref<HTMLElement | null>(null)
const closeButton = ref<{ $el: HTMLElement } | null>(null)
let opener: HTMLElement | null = null
onMounted(() => {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
  closeButton.value?.$el.focus()
})
onBeforeUnmount(() => { if (opener?.isConnected) opener.focus() })
watch(() => appointment.value.id, () => {
  pendingStatus.value = null
  nextTick(() => closeButton.value?.$el.focus())
})

// Esc fecha mesmo com o foco fora do painel; dentro de outro diálogo
// (confirmação, reagendar) o Esc é dele.
useEventListener(document, 'keydown', (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || pendingStatus.value) return
  const target = event.target instanceof Element ? event.target : null
  if (target?.closest('[role="dialog"], [role="alertdialog"]') && !panel.value?.contains(target)) return
  emit('close')
})
</script>

<template>
  <section
    ref="panel"
    role="dialog"
    aria-labelledby="agenda-evento-titulo"
    class="fixed inset-x-4 bottom-4 z-40 flex max-h-[calc(100dvh-2rem)] flex-col gap-[18px] overflow-y-auto rounded-2xl border bg-card p-6 shadow-[0_24px_60px_rgba(22,26,58,.18)] sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-6 sm:w-[380px] lg:right-10 animate-[agenda-panel_.45s_var(--ease-out)_both]"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-col gap-1">
        <p class="label-mono">{{ when }}</p>
        <h2 id="agenda-evento-titulo" class="truncate text-[22px] font-semibold tracking-[-0.02em]">{{ appointment.patientName ?? 'Paciente' }}</h2>
      </div>
      <Button ref="closeButton" variant="ghost" size="icon" class="shrink-0 text-primary" aria-label="Fechar detalhes" @click="emit('close')"><X class="!size-[18px]" /></Button>
    </div>

    <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
      <dt class="text-muted-foreground">Horário</dt><dd>{{ formatTime(appointment.scheduledFor) }} · {{ appointment.durationMinutes }} min</dd>
      <dt class="text-muted-foreground">Modalidade</dt><dd>{{ modalityLabel(appointment.modality) }}</dd>
      <dt class="text-muted-foreground">Situação</dt><dd class="font-semibold" aria-live="polite">{{ appointmentStatusLabel(appointment.status) }}</dd>
    </dl>

    <div v-if="active" class="grid grid-cols-2 gap-2">
      <Button v-if="appointment.status === 'scheduled'" variant="outline" :disabled="busy" @click="changeStatus('confirmed')">Confirmar</Button>
      <Button v-if="hasStarted" variant="outline" :disabled="busy" @click="askStatus('completed')">Realizada</Button>
      <Button v-if="hasStarted && !appointment.sessionId" variant="destructive-soft" :disabled="busy" @click="askStatus('no_show')">Falta</Button>
      <Button v-if="canReschedule" variant="destructive-soft" :disabled="busy" @click="askStatus('canceled')">Cancelar</Button>
    </div>

    <div v-if="canReschedule || canOpenRecord" class="flex gap-2">
      <NewSessionDialog v-if="canReschedule" :appointment="appointment">
        <Button variant="outline" class="flex-1" :disabled="busy">Reagendar</Button>
      </NewSessionDialog>
      <Button v-if="canOpenRecord" class="flex-1" :disabled="busy" @click="openRecord()">Abrir sessão</Button>
    </div>

    <NuxtLink :to="`/patients/${appointment.patientId}`" class="self-start text-[13px] text-primary underline underline-offset-[3px] hover:text-accent-foreground">Ver ficha do paciente</NuxtLink>

    <ConfirmDialog
      :open="pendingStatus !== null"
      :title="confirmation?.title ?? ''"
      :description="confirmation?.description ?? ''"
      :confirm-label="confirmation?.confirmLabel ?? ''"
      :destructive="confirmation?.destructive"
      @decision="decideStatus"
    />
  </section>
</template>

<style>
@keyframes agenda-panel {
  from { opacity: 0; transform: translateX(32px); }
  to { opacity: 1; transform: none; }
}
</style>
