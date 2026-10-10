import { z } from 'zod'

export const assignActivitySchema = z.object({
  templateId: z.string({ required_error: 'Selecione um template' }).uuid('Selecione um template'),
  patientId: z.string({ required_error: 'Selecione um paciente' }).uuid('Selecione um paciente'),
  dueAt: z.string().datetime({ message: 'Informe a data e a hora do prazo' }).optional(),
})

const reviewFieldBaseSchema = z.object({
  fieldId: z.string().uuid(),
  code: z.string(),
  label: z.string(),
  fieldType: z.string(),
  displayOrder: z.number().int(),
  config: z.record(z.unknown()),
})

export const activityReviewFieldSchema = z.discriminatedUnion('kind', [
  reviewFieldBaseSchema.extend({ kind: z.literal('text'), value: z.string() }),
  reviewFieldBaseSchema.extend({ kind: z.literal('number'), value: z.number().finite() }),
  reviewFieldBaseSchema.extend({ kind: z.literal('boolean'), value: z.boolean() }),
  reviewFieldBaseSchema.extend({ kind: z.literal('datetime'), value: z.string().datetime() }),
  reviewFieldBaseSchema.extend({
    kind: z.literal('json'),
    value: z.custom<unknown>(value => value !== undefined),
  }),
  reviewFieldBaseSchema.extend({
    kind: z.literal('attachment'),
    value: z.object({
      id: z.string().uuid(),
      mimeType: z.string(),
      sizeBytes: z.number().int().nonnegative(),
    }),
  }),
])

const activityReviewBaseSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
  templateVersion: z.number().int().positive(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  title: z.string(),
  type: z.string(),
  status: z.string(),
  dueAt: z.string().datetime().nullable().optional(),
  fieldCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
})

const submissionSchema = z.object({
  id: z.string().uuid(),
  submittedAt: z.string().datetime(),
  fields: activityReviewFieldSchema.array(),
})

export const activityReviewDetailSchema = z.discriminatedUnion('state', [
  activityReviewBaseSchema.extend({ state: z.literal('awaiting_response') }),
  activityReviewBaseSchema.extend({ state: z.literal('closed_without_submission') }),
  activityReviewBaseSchema.extend({ state: z.literal('submission_invalid') }),
  activityReviewBaseSchema.extend({
    state: z.literal('submitted'),
    submission: submissionSchema,
  }),
  activityReviewBaseSchema.extend({
    state: z.literal('reviewed'),
    submission: submissionSchema,
    reviewedAt: z.string().datetime(),
    // Revisão da psicóloga (ACO-104). Opcional enquanto a API não devolve.
    review: z.lazy(() => reviewNoteSchema).optional(),
  }),
])

// Revisão (ACO-104): comentário compartilhado (a paciente vê) ou interno
// ("private" na API: só a psicóloga) e tags que só a psicóloga vê.
export const REVIEW_COMMENT_MAX = 2000
export const REVIEW_TAG_MAX = 32
export const REVIEW_TAGS_MAX = 10
export const commentVisibilitySchema = z.enum(['shared', 'private'])

export const reviewNoteSchema = z.object({
  comment: z.string().nullable(),
  visibility: commentVisibilitySchema.nullable(),
  commentUpdatedAt: z.string().datetime().nullable(),
  tags: z.array(z.string()),
})

// Corpo do PUT: o estado completo da revisão. Comentário vazio remove.
export const reviewRequestSchema = z.object({
  comment: z.string().trim().max(REVIEW_COMMENT_MAX, 'O comentário pode ter até 2000 caracteres.').optional(),
  visibility: commentVisibilitySchema.optional(),
  tags: z.array(
    z.string().trim().min(1, 'A tag não pode ficar em branco.').max(REVIEW_TAG_MAX, 'Cada tag pode ter até 32 caracteres.'),
  ).max(REVIEW_TAGS_MAX, 'Use no máximo 10 tags por atividade.').default([]),
}).refine(body => !body.comment || !!body.visibility, {
  message: 'Escolha se o comentário é compartilhado com a paciente ou interno.',
  path: ['visibility'],
})

export type AssignActivityInput = z.infer<typeof assignActivitySchema>
export type ActivityReviewDetail = z.infer<typeof activityReviewDetailSchema>
export type ActivityReviewField = z.infer<typeof activityReviewFieldSchema>
export type ReviewNote = z.infer<typeof reviewNoteSchema>
export type ReviewRequest = z.infer<typeof reviewRequestSchema>
export type CommentVisibility = z.infer<typeof commentVisibilitySchema>
