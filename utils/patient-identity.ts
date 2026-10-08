export function patientRelationshipLabel(status?: string) {
  const labels: Record<string, string> = {
    pending: 'Aguardando aceite', active: 'Ativo', paused: 'Pausado',
    ended: 'Encerrado', transferred: 'Transferido',
  }
  return status ? labels[status] ?? 'Não informado' : 'Não informado'
}
