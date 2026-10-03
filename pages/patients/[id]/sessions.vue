<script setup lang="ts">
import { useNow } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import { ChevronRight, Eye } from 'lucide-vue-next'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const route = useRoute()
const patientId = computed(() => route.params.id as string)

const { data: patient } = usePatient(patientId)
const { data: sessions, error: sessionsError, status: sessionsStatus, refresh: refreshSessions } = usePatientSessions(patientId)
const { data: appointments, error: appointmentsError, status: appointmentsStatus, refresh: refreshAppointments } = useAppointments()
const now = useNow({ interval: 60000 })
const { opening, openRecord } = useOpenAppointmentRecord()
const pendingAppointments = computed(() => pendingRecordAppointments(
  appointments.value ?? [], sessions.value ?? [], patientId.value, now.value.getTime(),
))
const loading = computed(() => sessionsStatus.value === 'pending' || appointmentsStatus.value === 'pending')
async function retry() { await Promise.all([refreshSessions(), refreshAppointments()]) }

const ordered = computed(() =>
  [...(sessions.value ?? [])].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  ),
)
</script>

<template>
  <PatientShell :patient="patient ?? null" :patient-id="patientId" active="sessions">
    <div class="flex flex-col gap-4">
      <div class="flex items-start gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
        <Eye class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p class="text-muted-foreground">
          <span class="font-medium text-foreground">A paciente tem direito de acesso às informações deste prontuário.</span>
          Registre apenas o necessário ao cumprimento dos objetivos do trabalho (Art. 5º, II —
          Res. CFP 01/2009). Para hipóteses e impressões, use o Registro Documental.
        </p>
      </div>

      <div v-if="sessionsError || appointmentsError" role="alert" class="text-sm">
        <p>{{ apiErrorMessage(sessionsError || appointmentsError, { default: 'Não foi possível carregar todos os atendimentos desta paciente.' }) }}</p>
        <Button variant="outline" class="mt-2" @click="retry">Tentar novamente</Button>
      </div>
      <p v-if="loading" class="text-sm text-muted-foreground" role="status">Carregando atendimentos…</p>
      <template v-if="!loading && !sessionsError && !appointmentsError && pendingAppointments.length">
        <p class="label-mono">Agendamentos sem sessão no prontuário · {{ pendingAppointments.length }}</p>
        <div v-for="appointment in pendingAppointments" :key="appointment.id" class="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-3">
          <div class="min-w-0 flex-1 basis-40">
            <p class="text-sm font-medium">{{ formatDateTime(appointment.scheduledFor) }}</p>
            <p class="text-xs text-muted-foreground">{{ appointmentStatusLabel(appointment.status) }} · {{ modalityLabel(appointment.modality) }} · {{ appointment.durationMinutes }} min</p>
          </div>
          <Button variant="outline" :disabled="opening !== null" @click="openRecord(appointment)">
            {{ opening === appointment.id ? 'Abrindo…' : 'Abrir evolução' }}
          </Button>
        </div>
      </template>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="label-mono">Sessões · {{ ordered.length }}</p>
        <RecordExportButton />
      </div>

      <div v-if="ordered.length" class="overflow-hidden rounded-xl border bg-card">
        <NuxtLink
          v-for="s in ordered"
          :key="s.id"
          :to="`/sessions/${s.id}`"
          class="flex items-center gap-4 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-accent/40"
        >
          <span class="w-14 shrink-0 font-mono text-sm text-muted-foreground">
            {{ s.number ? `S-${s.number}` : '—' }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium">{{ formatDate(s.occurredAt) }}</p>
            <p class="text-xs text-muted-foreground">
              <template v-if="s.modality || s.durationMin">
                {{ modalityLabel(s.modality) }}<template v-if="s.durationMin"> · {{ s.durationMin }} min</template>
              </template>
              <template v-else>Sessão clínica</template>
            </p>
          </div>
          <ChevronRight class="size-4 text-muted-foreground" />
        </NuxtLink>
      </div>
      <p v-else-if="!loading && !sessionsError" class="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        Nenhuma sessão registrada ainda.
      </p>
    </div>
  </PatientShell>
</template>
