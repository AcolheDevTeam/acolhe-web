<script setup lang="ts">
import { Upload } from 'lucide-vue-next'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { signupSchema, signupTermsVersion } from '~/schemas/signup'
import { crpRegions, firstSignupStepWithError, signupApproaches, signupSteps } from '~/utils/signup-steps'
import { Button } from '@/components/ui/button'
import { CheckboxCard } from '@/components/ui/checkbox-card'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({ layout: 'auth' })
// Abaixo de md quem rola é a página: o scroll-padding no <html> impede que o
// foco por Tab deixe um campo embaixo do rodapé sticky. Só vale nesta página.
useHead({ title: 'Criar conta · Acolhe', htmlAttrs: { class: 'max-md:scroll-pb-28' } })

const stepNames = signupSteps.map((step) => step.name)
const lastStep = signupSteps.length - 1
const step = ref(0)
const submitError = ref('')
const config = useRuntimeConfig()
const signupKind = ref('solo')
const signupKindOptions = computed(() => [
  { value: 'solo', label: 'Atendo sozinha', description: 'Crie seu consultório individual.' },
  ...(config.public.clinicSelfSignupEnabled ? [{ value: 'clinic', label: 'Tenho uma clínica', description: 'Crie um espaço para sua equipe.' }] : []),
])
watch(signupKind, (kind) => { if (kind === 'clinic') void navigateTo('/signup/clinic') })

const { defineField, errors, handleSubmit, isSubmitting, validateField } = useForm({
  validationSchema: toTypedSchema(signupSchema),
  initialValues: { termsVersion: signupTermsVersion, privacyVersion: signupTermsVersion, acceptTerms: false, acceptPrivacy: false },
})

const [fullName, fullNameAttrs] = defineField('fullName')
const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')
const [confirmPassword, confirmPasswordAttrs] = defineField('confirmPassword')
const [crpNumber, crpNumberAttrs] = defineField('crpNumber')
const [crpState] = defineField('crpState')
const [cpf, cpfAttrs] = defineField('cpf')
const [approach] = defineField('approach')
const [acceptTerms] = defineField('acceptTerms')
const [acceptPrivacy] = defineField('acceptPrivacy')

const regionOptions = crpRegions.map((region) => ({ value: region.value, label: `${region.value} · ${region.name}`, description: region.uf }))

// Abordagem é opcional: clicar de novo na escolhida desmarca.
function pickApproach(option: string) {
  approach.value = approach.value === option ? undefined : option
}

// O título de cada etapa recebe o foco ao trocar, para leitor de tela anunciar.
const stepHeading = ref<HTMLElement | null>(null)
async function goTo(index: number) {
  step.value = index
  await nextTick()
  stepHeading.value?.focus()
}

// Trava o avanço enquanto a validação roda: dois Enter seguidos pulariam etapa.
const advancing = ref(false)
async function nextStep() {
  if (advancing.value) return
  advancing.value = true
  try {
    const results = await Promise.all(signupSteps[step.value].fields.map((field) => validateField(field)))
    if (results.every((result) => result.valid)) await goTo(step.value + 1)
  } finally {
    advancing.value = false
  }
}

function previousStep() {
  submitError.value = ''
  goTo(step.value - 1)
}

interface SignupResponse {
  user: { emailStatus?: 'pending' | 'verified', nextStep?: string }
  verificationDelivery?: 'sent' | 'failed' | 'disabled'
}

const onSubmit = handleSubmit(async (values) => {
  submitError.value = ''
  const { confirmPassword: _confirmPassword, ...apiPayload } = values
  try {
    const result = await $fetch<SignupResponse>('/api/signup', { method: 'POST', body: apiPayload })
    // Com verificação ativa, o próximo passo é confirmar o e-mail (ACO-63).
    // delivery=failed avisa a tela que o primeiro envio não saiu.
    if (result.user.nextStep === 'verify_email') {
      const failed = result.verificationDelivery !== 'sent'
      return await navigateTo({ path: '/verify-email', query: failed ? { delivery: 'failed' } : {} })
    }
    await navigateTo('/dashboard')
  } catch (error: unknown) {
    // A API não diz qual campo falhou (409 vale para e-mail ou CRP já usados),
    // então o erro fica nesta etapa, com a orientação de revisar as anteriores.
    submitError.value = apiErrorMessage(error, {
      400: 'Alguns dados não foram aceitos. Revise as etapas e tente novamente.',
      409: 'Não foi possível concluir o cadastro. Confira os dados e tente novamente.',
      default: 'Não foi possível concluir o cadastro agora. Tente novamente.',
    })
  }
}, ({ errors: invalid }) => {
  // Campo de outra etapa reprovado no envio final: volta para a etapa dele.
  const target = firstSignupStepWithError(invalid)
  if (target !== undefined && target !== step.value) goTo(target)
})

const canSubmit = computed(() => acceptTerms.value === true && acceptPrivacy.value === true)
</script>

<template>
  <AuthTopbarShell>
    <template #aside>
      <p class="text-sm text-secondary-foreground">
        Já tem conta?
        <NuxtLink to="/login" class="font-medium text-primary underline-offset-[3px] hover:underline">Entrar</NuxtLink>
      </p>
    </template>

    <div class="flex flex-col gap-7 [@media(max-height:700px)]:gap-5">
      <RadioCardGroup v-model="signupKind" :options="signupKindOptions" label="Tipo de cadastro" compact class="grid-cols-2" />
      <StepProgress :steps="stepNames" :current="step" label="Etapas do cadastro" class="animate-rise [animation-delay:.08s]" />

      <form
        class="rounded-[20px] border bg-card px-5 pt-5 sm:px-9 sm:pt-9 [@media(max-height:700px)]:px-6 [@media(max-height:700px)]:pt-6"
        novalidate
        @submit.prevent="step === lastStep ? onSubmit() : nextStep()"
      >
        <div :key="step" class="step-in flex flex-col gap-5 [@media(max-height:700px)]:gap-4">
          <!-- 1. Conta -->
          <template v-if="step === 0">
            <div>
              <h1 ref="stepHeading" tabindex="-1" class="text-[28px] font-semibold tracking-[-0.025em] outline-none">Crie sua conta</h1>
              <p class="mt-1.5 text-[15px] text-secondary-foreground">Esses dados servem para você entrar no Acolhe.</p>
            </div>
            <div class="flex flex-col gap-2">
              <Label for="fullName">Nome completo</Label>
              <Input id="fullName" v-model="fullName" v-bind="fullNameAttrs" class="h-12" autocomplete="name" placeholder="Como aparece no seu registro" :aria-invalid="!!errors.fullName" />
              <p v-if="errors.fullName" class="text-xs text-destructive">{{ errors.fullName }}</p>
            </div>
            <div class="flex flex-col gap-2">
              <Label for="email">E-mail</Label>
              <Input id="email" v-model="email" v-bind="emailAttrs" type="email" class="h-12" autocomplete="email" placeholder="voce@exemplo.com" :aria-invalid="!!errors.email" />
              <p v-if="errors.email" class="text-xs text-destructive">{{ errors.email }}</p>
            </div>
            <div class="flex flex-col gap-2">
              <Label for="password">Senha</Label>
              <PasswordInput id="password" v-model="password" v-bind="passwordAttrs" class="[&_input]:h-12" autocomplete="new-password" placeholder="Mínimo de 8 caracteres" :aria-invalid="!!errors.password" />
              <p v-if="errors.password" class="text-xs text-destructive">{{ errors.password }}</p>
            </div>
            <div class="flex flex-col gap-2">
              <Label for="confirmPassword">Confirme a senha</Label>
              <PasswordInput id="confirmPassword" v-model="confirmPassword" v-bind="confirmPasswordAttrs" class="[&_input]:h-12" autocomplete="new-password" :aria-invalid="!!errors.confirmPassword" />
              <p v-if="errors.confirmPassword" class="text-xs text-destructive">{{ errors.confirmPassword }}</p>
            </div>
          </template>

          <!-- 2. CRP -->
          <template v-else-if="step === 1">
            <div>
              <h1 ref="stepHeading" tabindex="-1" class="text-[28px] font-semibold tracking-[-0.025em] outline-none">Registro profissional</h1>
              <p class="mt-1.5 text-[15px] leading-normal text-secondary-foreground">Conferimos o CRP manualmente em até 24 horas úteis. Até lá, ele aparece como pendente.</p>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="flex flex-col gap-2">
                <Label for="crpNumber">Número do CRP</Label>
                <Input id="crpNumber" v-model="crpNumber" v-bind="crpNumberAttrs" class="h-12" inputmode="numeric" autocomplete="off" placeholder="123456" :aria-invalid="!!errors.crpNumber" />
                <p v-if="errors.crpNumber" class="text-xs text-destructive">{{ errors.crpNumber }}</p>
              </div>
              <div class="flex flex-col gap-2">
                <Label for="crpState">Região</Label>
                <CustomDropdown
                  id="crpState"
                  :model-value="crpState"
                  :options="regionOptions"
                  search-placeholder="Buscar região ou estado"
                  empty-text="Nenhuma região encontrada."
                  class="h-12 rounded-xl border-input bg-card px-3.5 text-[15px] shadow-none hover:border-input-hover focus:ring-0 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 aria-expanded:border-primary aria-expanded:ring-4 aria-expanded:ring-primary/15 aria-[invalid=true]:border-destructive"
                  :aria-invalid="!!errors.crpState"
                  @update:model-value="(value) => { crpState = value; validateField('crpState') }"
                />
                <p v-if="errors.crpState" class="text-xs text-destructive">{{ errors.crpState }}</p>
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <Label for="cpf">CPF <span class="font-normal text-muted-foreground">(opcional)</span></Label>
              <Input id="cpf" v-model="cpf" v-bind="cpfAttrs" class="h-12" inputmode="numeric" autocomplete="off" placeholder="000.000.000-00" aria-describedby="cpf-hint" :aria-invalid="!!errors.cpf" />
              <p v-if="errors.cpf" class="text-xs text-destructive">{{ errors.cpf }}</p>
              <p v-else id="cpf-hint" class="text-[13px] text-muted-foreground">Guardado com criptografia.</p>
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-sm font-medium">Comprovante do CRP</span>
              <!-- Sem fluxo de upload no backend: a área fica desligada e explica por quê. -->
              <div class="flex flex-col items-center gap-2.5 rounded-[14px] border-[1.5px] border-dashed border-input-hover bg-card p-6 text-center [@media(max-height:700px)]:p-4" aria-disabled="true">
                <Upload class="size-7 text-muted-foreground" :stroke-width="1.7" aria-hidden="true" />
                <p class="text-sm font-medium text-secondary-foreground">Envio do comprovante indisponível por enquanto</p>
                <p class="max-w-[420px] text-xs leading-relaxed text-muted-foreground">O arquivo não é aceito, enviado nem armazenado até existir um fluxo privado com varredura, limite e expiração.</p>
              </div>
            </div>
          </template>

          <!-- 3. Perfil -->
          <template v-else-if="step === 2">
            <div>
              <h1 ref="stepHeading" tabindex="-1" class="text-[28px] font-semibold tracking-[-0.025em] outline-none">Seu perfil</h1>
              <p class="mt-1.5 text-[15px] text-secondary-foreground">Esta etapa é opcional.</p>
            </div>
            <div class="flex flex-col gap-2.5">
              <span id="approach-label" class="text-sm font-medium">Abordagem principal</span>
              <div role="radiogroup" aria-labelledby="approach-label" class="flex flex-wrap gap-2">
                <Button
                  v-for="option in signupApproaches"
                  :key="option"
                  type="button"
                  role="radio"
                  variant="outline"
                  :aria-checked="approach === option"
                  class="h-10 rounded-full border-border px-4 font-normal text-secondary-foreground"
                  :class="approach === option && 'border-selected-border bg-accent text-brand hover:border-selected-border hover:bg-accent'"
                  @click="pickApproach(option)"
                >
                  {{ option }}
                </Button>
              </div>
            </div>
          </template>

          <!-- 4. Termos -->
          <template v-else>
            <div>
              <h1 ref="stepHeading" tabindex="-1" class="text-[28px] font-semibold tracking-[-0.025em] outline-none">Termos</h1>
              <p class="mt-1.5 text-[15px] text-secondary-foreground">Leia e aceite para concluir o cadastro. O aceite fica registrado com data e versão do documento.</p>
            </div>
            <div class="flex flex-col gap-3">
              <CheckboxCard
                id="acceptTerms"
                :model-value="acceptTerms === true"
                title="Termos de Uso"
                description="Obrigatório · versão 0.3"
                :invalid="!!errors.acceptTerms"
                @update:model-value="(checked) => (acceptTerms = checked)"
              />
              <CheckboxCard
                id="acceptPrivacy"
                :model-value="acceptPrivacy === true"
                title="Política de Privacidade"
                description="Obrigatório · versão 0.3 · como tratamos dados de pacientes (LGPD)"
                :invalid="!!errors.acceptPrivacy"
                @update:model-value="(checked) => (acceptPrivacy = checked)"
              />
            </div>
            <InlineNotice v-if="submitError" tone="danger">{{ submitError }}</InlineNotice>
          </template>
        </div>

        <!-- Rodapé fixo no fim da área que rola: a ação principal fica sempre à vista. -->
        <div class="sticky bottom-0 z-10 -mx-5 mt-7 rounded-b-[20px] bg-card px-5 pb-5 sm:-mx-9 sm:px-9 sm:pb-9 [@media(max-height:700px)]:-mx-6 [@media(max-height:700px)]:mt-5 [@media(max-height:700px)]:px-6 [@media(max-height:700px)]:pb-5">
          <div class="flex items-center justify-between gap-3 border-t pt-5 [@media(max-height:700px)]:pt-4">
            <Button v-if="step > 0" type="button" variant="ghost" size="xl" class="px-5" :disabled="isSubmitting" @click="previousStep">Voltar</Button>
            <span v-else />
            <Button type="submit" size="xl" :loading="isSubmitting || advancing" :disabled="step === lastStep && !canSubmit">
              {{ step < lastStep ? 'Continuar' : isSubmitting ? 'Criando conta…' : 'Criar conta' }}
            </Button>
          </div>
        </div>
      </form>
    </div>
  </AuthTopbarShell>
</template>

<style scoped>
/* Troca de etapa do protótipo: entra deslizando 16px da direita. */
.step-in {
  animation: step-in .45s var(--ease-out) both;
}
@keyframes step-in {
  from { opacity: 0; transform: translateX(16px); }
  to { opacity: 1; transform: none; }
}
</style>
