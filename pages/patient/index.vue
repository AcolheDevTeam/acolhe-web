<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { useNow } from '@vueuse/core'
import type { PatientNextSession } from '~/types'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'patient', middleware: ['auth', 'patient-only'] })

const { me, context, nextSession, activities, checkins, summary, pending, error } = usePatientPortal()
const confirmationSubmitting = ref(false)
const confirmationError = ref('')
const now = useNow({ interval: 60000 })
const canConfirm = computed(() => nextSession.data.value?.status === 'scheduled'
  && new Date(nextSession.data.value.scheduledFor) > now.value)
watch(() => nextSession.data.value?.id, () => { confirmationError.value = '' })

async function confirmAppointment() {
  const appointment = nextSession.data.value
  if (!appointment || !canConfirm.value || confirmationSubmitting.value) return
  confirmationSubmitting.value = true
  confirmationError.value = ''
  try {
    const confirmed = await $fetch<PatientNextSession>(`/api/patient/appointments/${appointment.id}/confirm`, { method: 'POST' })
    nextSession.data.value = confirmed
    await nextSession.refresh()
  } catch (error) {
    confirmationError.value = apiErrorMessage(error, {
      403: 'Seu vínculo precisa estar ativo para confirmar a presença.',
      404: 'Este agendamento não está mais disponível para você.',
      409: 'Este agendamento foi encerrado ou o horário do atendimento já chegou.',
      default: 'Não foi possível confirmar sua presença agora. Tente novamente.',
    })
    await nextSession.refresh()
  } finally { confirmationSubmitting.value = false }
}

const firstName = computed(() => (context.data.value?.fullName ?? me.value?.patient?.fullName ?? '').split(' ')[0])
const eyebrow = patientEyebrowDate()

async function onCheckinSaved() {
  await Promise.all([checkins.refresh(), summary.refresh()])
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: APP_TIMEZONE }).format(new Date(value))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: APP_TIMEZONE }).format(new Date(value))
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <PatientPageHeader :eyebrow="eyebrow" :title="`Oi${firstName ? `, ${firstName}` : ''}.`" />

    <PortalLoadState :pending="pending" :error="error">
      <div class="flex flex-col gap-6">
        <section class="animate-rise flex flex-col gap-3.5 rounded-3xl bg-brand p-5 text-brand-foreground" aria-labelledby="t-sessao">
          <h2 id="t-sessao" class="label-mono text-brand-muted">Sua próxima sessão</h2>
          <div>
            <p class="text-2xl font-semibold tracking-[-0.02em] text-white">
              {{ nextSession.data.value ? formatDate(nextSession.data.value.scheduledFor) : 'Ainda não há uma sessão marcada' }}
            </p>
            <p class="mt-1 text-sm text-brand-foreground/80">
              <template v-if="nextSession.data.value">
                {{ formatTime(nextSession.data.value.scheduledFor) }} · {{ nextSession.data.value.durationMinutes }} min ·
                {{ nextSession.data.value.modality === 'online' ? 'Online' : 'Presencial' }}
              </template>
              <template v-else>Quando houver uma nova sessão, ela aparecerá aqui.</template>
            </p>
          </div>
          <div aria-live="polite">
            <p v-if="nextSession.data.value?.status === 'confirmed'" class="flex items-center gap-2 text-sm text-white"><Check class="size-4" />Presença confirmada</p>
            <Button v-else-if="canConfirm" variant="on-brand" class="w-full" :loading="confirmationSubmitting" @click="confirmAppointment">
              {{ confirmationSubmitting ? 'Confirmando…' : 'Confirmar presença' }}
            </Button>
          </div>
          <p v-if="confirmationError" class="text-sm text-white" role="alert">{{ confirmationError }}</p>
        </section>

        <PatientCheckinCard
          :checkins="checkins.data.value ?? []"
          @saved="onCheckinSaved"
          @conflict="checkins.refresh()"
        />

        <section class="flex flex-col gap-3" aria-labelledby="t-atividades">
          <div class="flex items-center justify-between">
            <h2 id="t-atividades" class="label-mono">Atividades · {{ activities.data.value.length }} pendentes</h2>
            <NuxtLink v-if="activities.data.value.length > 3" to="/patient/activities" class="text-sm font-medium text-primary">Ver todas</NuxtLink>
          </div>
          <PatientActivityList :activities="activities.data.value" :limit="3" />
        </section>

        <section class="grid grid-cols-3 gap-3 rounded-2xl border bg-card p-5" aria-label="Resumo do processo">
          <div><p class="text-2xl font-semibold tabular-nums">{{ summary.data.value.sessionCount }}</p><p class="text-xs text-muted-foreground">sessões</p></div>
          <div><p class="text-2xl font-semibold tabular-nums">{{ summary.data.value.pendingActivityCount }}</p><p class="text-xs text-muted-foreground">pendentes</p></div>
          <div><p class="text-2xl font-semibold tabular-nums">{{ summary.data.value.checkinCount }}</p><p class="text-xs text-muted-foreground">check-ins</p></div>
        </section>
      </div>
    </PortalLoadState>
  </div>
</template>
