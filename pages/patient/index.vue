<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { useNow } from '@vueuse/core'
import type { PatientNextSession } from '~/types'
import { Button } from '@/components/ui/button'

definePageMeta({ layout: 'patient', middleware: ['auth', 'patient-only'] })

const { me, context, nextSession, activities, checkins, pending, error } = usePatientPortal()
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
  await checkins.refresh()
}

const pendingLabel = computed(() => {
  const count = activities.data.value.length
  return count === 1 ? '1 pendente' : `${count} pendentes`
})

// "Quinta, 9 de outubro, 14h00" (horário de Brasília).
function formatDate(value: string) {
  const date = new Date(value)
  const day = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: APP_TIMEZONE }).format(date).split('-feira').join('')
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: APP_TIMEZONE }).format(date).replace(':', 'h')
  return `${day.charAt(0).toUpperCase()}${day.slice(1)}, ${time}`
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <PatientPageHeader :eyebrow="eyebrow" :title="`Oi${firstName ? `, ${firstName}` : ''}.`" account />

    <PortalLoadState :pending="pending" :error="error">
      <div class="flex flex-col gap-6">
        <section class="animate-rise flex flex-col gap-3.5 rounded-[18px] bg-brand p-5 text-brand-foreground [animation-delay:80ms]" aria-labelledby="t-sessao">
          <h2 id="t-sessao" class="label-mono font-medium text-brand-muted">Sua próxima sessão</h2>
          <div>
            <p class="text-2xl font-semibold tracking-[-0.02em] text-white">
              {{ nextSession.data.value ? formatDate(nextSession.data.value.scheduledFor) : 'Ainda não há uma sessão marcada' }}
            </p>
            <p class="mt-1 text-sm text-[#C3CAF0]">
              <template v-if="nextSession.data.value">
                {{ nextSession.data.value.modality === 'online' ? 'Online' : 'Presencial' }} · {{ nextSession.data.value.durationMinutes }} min
              </template>
              <template v-else>Quando houver uma nova sessão, ela aparecerá aqui.</template>
            </p>
          </div>
          <div aria-live="polite">
            <p v-if="nextSession.data.value?.status === 'confirmed'" class="animate-fade flex h-12 items-center gap-2 text-[15px] font-medium text-highlight"><Check class="size-5" :stroke-width="2.4" aria-hidden="true" />Presença confirmada.</p>
            <Button v-else-if="canConfirm" variant="on-brand" size="xl" class="w-full" :loading="confirmationSubmitting" @click="confirmAppointment">
              {{ confirmationSubmitting ? 'Confirmando…' : 'Confirmar presença' }}
            </Button>
          </div>
          <p v-if="confirmationError" class="text-sm text-white" role="alert">{{ confirmationError }}</p>
        </section>

        <PatientCheckinCard
          class="animate-rise [animation-delay:160ms]"
          :checkins="checkins.data.value ?? []"
          @saved="onCheckinSaved"
          @conflict="checkins.refresh()"
        />

        <section class="animate-rise flex flex-col gap-3 [animation-delay:240ms]" aria-labelledby="t-atividades">
          <div class="flex items-baseline justify-between gap-3">
            <h2 id="t-atividades" class="text-lg font-semibold tracking-[-0.01em]">Atividades</h2>
            <span class="font-mono text-xs text-muted-foreground">{{ pendingLabel }}</span>
          </div>
          <PatientActivityList :activities="activities.data.value" :limit="3" />
          <NuxtLink v-if="activities.data.value.length > 3" to="/patient/activities" class="self-start text-sm font-medium text-primary">Ver todas as atividades</NuxtLink>
        </section>
      </div>
    </PortalLoadState>
  </div>
</template>
