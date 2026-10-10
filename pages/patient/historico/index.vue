<script setup lang="ts">
import { ChevronRight, RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

// "Meu prontuário" (protótipo ProntuarioPaciente): as sessões já ocorridas, da
// mais recente para a mais antiga. Abre mesmo com o vínculo encerrado (ACO-88).
// Sem "Baixar cópia (PDF)" enquanto não houver o PDF.
definePageMeta({ layout: 'patient', middleware: ['auth', 'patient-only'] })

const { data: sessions, status, error, refresh } = usePatientHistory()
const pending = computed(() => status.value === 'pending' || status.value === 'idle')
const errorText = computed(() => error.value ? patientHistoryErrorMessage(error.value, 'list') : '')
</script>

<template>
  <div class="flex flex-col gap-5">
    <PatientPageHeader eyebrow="Histórico" title="Meu prontuário" />
    <p class="animate-rise text-sm leading-relaxed text-secondary-foreground [animation-delay:60ms]">
      Este é o registro das suas sessões feito por sua(seu) psicóloga(o). Se quiser uma cópia, peça a ela(e).
    </p>
    <PortalLoadState :pending="pending && !sessions.length" :error="error" error-title="Não foi possível carregar o seu histórico." :error-text="errorText">
      <template #error-action>
        <Button variant="outline" @click="() => refresh()"><RefreshCw class="size-4" />Tentar novamente</Button>
      </template>
      <section class="flex flex-col gap-3" aria-labelledby="t-sessoes">
        <h2 id="t-sessoes" class="sr-only">Sessões</h2>
        <ul v-if="sessions.length" class="flex flex-col gap-2.5">
          <li v-for="(session, index) in sessions" :key="session.id" class="animate-fade" :style="{ animationDelay: `${80 + Math.min(index, 8) * 50}ms` }">
            <NuxtLink
              :to="`/patient/historico/${session.id}`"
              class="flex items-center gap-3.5 rounded-[14px] border bg-card p-4 transition-[border-color,transform] duration-300 ease-out hover:translate-x-0.5 hover:border-input-hover"
            >
              <span aria-hidden="true" class="w-7 shrink-0 font-mono text-[13px] text-muted-foreground">{{ session.number }}</span>
              <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                <span class="text-[15px] font-semibold">{{ historyDateLabel(session.occurredAt) }}</span>
                <span class="text-[13px] text-muted-foreground">{{ historyListMeta(session) }}</span>
              </span>
              <ChevronRight class="size-[18px] shrink-0 text-muted-foreground" :stroke-width="1.8" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
        <EmptyState v-else title="Nenhuma sessão registrada ainda.">
          Suas sessões aparecem aqui depois que acontecem.
        </EmptyState>
      </section>
    </PortalLoadState>
  </div>
</template>
