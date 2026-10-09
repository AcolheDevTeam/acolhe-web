<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
definePageMeta({ middleware: ['auth', 'psychologist-only'] })
const page = ref(1)
const { data, error, status, refresh } = useDocumentaryPatients(page)
</script>
<template>
  <PageHeader eyebrow="Só você" title="Registro Documental" />
  <div class="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8 lg:px-12">
    <div class="rounded-lg border bg-muted/40 p-5 text-sm">
      <p class="font-medium">Espaço restrito · sigilo profissional</p>
      <p class="mt-2 text-muted-foreground">
        Cadernos privados da autora. Não são compartilhados com pacientes ou
        outras profissionais, nem incluídos na exportação da paciente.
      </p>
    </div>
    <p class="text-sm text-muted-foreground">
      Para começar um caderno, abra Registro Documental na ficha da paciente.
    </p>
    <div v-if="error" role="alert" class="space-y-3">
      <p class="text-sm text-destructive">
        {{ documentaryErrorText(error) }}
      </p>
      <Button variant="outline" @click="refresh()">Tentar novamente</Button>
    </div>
    <p v-else-if="status === 'pending'" class="text-sm text-muted-foreground">
      Carregando cadernos…
    </p>
    <template v-else-if="data">
      <EmptyState v-if="!data.items.length" compact>
        Nenhum caderno salvo nesta página.
      </EmptyState>
      <div v-else class="divide-y rounded-lg border bg-card">
        <NuxtLink
          v-for="patient in data.items"
          :key="patient.id"
          :to="`/registry/${patient.id}`"
          class="flex flex-wrap items-center justify-between gap-3 p-5 hover:bg-muted/40"
          ><span class="font-medium">{{ patient.fullName }}</span
          ><Badge v-if="!patient.writable" variant="secondary"
            >Somente leitura</Badge
          ><span class="text-sm text-muted-foreground"
            >Abrir cadernos</span
          ></NuxtLink
        >
      </div>
      <PaginationControls
        :page="data.page"
        :total-pages="data.totalPages"
        :total-count="data.totalCount"
        @change="page = $event"
      />
    </template>
  </div>
</template>
