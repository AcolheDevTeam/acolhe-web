import { z } from 'zod'

export const createReminderSchema = z.object({
  appointmentId: z.string().uuid(),
  userId: z.string().uuid(),
  scheduledFor: z.string().datetime(),
})

export type CreateReminderInput = z.infer<typeof createReminderSchema>

// Caixa de notificações da psicóloga (ACO-99). A API não manda texto: só o
// tipo, a paciente e os ids do recurso; a frase é montada aqui.
export const notificationKinds = ['activity_submitted', 'appointment_confirmed', 'invitation_accepted'] as const
export const notificationKindSchema = z.enum(notificationKinds)
export type NotificationKind = z.infer<typeof notificationKindSchema>

export const notificationSchema = z.object({
  id: z.string().uuid(),
  kind: notificationKindSchema,
  patientId: z.string().uuid(),
  patientName: z.string().nullable(),
  activityAssignmentId: z.string().uuid().nullable(),
  appointmentId: z.string().uuid().nullable(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
})
export type AppNotification = z.infer<typeof notificationSchema>

export const notificationPageSchema = z.object({
  items: z.array(notificationSchema),
  nextCursor: z.string().uuid().nullable(),
})
export type NotificationPage = z.infer<typeof notificationPageSchema>

export const notificationListQuerySchema = z.object({
  filter: z.enum(['all', 'unread']).default('all'),
  before: z.string().uuid().optional(),
})
export type NotificationFilter = z.infer<typeof notificationListQuerySchema>['filter']

export const unreadCountSchema = z.object({ count: z.number().int().nonnegative() })

export const notificationPreferenceSchema = z.object({
  kind: notificationKindSchema,
  inApp: z.boolean(),
  email: z.boolean(),
})
export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>

export const notificationPreferencesSchema = z.object({
  preferences: z.array(notificationPreferenceSchema),
})

export const notificationKindParamSchema = z.object({ kind: notificationKindSchema })
export const notificationPreferenceBodySchema = z.object({
  inApp: z.boolean(),
  email: z.boolean(),
})
