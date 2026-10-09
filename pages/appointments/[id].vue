<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })
const route = useRoute()
const appointmentId = computed(() => route.params.id as string)
const { data: appointment, error, refresh } = useAppointment(appointmentId)
const { busy, active, hasStarted, pendingStatus, confirmation, askStatus, decideStatus, changeStatus, openRecord } = useAppointmentStatus(appointment)
</script>

<template>
  <PageHeader title="Agendamento">
    <template #actions><Button variant="outline" size="sm" as-child><NuxtLink :to="appointment ? `/agenda?date=${zonedDay(appointment.scheduledFor)}` : '/agenda'">Ver agenda</NuxtLink></Button></template>
  </PageHeader>
  <div class="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8 lg:px-12">
    <div v-if="error" class="text-sm">
      <p>{{ apiErrorMessage(error, { 404: 'Agendamento não encontrado.', default: 'Não foi possível carregar o agendamento.' }) }}</p>
      <Button class="mt-3" variant="outline" @click="refresh()">Tentar novamente</Button>
    </div>
    <template v-else-if="appointment">
      <div class="flex flex-col gap-2">
        <NuxtLink :to="`/patients/${appointment.patientId}`" class="display-serif text-3xl hover:underline">{{ appointment.patientName ?? 'Paciente' }}</NuxtLink>
        <p>{{ formatDateTime(appointment.scheduledFor) }}</p>
        <p class="text-sm text-muted-foreground">{{ modalityLabel(appointment.modality) }} · {{ appointment.durationMinutes }} min</p>
        <Badge class="self-start" variant="outline">{{ appointmentStatusLabel(appointment.status) }}</Badge>
      </div>
      <div class="flex flex-wrap gap-2">
        <NewSessionDialog v-if="active && !appointment.sessionId" :appointment="appointment" @saved="refresh()">
          <Button variant="outline" :disabled="busy">Reagendar</Button>
        </NewSessionDialog>
        <Button v-if="appointment.status === 'scheduled'" variant="outline" :disabled="busy" @click="changeStatus('confirmed')">Confirmar</Button>
        <Button v-if="active && hasStarted" :disabled="busy" @click="askStatus('completed')">Marcar como realizada</Button>
        <Button v-if="active && hasStarted && !appointment.sessionId" variant="outline" :disabled="busy" @click="askStatus('no_show')">Registrar falta</Button>
        <Button v-if="active && !appointment.sessionId" variant="outline" :disabled="busy" @click="askStatus('canceled')">Cancelar sessão</Button>
      </div>
      <ConfirmDialog
        :open="pendingStatus !== null"
        :title="confirmation?.title ?? ''"
        :description="confirmation?.description ?? ''"
        :confirm-label="confirmation?.confirmLabel ?? ''"
        :destructive="confirmation?.destructive"
        @decision="decideStatus"
      />
      <section class="flex flex-col gap-3 rounded-lg border bg-card p-5">
        <h2 class="font-serif text-2xl">Evolução da sessão</h2>
        <p class="text-sm text-muted-foreground">A evolução é opcional e pode ser preenchida ou editada depois. Salvar o texto não marca o atendimento como realizado.</p>
        <Button v-if="appointment.sessionId || (hasStarted && (active || appointment.status === 'completed'))" class="self-start" :disabled="busy" @click="openRecord()">
          {{ appointment.sessionId ? 'Abrir prontuário' : 'Registrar evolução' }}
        </Button>
        <p v-else class="text-sm text-muted-foreground">{{ active ? 'Disponível a partir do horário do atendimento.' : 'Este agendamento foi encerrado sem atendimento.' }}</p>
      </section>
    </template>
    <p v-else class="text-sm text-muted-foreground">Carregando agendamento…</p>
  </div>
</template>
