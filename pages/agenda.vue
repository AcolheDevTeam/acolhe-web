<script setup lang="ts">
import { z } from 'zod'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })
const route = useRoute()
const { data: appointments, error, status, refresh } = useAppointments()
const queryDate = z.string().date().safeParse(route.query.date)
const selectedDate = ref(queryDate.success ? queryDate.data : zonedDay())
// Dias e horas no fuso do app: o SSR roda em UTC e a hidratação não corrige o
// `style` dos blocos (ACO-83).
const days = computed(() => {
  const monday = weekStart(selectedDate.value || zonedDay())
  return Array.from({ length: 7 }, (_, index) => {
    const iso = addCalendarDays(monday, index)
    return { iso, label: calendarDayLabel(iso), appointments: (appointments.value ?? []).filter(a => zonedDay(a.scheduledFor) === iso) }
  })
})
const visibleAppointments = computed(() => days.value.flatMap(day => day.appointments).filter(a => a.status !== 'canceled'))
const firstHour = computed(() => Math.min(8, ...visibleAppointments.value.map(a => zonedParts(a.scheduledFor).hour)))
const lastHour = computed(() => Math.min(24, Math.max(20, ...visibleAppointments.value.map((a) => {
  const start = zonedParts(a.scheduledFor)
  return Math.ceil(start.hour + (start.minute + a.durationMinutes) / 60)
}))))
const hours = computed(() => Array.from({ length: lastHour.value - firstHour.value }, (_, index) => index + firstHour.value))
const canceled = computed(() => days.value.flatMap(day => day.appointments).filter(a => a.status === 'canceled'))
function moveWeek(offset: number) {
  selectedDate.value = addCalendarDays(days.value[0]!.iso, offset * 7)
}
function position(iso: string, minutes: number) {
  const { hour, minute } = zonedParts(iso)
  return { top: `${(hour - firstHour.value + minute / 60) * 60}px`, height: `${Math.min(minutes, 1440 - hour * 60 - minute)}px` }
}
</script>

<template>
  <PageHeader title="Agenda">
    <template #actions>
      <NewSessionDialog><Button size="sm"><Plus />Agendar sessão</Button></NewSessionDialog>
    </template>
  </PageHeader>
  <div class="flex flex-col gap-6 px-4 py-6 md:px-8 md:py-8 lg:px-12">
    <div class="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" aria-label="Semana anterior" @click="moveWeek(-1)"><ChevronLeft /></Button>
      <div class="w-44"><DatePicker v-model="selectedDate" aria-label="Escolher semana" /></div>
      <Button variant="outline" size="icon" aria-label="Próxima semana" @click="moveWeek(1)"><ChevronRight /></Button>
      <Button variant="ghost" size="sm" @click="selectedDate = zonedDay()">Hoje</Button>
      <p class="label-mono">{{ formatDate(days[0]!.iso) }} – {{ formatDate(days[6]!.iso) }}</p>
    </div>
    <EmptyState v-if="error" compact>
      {{ apiErrorMessage(error, { default: 'Não foi possível carregar a agenda agora.' }) }}
      <template #action>
        <Button variant="outline" @click="refresh()">Tentar novamente</Button>
      </template>
    </EmptyState>
    <p v-else-if="status === 'pending'" class="text-sm text-muted-foreground">Carregando agenda…</p>
    <template v-else>
      <div class="flex flex-col gap-6 lg:hidden">
        <section v-for="day in days" :key="day.iso" class="flex flex-col gap-2">
          <h2 class="label-mono">{{ day.label }}</h2>
          <AppointmentRow v-for="appointment in day.appointments" :key="appointment.id" :appointment="appointment" />
          <p v-if="!day.appointments.length" class="text-sm text-muted-foreground">Nenhuma sessão agendada.</p>
        </section>
      </div>
      <div class="hidden overflow-auto rounded-lg border lg:block">
        <div class="grid min-w-[800px] grid-cols-[4rem_repeat(7,minmax(0,1fr))] border-b bg-card">
          <div />
          <p v-for="day in days" :key="day.iso" class="border-l p-3 text-center text-xs font-medium">{{ day.label }}</p>
        </div>
        <div class="grid min-w-[800px] grid-cols-[4rem_repeat(7,minmax(0,1fr))]">
          <div><p v-for="hour in hours" :key="hour" class="h-[60px] border-b px-2 pt-1 font-mono text-xs text-muted-foreground">{{ String(hour).padStart(2, '0') }}:00</p></div>
          <div v-for="day in days" :key="day.iso" class="relative border-l">
            <div v-for="hour in hours" :key="hour" class="h-[60px] border-b" />
            <NuxtLink v-for="appointment in day.appointments.filter(a => a.status !== 'canceled')" :key="appointment.id" :to="`/appointments/${appointment.id}`"
              class="absolute left-1 right-1 overflow-hidden rounded border bg-card px-2 text-xs leading-4 hover:bg-accent"
              :style="position(appointment.scheduledFor, appointment.durationMinutes)"
              :aria-label="`${appointment.patientName ?? 'Paciente'}, ${formatTime(appointment.scheduledFor)}, ${appointmentStatusLabel(appointment.status)}`">
              <p class="truncate font-medium">{{ appointment.patientName ?? 'Paciente' }}</p>
              <p v-if="appointment.durationMinutes >= 30" class="truncate text-muted-foreground">{{ formatTime(appointment.scheduledFor) }} · {{ modalityLabel(appointment.modality) }}</p>
            </NuxtLink>
          </div>
        </div>
      </div>
      <section v-if="canceled.length" class="hidden flex-col gap-2 lg:flex">
        <p class="label-mono">Canceladas nesta semana</p>
        <AppointmentRow v-for="appointment in canceled" :key="appointment.id" :appointment="appointment" />
      </section>
    </template>
  </div>
</template>
