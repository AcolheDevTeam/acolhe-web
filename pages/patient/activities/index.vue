<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

definePageMeta({ layout: 'patient', middleware: ['auth', 'patient-only'] })

// Protótipo "Atividades da paciente": abas Pendentes e Enviadas. A aba fica na
// URL (?tab=enviadas) para a volta das respostas cair no mesmo lugar.
const route = useRoute()
const router = useRouter()
const { activities, pending, error } = usePatientPortal()
const submitted = usePatientSubmittedActivities()

const tab = computed({
  get: () => patientActivitiesTab(route.query.tab),
  set: (value: string) => {
    void router.replace({ query: { ...route.query, tab: value === 'enviadas' ? 'enviadas' : undefined } })
  },
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <PatientPageHeader eyebrow="Enviadas por sua(seu) psicóloga(o)" title="Atividades" />
    <PortalLoadState :pending="pending" :error="error">
      <Tabs v-model="tab" class="animate-rise flex flex-col gap-4 [animation-delay:60ms]">
        <TabsList aria-label="Filtrar atividades" class="grid w-full grid-cols-2">
          <TabsTrigger value="pendentes">Pendentes · {{ activities.data.value.length }}</TabsTrigger>
          <TabsTrigger value="enviadas">Enviadas · {{ submitted.data.value.length }}</TabsTrigger>
        </TabsList>
        <TabsContent value="pendentes" class="mt-0">
          <PatientActivityList :activities="activities.data.value" />
        </TabsContent>
        <TabsContent value="enviadas" class="mt-0">
          <!-- Falha só desta lista não derruba a aba Pendentes. -->
          <EmptyState v-if="submitted.error.value" compact>
            Não foi possível carregar as atividades enviadas agora.
            <template #action>
              <Button variant="outline" @click="() => submitted.refresh()">Tentar de novo</Button>
            </template>
          </EmptyState>
          <div v-else-if="submitted.status.value === 'pending' && !submitted.data.value.length" class="flex flex-col gap-3">
            <Skeleton class="h-[76px] rounded-[14px]" />
            <Skeleton class="h-[76px] rounded-[14px]" />
          </div>
          <PatientSubmittedList v-else :activities="submitted.data.value" />
        </TabsContent>
      </Tabs>
      <p class="text-xs text-muted-foreground">Só você e sua(seu) psicóloga(o) veem suas respostas.</p>
    </PortalLoadState>
  </div>
</template>
