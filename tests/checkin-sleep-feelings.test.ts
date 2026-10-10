import { describe, expect, it } from 'vitest'
import {
  CHECKIN_FEELINGS, checkinAverages, checkinRejectionMessage, checkinSummary, clockLabel, clockToMinutes,
  durationLabel, durationSpoken, feelingCounts, feelingLabel, minutesToClock, scoreLabel, sleepDurationMinutes,
} from '~/utils/checkin'
import { patientCheckinInputSchema, patientCheckinSchema } from '~/schemas/patient'

const base = { id: '123e4567-e89b-12d3-a456-426614174000', createdAt: '2026-10-09T09:00:00-03:00', updatedAt: '2026-10-09T09:00:00-03:00' }

describe('sono do check-in (ACO-103)', () => {
  it('converte horários e dá a volta na meia-noite', () => {
    expect(clockToMinutes('23:30')).toBe(1410)
    expect(clockToMinutes('24:00')).toBeNull()
    expect(minutesToClock(1410 + 15)).toBe('23:45')
    expect(minutesToClock(1425 + 15)).toBe('00:00')
    expect(minutesToClock(-15)).toBe('23:45')
    expect(clockLabel('06:45')).toBe('06h45')
  })

  it('calcula a duração do sono atravessando a meia-noite', () => {
    expect(sleepDurationMinutes('23:30', '06:45')).toBe(435)
    expect(sleepDurationMinutes('01:00', '09:15')).toBe(495)
    expect(sleepDurationMinutes('07:00', '07:00')).toBeNull()
    expect(durationLabel(435)).toBe('7h15')
    expect(durationLabel(480)).toBe('8h')
    expect(durationSpoken(435)).toBe('7 horas e 15 minutos')
    expect(durationSpoken(60)).toBe('1 hora')
  })
})

describe('validação do check-in', () => {
  it('aceita sono e sentimentos opcionais', () => {
    const parsed = patientCheckinInputSchema.parse({ mood: 4, sleepBedtime: '23:30', sleepWakeTime: '06:45', sleepQuality: 3, feelings: ['calma', 'foco'] })
    expect(parsed.feelings).toEqual(['calma', 'foco'])
    expect(patientCheckinInputSchema.parse({ mood: 4, sleepBedtime: null, sleepWakeTime: null, sleepQuality: null, feelings: [] }).mood).toBe(4)
  })

  it('recusa com mensagens em português e específicas', () => {
    const message = (value: unknown) => {
      const result = patientCheckinInputSchema.safeParse(value)
      return result.success ? null : result.error.issues[0]!.message
    }
    expect(message({ mood: 4, sleepBedtime: '23:10', sleepWakeTime: '06:45' })).toBe('Horário em que dormiu inválido: use HH:MM, em passos de 15 minutos.')
    expect(message({ mood: 4, sleepBedtime: '23:30', sleepWakeTime: '6:45' })).toBe('Horário em que acordou inválido: use HH:MM, em passos de 15 minutos.')
    expect(message({ mood: 4, sleepBedtime: '23:30' })).toBe('Informe o horário em que dormiu e o horário em que acordou, ou deixe os dois em branco.')
    expect(message({ mood: 4, sleepBedtime: '07:00', sleepWakeTime: '07:00' })).toBe('O horário em que acordou precisa ser diferente do horário em que dormiu.')
    expect(message({ mood: 4, sleepQuality: 6 })).toBe('A qualidade do sono vai de 1 a 5.')
    expect(message({ mood: 4, feelings: ['euforia'] })).toBe('Escolha os sentimentos da lista.')
    expect(message({ mood: 0 })).toBe('Escolha como você está, de 1 a 5.')
  })

  it('lê respostas antigas sem os campos novos e sentimentos desconhecidos', () => {
    const old = patientCheckinSchema.parse({ ...base, mood: 3, note: null, day: '2026-10-09' })
    expect(old.feelings).toEqual([])
    const future = patientCheckinSchema.parse({ ...base, mood: 3, day: '2026-10-09', feelings: ['novo'], sleepMinutes: 420 })
    expect(feelingLabel(future.feelings[0]!)).toBe('novo')
  })

  it('usa a mesma lista de sentimentos da API', () => {
    expect(CHECKIN_FEELINGS.map(f => f.value)).toEqual(['ansiedade', 'cansaco', 'calma', 'foco', 'tristeza', 'irritacao', 'esperanca', 'saudade'])
  })
})

describe('resumos com dados reais', () => {
  const now = new Date('2026-10-09T15:00:00Z')
  const items = [
    { day: '2026-10-09', mood: 4, sleepBedtime: '23:30', sleepWakeTime: '06:45', sleepMinutes: 435, sleepQuality: 4, feelings: ['calma', 'foco'] },
    { day: '2026-10-08', mood: 2, sleepBedtime: null, sleepWakeTime: null, sleepMinutes: null, sleepQuality: null, feelings: ['calma'] },
    { day: '2026-10-07', mood: 3, sleepBedtime: '00:00', sleepWakeTime: '07:45', sleepQuality: 2, feelings: [] },
    { day: '2026-09-01', mood: 1, sleepMinutes: 120, sleepQuality: 1, feelings: ['tristeza'] },
  ]

  it('faz as médias de 14 dias só com o que foi registrado', () => {
    const avg = checkinAverages(items, 14, now)
    expect(avg.count).toBe(3)
    expect(avg.mood).toBe(3)
    expect(avg.sleepCount).toBe(2)
    expect(avg.sleepMinutes).toBe((435 + 465) / 2)
    expect(avg.qualityCount).toBe(2)
    expect(scoreLabel(avg.sleepQuality!)).toBe('3,0 de 5')
    expect(checkinAverages([], 14, now).mood).toBeNull()
  })

  it('conta sentimentos sem interpretar', () => {
    expect(feelingCounts(items.slice(0, 3))).toEqual([
      { value: 'calma', label: 'Calma', count: 2 },
      { value: 'foco', label: 'Foco', count: 1 },
    ])
  })

  it('resume o check-in salvo só com o que existe', () => {
    expect(checkinSummary(items[0]!)).toBe('Humor leve, 7h15 de sono, qualidade do sono 4 de 5, calma, foco.')
    expect(checkinSummary({ day: '2026-10-08', mood: 2 })).toBe('Humor pesado.')
  })

  it('traduz cada recusa da API numa frase própria', () => {
    const rejected = (message: string) => ({ statusCode: 400, data: { data: { message } } })
    expect(checkinRejectionMessage(rejected('o horário em que acordou precisa ser diferente do horário em que dormiu'))).toContain('diferente')
    expect(checkinRejectionMessage(rejected('informe o horário em que dormiu e o horário em que acordou, ou deixe os dois em branco'))).toBe('Informe os dois horários de sono, ou limpe o sono.')
    expect(checkinRejectionMessage(rejected('horário em que dormiu inválido: use HH:MM, em passos de 15 minutos'))).toContain('dormiu')
    expect(checkinRejectionMessage(rejected('sentimento fora da lista do check-in'))).toContain('sentimentos')
    expect(checkinRejectionMessage(rejected('a qualidade do sono deve estar entre 1 e 5'))).toBe('Escolha a qualidade do sono de 1 a 5.')
  })
})
