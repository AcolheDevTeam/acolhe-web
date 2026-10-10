<script setup lang="ts">
import { ChevronLeft, RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

// Leitura de uma sessão do "Meu prontuário" (ACO-88). A API tem um único texto
// livre por sessão: ele aparece como foi escrito, com as quebras de linha, e
// sem as seções Demanda/Evolução/Conduta do protótipo, que ainda não existem.
definePageMeta({ layout: 'patient', middleware: ['auth', 'patient-only'] })

const route = useRoute()
const sessionId = computed(() => String(route.params.id ?? ''))
const { data: session, status, error, refresh } = usePatientHistorySession(sessionId)
const pending = computed(() => status.value === 'pending' || status.value === 'idle')
const notFound = computed(() => apiErrorInfo(error.value).status === 404)
const errorText = computed(() => error.value ? patientHistoryErrorMessage(error.value, 'session') : '')
const meta = computed(() => session.value ? historyDetailMeta(session.value) : '')
</script>

<template>
  <div class="flex flex-col gap-5">
    <NuxtLink to="/patient/historico" class="animate-fade -ml-1 flex w-fit items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-medium text-primary hover:text-brand">
      <ChevronLeft class="size-[18px]" :stroke-width="1.8" aria-hidden="true" />Todas as sessões
    </NuxtLink>
    <PortalLoadState
      :pending="pending && !session"
      :error="error"
      :error-title="notFound ? 'Sessão não encontrada.' : 'Não foi possível abrir esta sessão.'"
      :error-text="notFound ? 'Ela não está na sua lista de sessões.' : errorText"
    >
      <template #error-action>
        <Button v-if="!notFound" variant="outline" @click="() => refresh()"><RefreshCw class="size-4" />Tentar novamente</Button>
        <Button variant="ghost" @click="navigateTo('/patient/historico')">Ver todas as sessões</Button>
      </template>
      <article v-if="session" class="flex flex-col gap-5">
        <PatientPageHeader :title="`Sessão ${session.number} · ${historyDateLabel(session.occurredAt)}`" :description="meta || undefined" />
        <section class="animate-rise flex flex-col gap-3 rounded-2xl border bg-card p-5 [animation-delay:60ms]" aria-labelledby="t-registro">
          <h2 id="t-registro" class="label-mono">Registro da sessão</h2>
          <p v-if="session.notes.trim()" class="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{{ session.notes }}</p>
          <p v-else class="text-sm text-muted-foreground">Sua psicóloga não fez anotações nesta sessão.</p>
        </section>
        <p class="font-mono text-xs text-muted-foreground">{{ historyVersionLabel(session) }}</p>
      </article>
    </PortalLoadState>
  </div>
</template>
