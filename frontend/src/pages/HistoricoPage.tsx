import { PageContainer } from '../components/PageContainer'
import { TimeEntryHistory } from '../features/history/TimeEntryHistory'

export function HistoricoPage() {
  return <PageContainer title="Histórico" description="Consulte somente seus apontamentos, com período, filtros e paginação." contained={false}><TimeEntryHistory /></PageContainer>
}
