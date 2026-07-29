import { z } from 'zod'

export const assignActivitySchema = z.object({
  templateId: z.string().uuid(),
  patientId: z.string().uuid(),
  dueAt: z.string().datetime().optional(),
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
  }),
])

export type AssignActivityInput = z.infer<typeof assignActivitySchema>
export type ActivityReviewDetail = z.infer<typeof activityReviewDetailSchema>
