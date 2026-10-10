import { z } from 'zod'
import { FIELD_TYPES } from './activity-template'
import { activityReviewFieldSchema } from './activity'

// Paciente responde atividade (ACO-68).
// Contrato em acolhe-api/docs/api/activity-submission.md.

// config do campo, como a API devolve. Todos os limites são opcionais: o builder
// só grava o que foi configurado.
export const patientActivityFieldConfigSchema = z.object({
  required: z.boolean().optional(),
  helpText: z.string().optional(),
  maxLength: z.number().int().positive().optional(),
  min: z.number().int().optional(),
  max: z.number().int().optional(),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
  options: z.array(z.string()).optional(),
}).passthrough()

export const patientActivityFieldSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  label: z.string().min(1),
  fieldType: z.enum(FIELD_TYPES),
  displayOrder: z.number().int(),
  config: patientActivityFieldConfigSchema,
})

export const patientActivityDetailSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  title: z.string(),
  type: z.string(),
  description: z.string().nullable(),
  instructions: z.string().nullable(),
  templateVersion: z.number().int(),
  scheduledFor: z.string().nullable(),
  dueAt: z.string().nullable(),
  submittedAt: z.string().nullable(),
  canRespond: z.boolean(),
  fields: z.array(patientActivityFieldSchema),
  // Depois de enviada (ACO-104): as respostas dela e só o comentário
  // compartilhado. Defaults para conviver com a API anterior.
  reviewedAt: z.string().nullable().default(null),
  answers: z.array(activityReviewFieldSchema).default([]),
  comment: z.lazy(() => sharedCommentSchema).nullable().default(null),
})

export const sharedCommentSchema = z.object({
  text: z.string(),
  updatedAt: z.string(),
})

// Aba "Enviadas" do portal.
export const patientSubmittedActivitySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.string(),
  submittedAt: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  comment: sharedCommentSchema.nullable(),
})

// Valor enviado por campo. `kind` repete o fieldType: a API recusa divergência,
// então quem monta o payload não pode "chutar" o tipo.
export const submissionValueSchema = z.object({
  fieldCode: z.string().min(1),
  kind: z.enum(FIELD_TYPES),
  text: z.string().optional(),
  number: z.number().optional(),
  boolean: z.boolean().optional(),
  date: z.string().optional(),
  datetime: z.string().optional(),
  choice: z.string().optional(),
  choices: z.array(z.string()).optional(),
})

export const submissionRequestSchema = z.object({
  submissionId: z.string().uuid(),
  templateVersion: z.number().int(),
  values: z.array(submissionValueSchema).min(1),
})

export const submissionResponseSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  submittedAt: z.string().nullable(),
  isDraft: z.boolean(),
})

export type PatientActivityField = z.infer<typeof patientActivityFieldSchema>
export type PatientActivityFieldConfig = z.infer<typeof patientActivityFieldConfigSchema>
export type PatientActivityDetail = z.infer<typeof patientActivityDetailSchema>
export type PatientSubmittedActivity = z.infer<typeof patientSubmittedActivitySchema>
export type SubmissionValue = z.infer<typeof submissionValueSchema>
export type SubmissionRequest = z.infer<typeof submissionRequestSchema>

// Resposta em edição na tela, antes de virar SubmissionValue.
export type FieldAnswer = string | number | boolean | string[] | null
