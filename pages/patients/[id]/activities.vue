<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

definePageMeta({ middleware: ['auth', 'psychologist-only'] })

const { patientId, patient } = usePatientFicha()
const { data: activities } = usePatientActivities(patientId)

const list = computed(() => activities.value ?? [])
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <p class="label-mono">Atividades · {{ list.length }}</p>
      <AssignActivityDialog
        v-if="patient?.status === 'active' && patient.relationshipStatus === 'active'"
        :patient-id="patientId"
      >
        <Button variant="outline" size="sm">
          <Plus />
          Atribuir atividade
        </Button>
      </AssignActivityDialog>
    </div>

    <Card v-if="list.length" class="overflow-hidden">
      <ActivityRow v-for="a in list" :key="a.id" :activity="a" />
    </Card>
    <EmptyState v-else compact>
      Nenhuma atividade atribuída ainda.
    </EmptyState>
  </div>
</template>
