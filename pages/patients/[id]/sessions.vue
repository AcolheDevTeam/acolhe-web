<script setup lang="ts">
import { ChevronRight, Eye } from 'lucide-vue-next'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const route = useRoute()
const patientId = computed(() => route.params.id as string)

const { data: patient } = usePatient(patientId)
const { data: sessions } = usePatientSessions(patientId)

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
          <span class="font-medium text-foreground">Prontuário acessível à paciente.</span>
          Registre apenas o necessário ao cumprimento dos objetivos do trabalho (Art. 5º, II —
          Res. CFP 01/2009). Para hipóteses e impressões, use o Registro Documental.
        </p>
      </div>

      <p class="label-mono">Sessões · {{ ordered.length }}</p>

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
              {{ modalityLabel(s.modality) }} · {{ s.durationMin }} min
            </p>
          </div>
          <ChevronRight class="size-4 text-muted-foreground" />
        </NuxtLink>
      </div>
      <p v-else class="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        Nenhuma sessão registrada ainda.
      </p>
    </div>
  </PatientShell>
</template>
