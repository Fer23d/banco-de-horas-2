import { PageContainer } from '../components/PageContainer'
import { TimeEntryForm } from '../features/time-entries/TimeEntryForm'
import { useParams } from 'react-router-dom'

export function NovoApontamentoPage() {
  const { entryId } = useParams()
  return (
    <PageContainer title={entryId ? 'Editar apontamento' : 'Novo apontamento'} description="Registre o tempo dedicado a uma atividade. Os saldos exibidos são provisórios até validação futura do backend.">
      <TimeEntryForm entryId={entryId} />
    </PageContainer>
  )
}
