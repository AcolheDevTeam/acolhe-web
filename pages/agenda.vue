<script setup lang="ts">
import { z } from 'zod'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })
const route = useRoute()
const { data: appointments, error, status, refresh } = useAppointments()
const queryDate = z.string().date().safeParse(route.query.date)
const selectedDate = ref(queryDate.success ? queryDate.data : new Date().toLocaleDateString('sv-SE'))
const monday = computed(() => {
  const date = new Date(`${selectedDate.value || new Date().toLocaleDateString('sv-SE')}T12:00:00`)
  date.setDate(date.getDate() - (date.getDay() + 6) % 7)
  date.setHours(0, 0, 0, 0)
  return date
})
const days = computed(() => Array.from({ length: 7 }, (_, index) => {
  const date = new Date(monday.value)
  date.setDate(date.getDate() + index)
  return { date, iso: date.toLocaleDateString('sv-SE'), label: date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'numeric' }),
    appointments: (appointments.value ?? []).filter(a => new Date(a.scheduledFor).toLocaleDateString('sv-SE') === date.toLocaleDateString('sv-SE')) }
}))
const visibleAppointments = computed(() => days.value.flatMap(day => day.appointments).filter(a => a.status !== 'canceled'))
const firstHour = computed(() => Math.min(8, ...visibleAppointments.value.map(a => new Date(a.scheduledFor).getHours())))
const lastHour = computed(() => Math.min(24, Math.max(20, ...visibleAppointments.value.map((a) => {
  const start = new Date(a.scheduledFor)
  return Math.ceil(start.getHours() + (start.getMinutes() + a.durationMinutes) / 60)
}))))
const hours = computed(() => Array.from({ length: lastHour.value - firstHour.value }, (_, index) => index + firstHour.value))
const canceled = computed(() => days.value.flatMap(day => day.appointments).filter(a => a.status === 'canceled'))
function moveWeek(offset: number) {
  const date = new Date(monday.value)
  date.setDate(date.getDate() + offset * 7)
  selectedDate.value = date.toLocaleDateString('sv-SE')
}
function position(iso: string, minutes: number) {
  const date = new Date(iso)
  return { top: `${(date.getHours() - firstHour.value + date.getMinutes() / 60) * 60}px`, height: `${Math.min(minutes, 1440 - date.getHours() * 60 - date.getMinutes())}px` }
}
</script>

<template>
  <PageHeader title="Agenda">
    <template #actions>
      <NewSessionDialog><Button size="sm"><Plus />Agendar sessão</Button></NewSessionDialog>
    </template>
  </PageHeader>
  <div class="flex flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
    <div class="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" aria-label="Semana anterior" @click="moveWeek(-1)"><ChevronLeft /></Button>
      <div class="w-44"><DatePicker v-model="selectedDate" aria-label="Escolher semana" /></div>
      <Button variant="outline" size="icon" aria-label="Próxima semana" @click="moveWeek(1)"><ChevronRight /></Button>
      <Button variant="ghost" size="sm" @click="selectedDate = new Date().toLocaleDateString('sv-SE')">Hoje</Button>
      <p class="label-mono">{{ formatDate(days[0]!.date.toISOString()) }} – {{ formatDate(days[6]!.date.toISOString()) }}</p>
    </div>
    <div v-if="error" class="rounded-lg border border-dashed p-6 text-sm">
      <p>{{ apiErrorMessage(error, { default: 'Não foi possível carregar a agenda agora.' }) }}</p>
      <Button class="mt-3" variant="outline" @click="refresh()">Tentar novamente</Button>
    </div>
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
