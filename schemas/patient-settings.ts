import { z } from 'zod'

// Ajustes da paciente (ACO-102). Contratos do BFF com a API; a paciente vem
// sempre do token, nenhum corpo leva patientId.

const isoDate = z.string().datetime({ offset: true })

export const consentScopeSchema = z.enum(['health_data', 'communications', 'aggregate_statistics'])
export type ConsentScope = z.infer<typeof consentScopeSchema>

export const consentScopeParamSchema = z.object({ scope: consentScopeSchema })

export const patientSettingsConsentSchema = z.object({
  scope: consentScopeSchema,
  documentId: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  version: z.string(),
  required: z.boolean(),
  status: z.enum(['accepted', 'revoked', 'not_given']),
  acceptedAt: isoDate.nullable(),
  acceptedVersion: z.string().nullable(),
  revokedAt: isoDate.nullable(),
})

export const patientSelfExportSchema = z.object({
  requestedAt: isoDate,
  status: z.enum(['in_progress', 'sent', 'failed']),
  nextAvailableAt: isoDate.nullable(),
  alreadyRequested: z.boolean().optional().default(false),
})

export const patientSettingsProfileSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
})

export const patientSettingsSchema = z.object({
  profile: patientSettingsProfileSchema,
  psychologist: z.object({
    name: z.string(),
    crp: z.string(),
    since: isoDate.nullable(),
    relationshipStatus: z.enum(['pending', 'active', 'paused', 'ended', 'transferred']),
  }).nullable(),
  consents: z.array(patientSettingsConsentSchema),
  export: patientSelfExportSchema.nullable(),
})

// Mesmas regras da API: nome de 2 a 200 caracteres; telefone com 8 a 15
// dígitos, com DDD. Telefone vazio apaga o gravado; ausente mantém.
export const patientProfileUpdateSchema = z.object({
  fullName: z.string({ required_error: 'Informe seu nome completo.' })
    .trim()
    .min(2, 'Informe seu nome completo.')
    .max(200, 'O nome pode ter no máximo 200 caracteres.'),
  phone: z.string().trim()
    .max(32, 'O telefone pode ter no máximo 32 caracteres.')
    .refine(value => !value || (/^[+0-9() .-]+$/.test(value) && value.replace(/\D/g, '').length >= 8 && value.replace(/\D/g, '').length <= 15), 'Informe um telefone válido, com DDD.')
    .optional(),
})

export type PatientSettings = z.infer<typeof patientSettingsSchema>
export type PatientSettingsConsent = z.infer<typeof patientSettingsConsentSchema>
export type PatientSelfExport = z.infer<typeof patientSelfExportSchema>
export type PatientSettingsProfile = z.infer<typeof patientSettingsProfileSchema>
export type PatientProfileUpdate = z.infer<typeof patientProfileUpdateSchema>
