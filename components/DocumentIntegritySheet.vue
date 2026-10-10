<script setup lang="ts">
import { Check, Copy } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { ClinicalDocument } from '~/types'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

// Painel "Integridade do documento" (protótipo Documentos): dados da emissão e
// o SHA-256 do arquivo PDF registrado quando ele foi gerado.
const props = defineProps<{ document: ClinicalDocument | null }>()
const open = defineModel<boolean>('open', { default: false })

const copied = ref(false)
watch(() => props.document?.id, () => { copied.value = false })

async function copyHash() {
  if (!props.document?.sha256) return
  try {
    await navigator.clipboard.writeText(props.document.sha256)
    copied.value = true
  }
  catch {
    toast.error('Não foi possível copiar o hash. Selecione o texto e copie manualmente.')
  }
}

const typeLabel = computed(() => DOCUMENT_TYPE_SHORT[props.document?.type ?? ''] ?? 'Documento')
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent class="flex w-full flex-col gap-[22px] overflow-y-auto border-0 bg-card p-6 shadow-[-18px_0_40px_rgba(22,26,58,.14)] sm:max-w-[440px] sm:p-7">
      <template v-if="document">
        <SheetHeader class="gap-2 pr-8 text-left">
          <p class="label-mono text-xs">Integridade do documento</p>
          <SheetTitle class="text-[22px] font-semibold tracking-[-0.02em]">
            {{ typeLabel }} · <span class="font-mono text-[19px]">{{ document.code }}</span>
          </SheetTitle>
          <SheetDescription class="sr-only">Dados da emissão e hash SHA-256 do arquivo PDF.</SheetDescription>
        </SheetHeader>

        <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
          <dt class="text-muted-foreground">Paciente</dt>
          <dd class="font-medium">{{ document.patientName }}</dd>
          <dt class="text-muted-foreground">Emitido em</dt>
          <dd class="font-medium">{{ formatShortDate(document.readyAt ?? document.createdAt) }}, {{ formatHour(document.readyAt ?? document.createdAt) }}</dd>
          <dt class="text-muted-foreground">Sessões</dt>
          <dd class="font-medium">{{ document.sessionDates.length }}</dd>
        </dl>

        <div class="flex flex-col gap-2.5 rounded-xl bg-secondary p-4">
          <span class="label-mono text-[11px]">Hash SHA-256 do PDF</span>
          <code v-if="document.sha256" class="break-all font-mono text-[13px] leading-relaxed text-foreground">{{ document.sha256 }}</code>
          <span v-else class="text-sm text-muted-foreground">O hash é registrado quando o PDF termina de ser gerado.</span>
          <p class="text-[13px] leading-relaxed text-secondary-foreground">
            Este é o SHA-256 do arquivo PDF registrado na emissão. Para conferir uma cópia, calcule o SHA-256 do arquivo: se ele foi alterado, o valor não bate.
          </p>
        </div>

        <Button variant="outline" class="self-start" :disabled="!document.sha256" @click="copyHash">
          <Check v-if="copied" aria-hidden="true" />
          <Copy v-else aria-hidden="true" />
          {{ copied ? 'Hash copiado' : 'Copiar hash' }}
        </Button>
      </template>
    </SheetContent>
  </Sheet>
</template>
