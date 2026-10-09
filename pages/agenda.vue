<script setup lang="ts">
import { z } from 'zod'
import { useNow } from '@vueuse/core'
import { ChevronLeft, ChevronRight, House, Plus, Video } from 'lucide-vue-next'
import type { Appointment } from '~/types'
import type { AgendaView } from '~/utils/agenda'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { cn } from '@/lib/utils'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })
const route = useRoute()
const { data: appointments, error, status, refresh } = useAppointments()
const queryDate = z.string().date().safeParse(route.query.date)
const selectedDate = ref(queryDate.success ? queryDate.data : zonedDay())
const view = ref<AgendaView>('semana')
const viewOptions: { value: AgendaView, label: string }[] = [
  { value: 'dia', label: 'Dia' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
]

// Altura de uma hora na grade (protótipo: 56px).
const HOUR = 56
const today = zonedDay()
const all = computed(() => appointments.value ?? [])
// Dias e horas no fuso do app: o SSR roda em UTC e a hidratação não corrige o
// `style` dos blocos (ACO-83).
const byDay = computed(() => {
  const map = new Map<string, Appointment[]>()
  for (const appointment of all.value) {
    const day = zonedDay(appointment.scheduledFor)
    map.set(day, [...(map.get(day) ?? []), appointment])
  }
  for (const list of map.values()) list.sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
  return map
})
const days = computed(() => {
  const sunday = addCalendarDays(weekStart(selectedDate.value), 6)
  const list = view.value === 'dia' ? [selectedDate.value] : weekDays(selectedDate.value, !!byDay.value.get(sunday)?.length)
  return list.map((iso) => {
    const appointments = byDay.value.get(iso) ?? []
    return { iso, abbr: weekdayAbbr(iso), num: Number(iso.slice(8)), isToday: iso === today, appointments, visible: appointments.filter(a => a.status !== 'canceled') }
  })
})
const visibleAppointments = computed(() => days.value.flatMap(day => day.visible))
const canceled = computed(() => days.value.flatMap(day => day.appointments).filter(a => a.status === 'canceled'))
const firstHour = computed(() => Math.min(8, ...visibleAppointments.value.map(a => zonedParts(a.scheduledFor).hour)))
const lastHour = computed(() => Math.min(24, Math.max(20, ...visibleAppointments.value.map((a) => {
  const start = zonedParts(a.scheduledFor)
  return Math.ceil(start.hour + (start.minute + a.durationMinutes) / 60)
}))))
const hours = computed(() => Array.from({ length: lastHour.value - firstHour.value }, (_, index) => index + firstHour.value))
const columns = computed(() => ({ gridTemplateColumns: `64px repeat(${days.value.length}, minmax(0, 1fr))` }))

function position(appointment: Appointment) {
  const { hour, minute } = zonedParts(appointment.scheduledFor)
  const minutes = Math.min(appointment.durationMinutes, 1440 - hour * 60 - minute)
  return { top: `${(hour - firstHour.value + minute / 60) * HOUR + 2}px`, height: `${Math.max(minutes * HOUR / 60 - 2, 20)}px` }
}

// Linha do "agora" só no cliente: o SSR não sabe a hora de quem vê.
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const now = useNow({ interval: 60000 })
const nowTop = computed(() => {
  if (!mounted.value) return null
  const { hour, minute } = zonedParts(now.value)
  if (hour < firstHour.value || hour >= lastHour.value) return null
  return `${(hour - firstHour.value + minute / 60) * HOUR}px`
})

const label = computed(() => {
  if (view.value === 'dia') return dayLongLabel(selectedDate.value)
  if (view.value === 'mes') return monthLabel(selectedDate.value)
  return rangeLabel(days.value[0]!.iso, days.value[days.value.length - 1]!.iso)
})
function move(offset: number) {
  if (view.value === 'mes') selectedDate.value = addMonths(selectedDate.value, offset)
  else selectedDate.value = addCalendarDays(view.value === 'dia' ? selectedDate.value : weekStart(selectedDate.value), offset * (view.value === 'dia' ? 1 : 7))
}

const monthWeekdays = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const month = computed(() => monthCells(selectedDate.value).map(iso => ({
  iso,
  count: iso ? (byDay.value.get(iso) ?? []).filter(a => a.status !== 'canceled').length : 0,
})))
function openDay(iso: string) {
  selectedDate.value = iso
  view.value = 'dia'
}

const selectedId = ref<string | null>(null)
const selected = computed(() => all.value.find(a => a.id === selectedId.value) ?? null)
function select(appointment: Appointment) {
  selectedId.value = appointment.id
}
</script>

<template>
  <PageHeader title="Agenda">
    <template #actions>
      <SegmentedControl v-model="view" :options="viewOptions" label="Visualização" class="w-[258px]" />
      <NewSessionDialog><Button><Plus />Agendar sessão</Button></NewSessionDialog>
    </template>
  </PageHeader>

  <div class="flex flex-col gap-5 px-4 pb-14 pt-6 md:px-8 lg:px-12">
    <div class="animate-rise flex flex-wrap items-center gap-x-3.5 gap-y-2 [animation-delay:60ms]">
      <div class="flex items-center gap-1.5">
        <Button variant="outline" size="icon" aria-label="Período anterior" @click="move(-1)"><ChevronLeft /></Button>
        <Button variant="outline" size="icon" aria-label="Próximo período" @click="move(1)"><ChevronRight /></Button>
        <Button variant="outline" @click="selectedDate = today">Hoje</Button>
      </div>
      <p class="font-mono text-[13px] tracking-[0.06em] text-secondary-foreground" aria-live="polite">{{ label }}</p>
    </div>

    <ul class="animate-rise flex flex-wrap gap-x-[18px] gap-y-2 text-[13px] text-secondary-foreground [animation-delay:90ms]" aria-label="Legenda">
      <li class="inline-flex items-center gap-1.5"><span aria-hidden="true" :class="cn('size-3 rounded-[3px]', appointmentTone('confirmed'))" />Confirmada</li>
      <li class="inline-flex items-center gap-1.5"><span aria-hidden="true" :class="cn('size-3 rounded-[3px]', appointmentTone('scheduled'))" />Agendada</li>
      <li class="inline-flex items-center gap-1.5"><span aria-hidden="true" :class="cn('size-3 rounded-[3px]', appointmentTone('completed'))" />Realizada</li>
      <li class="inline-flex items-center gap-1.5"><span aria-hidden="true" :class="cn('size-3 rounded-[3px]', appointmentTone('no_show'))" />Falta</li>
      <li class="inline-flex items-center gap-1.5"><Video class="size-3.5" aria-hidden="true" />Online</li>
      <li class="inline-flex items-center gap-1.5"><House class="size-3.5" aria-hidden="true" />Presencial</li>
    </ul>

    <EmptyState v-if="error" compact>
      {{ apiErrorMessage(error, { default: 'Não foi possível carregar a agenda agora.' }) }}
      <template #action>
        <Button variant="outline" @click="refresh()">Tentar novamente</Button>
      </template>
    </EmptyState>
    <p v-else-if="status === 'pending'" class="text-sm text-muted-foreground">Carregando agenda…</p>

    <Card v-else-if="view === 'mes'" role="region" :aria-label="`Mês de ${label}`" class="animate-fade overflow-hidden">
      <div class="grid grid-cols-7 border-b">
        <p v-for="weekday in monthWeekdays" :key="weekday" class="label-mono p-2 tracking-[0.12em] sm:p-2.5">{{ weekday }}</p>
      </div>
      <div class="grid grid-cols-7">
        <template v-for="(cell, index) in month" :key="cell.iso ?? `vazio-${index}`">
          <button
            v-if="cell.iso"
            type="button"
            :aria-label="`${dayLongLabel(cell.iso)}: ${cell.count === 1 ? '1 sessão' : `${cell.count} sessões`}`"
            :class="cn('flex min-h-16 flex-col items-start gap-1.5 border-b border-r border-secondary p-1.5 text-left transition-colors hover:bg-surface-subtle sm:min-h-[92px] sm:p-2', cell.iso === today && 'bg-background')"
            @click="openDay(cell.iso)"
          >
            <span :class="cn('text-[13px] font-medium', cell.iso === today && 'font-semibold text-alert')">{{ Number(cell.iso.slice(8)) }}</span>
            <span v-if="cell.count" class="rounded-[10px] bg-accent px-2 py-0.5 text-xs font-medium text-positive">
              {{ cell.count }}<span class="hidden sm:inline"> {{ cell.count === 1 ? 'sessão' : 'sessões' }}</span>
            </span>
          </button>
          <div v-else class="min-h-16 border-b border-r border-secondary sm:min-h-[92px]" />
        </template>
      </div>
    </Card>

    <template v-else>
      <!-- Celular: a semana vira lista por dia; a visão Dia usa a grade. -->
      <div v-if="view === 'semana'" class="flex flex-col gap-6 lg:hidden">
        <section v-for="day in days" :key="day.iso" class="flex flex-col gap-2">
          <h2 :class="cn('label-mono', day.isToday && 'text-alert')">{{ calendarDayLabel(day.iso) }}</h2>
          <AppointmentRow v-for="appointment in day.appointments" :key="appointment.id" :appointment="appointment" selectable @select="select" />
          <p v-if="!day.appointments.length" class="text-sm text-muted-foreground">Nenhuma sessão agendada.</p>
        </section>
      </div>

      <Card role="region" aria-label="Grade da agenda" :class="cn('animate-fade overflow-x-auto', view === 'semana' && 'hidden lg:block')">
        <div :class="view === 'semana' && 'min-w-[820px]'">
          <div class="grid border-b" :style="columns">
            <div />
            <div v-for="day in days" :key="day.iso" class="border-l border-secondary px-2 py-3 text-center">
              <p :class="cn('font-mono text-[11px] uppercase tracking-[0.12em]', day.isToday ? 'text-alert' : 'text-muted-foreground')">{{ day.abbr }}</p>
              <p :class="cn('mt-1 text-xl font-semibold', day.isToday && 'text-alert')">{{ day.num }}</p>
            </div>
          </div>
          <div class="grid" :style="columns">
            <div>
              <p v-for="hour in hours" :key="hour" class="h-14 pr-2 pt-1 text-right font-mono text-[11px] text-muted-foreground">{{ String(hour).padStart(2, '0') }}h</p>
            </div>
            <div
              v-for="(day, dayIndex) in days"
              :key="day.iso"
              :class="cn('relative border-l border-secondary bg-[repeating-linear-gradient(to_bottom,transparent_0_55px,hsl(var(--secondary))_55px_56px)]', day.isToday && 'bg-surface-subtle')"
              :style="{ height: `${hours.length * HOUR}px` }"
            >
              <button
                v-for="(appointment, index) in day.visible"
                :key="appointment.id"
                type="button"
                :class="cn('agenda-event absolute inset-x-1 flex flex-col gap-0.5 overflow-hidden rounded-lg px-2 py-1.5 text-left transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(22,26,58,.12)]', appointmentTone(appointment.status), selectedId === appointment.id && 'ring-2 ring-primary/30')"
                :style="{ ...position(appointment), animationDelay: `${dayIndex * 0.04 + index * 0.03}s` }"
                :aria-label="`${appointment.patientName ?? 'Paciente'}, ${day.abbr} ${formatTime(appointment.scheduledFor)}, ${appointmentStatusLabel(appointment.status)}`"
                @click="select(appointment)"
              >
                <span class="flex min-w-0 items-center gap-1.5 text-[13px] font-semibold leading-4">
                  <Video v-if="appointment.modality === 'online'" class="size-[13px] shrink-0" aria-hidden="true" />
                  <House v-else class="size-[13px] shrink-0" aria-hidden="true" />
                  <span class="truncate">{{ appointment.patientName ?? 'Paciente' }}</span>
                </span>
                <span class="truncate font-mono text-[11px] leading-[14px] opacity-85">{{ formatTime(appointment.scheduledFor) }} · {{ appointmentStatusLabel(appointment.status) }}</span>
              </button>
              <div v-if="day.isToday && nowTop" aria-hidden="true" class="absolute inset-x-0 z-[2] h-0.5 bg-alert" :style="{ top: nowTop }">
                <span class="agenda-now absolute -left-[5px] -top-1 size-2.5 rounded-full bg-alert" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <section v-if="canceled.length" :class="cn('flex-col gap-2', view === 'semana' ? 'hidden lg:flex' : 'flex')">
        <p class="label-mono">{{ view === 'dia' ? 'Canceladas neste dia' : 'Canceladas nesta semana' }}</p>
        <AppointmentRow v-for="appointment in canceled" :key="appointment.id" :appointment="appointment" selectable @select="select" />
      </section>
    </template>

    <AppointmentPanel v-if="selected" :key="selected.id" :appointment="selected" @close="selectedId = null" />
  </div>
</template>

<style scoped>
/* Entrada dos eventos e pulso da linha do "agora" (protótipo). */
.agenda-event { animation: agenda-pop .4s var(--ease-out) backwards; }
.agenda-now { animation: agenda-pulse 2.4s var(--ease-out) infinite; }
@keyframes agenda-pop {
  from { opacity: 0; transform: scale(.96); }
  to { opacity: 1; transform: none; }
}
@keyframes agenda-pulse {
  0% { box-shadow: 0 0 0 0 hsl(var(--alert) / .45); }
  70% { box-shadow: 0 0 0 8px hsl(var(--alert) / 0); }
  100% { box-shadow: 0 0 0 0 hsl(var(--alert) / 0); }
}
</style>
