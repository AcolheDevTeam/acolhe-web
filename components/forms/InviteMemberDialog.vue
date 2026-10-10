<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { ClinicInvitationResult } from '~/schemas/clinic'
import type { WorkspaceRole } from '~/types'
import { Button } from '@/components/ui/button'
import { InlineNotice } from '@/components/ui/inline-notice'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

// Convite para a equipe (ACO-62), no painel lateral do protótipo ("Convidar
// psicóloga"). Os papéis são cartões que se combinam (a API aceita mais de um);
// só a responsável convida responsáveis. O resultado mostra o link copiável,
// que vale mesmo quando o e-mail falha.
const props = defineProps<{ canInviteOwner: boolean }>()
const emit = defineEmits<{ invited: [] }>()
const open = ref(false)
const email = ref('')
const roles = ref<WorkspaceRole[]>(['psychologist'])
const submitting = ref(false)
const error = ref('')
const result = ref<ClinicInvitationResult | null>(null)
const options = computed<WorkspaceRole[]>(() => props.canInviteOwner
  ? ['psychologist', 'clinic_admin', 'clinical_supervisor', 'clinic_owner']
  : ['psychologist', 'clinic_admin', 'clinical_supervisor'])
const roleHint: Record<WorkspaceRole, string> = {
  psychologist: 'Atende os próprios pacientes',
  clinic_admin: 'Gerencia a equipe e vê só os números da clínica',
  clinical_supervisor: 'Sempre junto com outro papel',
  clinic_owner: 'Também gerencia outros(as) responsáveis',
}

watch(open, (value) => {
  if (!value) return
  email.value = ''
  roles.value = ['psychologist']
  error.value = ''
  result.value = null
})

function toggle(role: WorkspaceRole) {
  roles.value = roles.value.includes(role) ? roles.value.filter(r => r !== role) : [...roles.value, role]
}

async function submit() {
  error.value = ''
  if (!email.value.includes('@')) { error.value = 'Informe um e-mail válido.'; return }
  if (!roles.value.length) { error.value = 'Escolha ao menos um papel.'; return }
  // Supervisão sozinha não dá acesso a nada (sem leitura clínica nem administração).
  if (roles.value.length === 1 && roles.value[0] === 'clinical_supervisor') {
    error.value = 'Supervisão clínica vem junto com outro papel, como Psicóloga(o).'
    return
  }
  submitting.value = true
  try {
    result.value = await $fetch<ClinicInvitationResult>('/api/clinic/invitations', { method: 'POST', body: { email: email.value, roles: roles.value } })
    emit('invited')
  }
  catch (err) {
    error.value = clinicErrorMessage(err, 'Não foi possível enviar o convite agora.')
  }
  finally {
    submitting.value = false
  }
}

async function copyLink() {
  if (!result.value) return
  try {
    await navigator.clipboard.writeText(result.value.link)
    toast.success('Link do convite copiado.')
  }
  catch {
    toast.error('Não foi possível copiar automaticamente. Selecione o link exibido.')
  }
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetTrigger as-child><slot /></SheetTrigger>
    <SheetContent class="flex w-full flex-col gap-[22px] overflow-y-auto border-0 bg-card p-6 shadow-[-18px_0_40px_rgba(22,26,58,.12)] sm:max-w-[440px] sm:p-8">
      <SheetHeader class="gap-2 pr-8 text-left">
        <SheetTitle class="text-[22px] font-semibold tracking-[-0.02em]">Convidar psicóloga(o)</SheetTitle>
        <SheetDescription>A pessoa recebe um link de uso único, válido por 7 dias, para entrar com a conta do Acolhe ou criar uma.</SheetDescription>
      </SheetHeader>
      <div v-if="result" class="flex animate-fade flex-col gap-4" aria-live="polite">
        <InlineNotice :tone="result.deliveryStatus === 'sent' ? 'positive' : 'warning'" class="flex items-start gap-2.5 text-[15px]">
          <Check v-if="result.deliveryStatus === 'sent'" class="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
          <p>{{ deliveryMessage(result.deliveryStatus) }} O convite aparece na lista como pendente até ser aceito.</p>
        </InlineNotice>
        <p class="break-all rounded-[10px] border bg-surface-subtle p-3 font-mono text-xs">{{ result.link }}</p>
        <div class="flex flex-wrap gap-2">
          <Button variant="outline" @click="copyLink">Copiar link</Button>
          <Button variant="outline" @click="open = false">Fechar</Button>
        </div>
      </div>
      <form v-else class="flex animate-fade flex-col gap-[18px]" novalidate @submit.prevent="submit">
        <div class="flex flex-col gap-1.5">
          <Label for="invite-email">E-mail</Label>
          <Input id="invite-email" v-model="email" type="email" autocomplete="off" placeholder="psicologa@exemplo.com" class="h-11" />
        </div>
        <div class="flex flex-col gap-2">
          <span id="invite-roles" class="text-sm font-medium">Papel</span>
          <div role="group" aria-labelledby="invite-roles" class="grid gap-2.5 min-[380px]:grid-cols-2">
            <button
              v-for="role in options"
              :key="role"
              type="button"
              role="checkbox"
              :aria-checked="roles.includes(role)"
              class="flex flex-col gap-1 rounded-xl border bg-card p-3.5 text-left transition-[border-color,box-shadow,background-color] duration-200 hover:border-input-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :class="roles.includes(role) ? 'border-primary bg-surface-subtle shadow-[0_0_0_3px_hsl(var(--primary)/.12)] hover:border-primary' : ''"
              @click="toggle(role)"
            >
              <span class="text-sm font-semibold">{{ workspaceRoleLabel(role) }}</span>
              <span class="text-[13px] leading-snug text-muted-foreground">{{ roleHint[role] }}</span>
            </button>
          </div>
          <p class="text-[13px] leading-relaxed text-muted-foreground">Dá para combinar papéis. Quem só administra vê os números da clínica, nunca dados de pacientes.</p>
        </div>
        <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>
        <Button type="submit" size="xl" :loading="submitting">{{ submitting ? 'Enviando…' : 'Enviar convite' }}</Button>
      </form>
    </SheetContent>
  </Sheet>
</template>
