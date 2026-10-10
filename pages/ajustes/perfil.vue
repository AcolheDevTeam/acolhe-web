<script setup lang="ts">
import { onBeforeRouteLeave } from 'vue-router'
import { toast } from 'vue-sonner'
import { profileUpdateSchema, sessionDurationOptions, type Profile, type ProfileUpdate } from '~/schemas/account-settings'
import { crpRegions, signupApproaches } from '~/utils/signup-steps'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChoiceChips } from '@/components/ui/choice-chips'
import { InlineNotice } from '@/components/ui/inline-notice'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

// Ajustes › Perfil (protótipo "Perfil", ACO-98). Foto, troca de e-mail e
// imagem da assinatura ainda não existem e ficam fora da tela.
definePageMeta({ middleware: ['auth', 'psychologist-only'] })
useHead({ title: 'Perfil · Ajustes · Acolhe' })

const { data: profile, error, status, refresh } = await useProfile()

type Form = { fullName: string, socialName: string, phone: string, approach: string, duration: string }
const empty: Form = { fullName: '', socialName: '', phone: '', approach: '', duration: '50' }

function toForm(p: Profile | null): Form {
  if (!p) return { ...empty }
  return {
    fullName: p.fullName,
    socialName: p.socialName ?? '',
    phone: p.phone ?? '',
    approach: p.approach ?? '',
    duration: String(p.defaultSessionMinutes),
  }
}

const saved = ref<Form>(toForm(profile.value))
const form = reactive<Form>(toForm(profile.value))
watch(profile, (value) => {
  saved.value = toForm(value)
  Object.assign(form, saved.value)
})

const phoneUnavailable = computed(() => profile.value?.phoneUnavailable === true)

const dirty = computed(() => (Object.keys(form) as (keyof Form)[]).some(key => form[key] !== saved.value[key]))

// Abordagens do cadastro; uma abordagem que não está na lista continua visível.
const approachOptions = computed(() => {
  const list: string[] = [...signupApproaches]
  if (saved.value.approach && !list.includes(saved.value.approach)) list.push(saved.value.approach)
  return list.map(value => ({ value, label: value }))
})
const durationOptions = computed(() => {
  const list: number[] = [...sessionDurationOptions]
  const current = Number(saved.value.duration)
  if (current && !list.includes(current)) list.push(current)
  return list.sort((a, b) => a - b).map(minutes => ({ value: String(minutes), label: `${minutes} min` }))
})

const crpLabel = computed(() => {
  if (!profile.value) return ''
  const region = crpRegions.find(r => r.value === profile.value?.crpState)
  const base = `${profile.value.crpState}/${profile.value.crpNumber}`
  return region ? `${base} · ${Number(region.value)}ª Região (${region.uf})` : base
})
const crpBadge = computed(() => {
  if (profile.value?.crpStatus === 'pending') return { label: 'Em verificação', variant: 'warning' as const }
  if (profile.value?.crpStatus === 'active') return { label: 'Ativo', variant: 'positive' as const }
  return null
})

const errors = ref<Partial<Record<keyof ProfileUpdate, string>>>({})
// Texto de cada campo quando a própria API recusa (a validação local já pega
// quase tudo antes).
const fieldMessages: Record<keyof ProfileUpdate, string> = {
  fullName: 'Informe o nome completo, com até 200 caracteres.',
  socialName: 'O nome social pode ter até 200 caracteres.',
  phone: 'Informe um telefone válido, com DDD.',
  approach: 'A abordagem pode ter até 100 caracteres.',
  defaultSessionMinutes: 'Escolha uma duração entre 15 e 480 minutos.',
}
const saving = ref(false)
const savedNotice = ref(false)
let noticeTimer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => clearTimeout(noticeTimer))

// Leva o foco ao primeiro campo com erro (os de texto têm id próprio).
const fieldIds: Partial<Record<keyof ProfileUpdate, string>> = {
  fullName: 'profile-name', socialName: 'profile-social', phone: 'profile-phone',
}
async function focusFirstError() {
  await nextTick()
  const first = (Object.keys(fieldIds) as (keyof ProfileUpdate)[]).find(field => errors.value[field])
  if (first) document.getElementById(fieldIds[first]!)?.focus()
}

function discard() {
  Object.assign(form, saved.value)
  errors.value = {}
}

async function save() {
  if (saving.value) return
  const parsed = profileUpdateSchema.safeParse({
    fullName: form.fullName,
    socialName: form.socialName,
    // Telefone indisponível não vai no corpo: a API mantém o gravado.
    phone: phoneUnavailable.value ? undefined : form.phone,
    approach: form.approach,
    defaultSessionMinutes: Number(form.duration),
  })
  if (!parsed.success) {
    const next: typeof errors.value = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof ProfileUpdate
      next[field] ??= issue.message
    }
    errors.value = next
    void focusFirstError()
    return
  }
  errors.value = {}
  saving.value = true
  try {
    profile.value = await $fetch<Profile>('/api/me/profile', { method: 'PUT', body: parsed.data })
    savedNotice.value = true
    clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => { savedNotice.value = false }, 3200)
    // O nome no rodapé do menu vem do /me.
    void refreshNuxtData('me')
  } catch (err) {
    // 400 com o campo recusado: a mensagem vai para o campo certo.
    const field = apiErrorField(err) as keyof ProfileUpdate | undefined
    if (apiErrorInfo(err).status === 400 && field && field in fieldMessages) {
      errors.value = { [field]: fieldMessages[field] }
      void focusFirstError()
      return
    }
    toast.error(apiErrorMessage(err, {
      400: 'Alguns dados não foram aceitos. Revise os campos e tente de novo.',
      404: 'Não encontramos seu perfil de psicóloga. Recarregue a página.',
      // O único 503 próprio do perfil é o telefone sem a chave de cifra.
      503: 'Não foi possível salvar agora. Se você preencheu o telefone, tente de novo mais tarde ou deixe o campo em branco.',
      default: 'Não foi possível salvar o perfil agora. Tente novamente em instantes.',
    }))
  } finally {
    saving.value = false
  }
}

// Fechar ou recarregar a aba com alterações pendentes: aviso do navegador.
function guardUnload(event: BeforeUnloadEvent) {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}
onMounted(() => window.addEventListener('beforeunload', guardUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', guardUnload))

// Sair da página com alterações pendentes pede confirmação.
const confirmOpen = ref(false)
let resolveLeave: ((leave: boolean) => void) | undefined
onBeforeRouteLeave(() => {
  if (!dirty.value) return true
  confirmOpen.value = true
  return new Promise<boolean>((resolve) => { resolveLeave = resolve })
})
function decide(leave: boolean) {
  confirmOpen.value = false
  resolveLeave?.(leave)
  resolveLeave = undefined
}
</script>

<template>
  <SettingsShell title="Perfil">
    <div aria-live="polite" class="empty:hidden">
      <InlineNotice v-if="savedNotice">Perfil atualizado.</InlineNotice>
    </div>

    <div v-if="status === 'pending' && !profile" class="flex flex-col gap-6" aria-busy="true">
      <Skeleton class="h-72 rounded-2xl" />
      <Skeleton class="h-80 rounded-2xl" />
    </div>

    <div v-else-if="error || !profile" class="flex flex-col items-start gap-3 text-sm" role="alert">
      <p>{{ apiErrorMessage(error, { 404: 'Não encontramos seu perfil de psicóloga.', default: 'Não foi possível carregar o perfil agora.' }) }}</p>
      <Button variant="outline" @click="refresh()">Tentar de novo</Button>
    </div>

    <template v-else>
      <Card class="animate-rise flex flex-col gap-5 p-6">
        <h2 class="text-lg font-semibold">Dados pessoais</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <Label for="profile-name">Nome completo</Label>
            <Input
              id="profile-name"
              v-model="form.fullName"
              autocomplete="name"
              :aria-invalid="!!errors.fullName || undefined"
              :aria-describedby="errors.fullName ? 'profile-name-error' : undefined"
            />
            <p v-if="errors.fullName" id="profile-name-error" class="text-sm text-destructive">{{ errors.fullName }}</p>
          </div>
          <div class="flex flex-col gap-2">
            <Label for="profile-social">Nome social <span class="font-normal text-muted-foreground">(opcional)</span></Label>
            <Input
              id="profile-social"
              v-model="form.socialName"
              placeholder="Como prefere ser chamada"
              :aria-invalid="!!errors.socialName || undefined"
              :aria-describedby="errors.socialName ? 'profile-social-error' : undefined"
            />
            <p v-if="errors.socialName" id="profile-social-error" class="text-sm text-destructive">{{ errors.socialName }}</p>
          </div>
          <div class="flex flex-col gap-2">
            <Label for="profile-phone">Telefone <span class="font-normal text-muted-foreground">(opcional)</span></Label>
            <Input
              id="profile-phone"
              v-model="form.phone"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              :placeholder="phoneUnavailable ? undefined : '(11) 98765-4321'"
              :disabled="phoneUnavailable"
              :aria-invalid="!!errors.phone || undefined"
              :aria-describedby="phoneUnavailable ? 'profile-phone-unavailable' : errors.phone ? 'profile-phone-error' : undefined"
            />
            <p v-if="phoneUnavailable" id="profile-phone-unavailable" class="text-[13px] text-muted-foreground">Não foi possível carregar o telefone agora.</p>
            <p v-if="errors.phone" id="profile-phone-error" class="text-sm text-destructive">{{ errors.phone }}</p>
          </div>
        </div>
      </Card>

      <Card class="animate-rise flex flex-col gap-5 p-6 [animation-delay:.05s]">
        <h2 class="text-lg font-semibold">Dados profissionais</h2>
        <div class="flex flex-wrap items-center gap-4 rounded-xl border bg-surface-subtle px-4 py-3.5">
          <div class="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
            <span class="label-mono text-[11px]">CRP</span>
            <span class="text-base font-semibold">{{ crpLabel }}</span>
          </div>
          <Badge v-if="crpBadge" :variant="crpBadge.variant">{{ crpBadge.label }}</Badge>
          <p class="w-full text-[13px] text-muted-foreground">Para mudar o CRP, fale com o suporte do Acolhe.</p>
        </div>

        <div class="flex flex-col gap-2.5">
          <span class="text-sm font-medium">Abordagem principal</span>
          <ChoiceChips v-model="form.approach" :options="approachOptions" label="Abordagem principal" :disabled="saving" />
          <p v-if="errors.approach" class="text-sm text-destructive">{{ errors.approach }}</p>
        </div>

        <div class="flex flex-col gap-2.5">
          <span class="text-sm font-medium">Duração padrão da sessão</span>
          <ChoiceChips v-model="form.duration" :options="durationOptions" label="Duração padrão da sessão" :disabled="saving" />
          <p class="text-[13px] text-muted-foreground">Usada como sugestão ao agendar. Dá para mudar em cada sessão.</p>
          <p v-if="errors.defaultSessionMinutes" class="text-sm text-destructive">{{ errors.defaultSessionMinutes }}</p>
        </div>
      </Card>
    </template>
  </SettingsShell>

  <UnsavedChangesBar v-if="dirty" :saving="saving" @discard="discard" @save="save" />
  <UnsavedChangesDialog :open="confirmOpen" @decision="decide" />
</template>
