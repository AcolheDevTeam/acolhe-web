<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const route = useRoute()
const patientId = computed(() => route.params.id as string)

const { data: patient } = usePatient(patientId)
const { data: activities } = usePatientActivities(patientId)

const list = computed(() => activities.value ?? [])
</script>

<template>
  <PatientShell :patient="patient ?? null" :patient-id="patientId" active="activities">
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <p class="label-mono">Atividades · {{ list.length }}</p>
        <AssignActivityDialog :patient-id="patientId">
          <Button variant="outline" size="sm">
            <Plus />
            Atribuir atividade
          </Button>
        </AssignActivityDialog>
      </div>

      <div v-if="list.length" class="flex flex-col gap-2">
        <ActivityRow v-for="a in list" :key="a.id" :activity="a" />
      </div>
      <p v-else class="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        Nenhuma atividade atribuída ainda.
      </p>
    </div>
  </PatientShell>
</template>
