<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { User } from '~/types'

// Destino do e-mail de saída da clínica (ACO-96). Abre mesmo com o vínculo
// encerrado: o middleware de auth deixa esta rota passar.
definePageMeta({ layout: 'auth', middleware: ['auth'] })

const { data: user } = useNuxtData<User | null>('me')
const back = computed(() => homeFor(user.value))
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center p-6">
    <Card class="w-full max-w-xl">
      <CardHeader class="gap-5">
        <AppLogo />
        <div>
          <p class="label-mono">Registro Documental</p>
          <CardTitle class="display-serif mt-2 text-3xl">Baixar cadernos</CardTitle>
          <CardDescription class="mt-2">
            Quando o vínculo com uma clínica termina, você tem 30 dias para baixar os cadernos que escreveu lá.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <DocumentaryDepartures
          :framed="false"
          show-error
          empty-text="Não há cadernos para baixar. O prazo pode ter acabado, ou você não escreveu cadernos na clínica."
        />
        <Button variant="ghost" class="self-start" as-child>
          <NuxtLink :to="back">Voltar</NuxtLink>
        </Button>
      </CardContent>
    </Card>
  </main>
</template>
