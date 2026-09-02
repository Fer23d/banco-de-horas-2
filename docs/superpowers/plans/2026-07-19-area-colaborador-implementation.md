# Área completa do Colaborador — Plano de implementação

> **Para o Codex:** skill obrigatória durante a execução: `superpowers:executing-plans`. Aplicar `superpowers:test-driven-development` em cada comportamento e `superpowers:verification-before-completion` antes do push.

**Objetivo:** evoluir a primeira fatia React para a área completa do Colaborador, com domínio testável, persistência local migrável, fluxos funcionais, responsividade e acessibilidade.

**Arquitetura:** features por domínio, regras puras, repositórios assíncronos atrás de interfaces e hooks finos para coordenação. `localStorage` é apenas adaptador corporativo; componentes não conhecem chaves nem formato persistido.

**Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS 4, React Router 7, Vitest 4 e oxlint já instalados. Nenhuma dependência será adicionada.

## Premissas de execução

- Branch obrigatória: `refactor/frontend-colaborador`; não criar outra branch.
- Preservar `SMA_banco de horas 2.html`.
- Não alterar versões ou instalar pacotes.
- Executar testes em ciclos RED → GREEN → REFACTOR.
- Cada commit inclui uma fatia coerente e seus testes, com o projeto funcional.
- Não implementar controles exclusivos de Supervisor ou Diretor.

### Tarefa 1 — Consolidar documentação aprovada

**Arquivos:**

- Criar `docs/superpowers/specs/2026-07-19-area-colaborador-design.md`.
- Criar `docs/superpowers/plans/2026-07-19-area-colaborador-implementation.md`.

**Passos:**

1. Registrar todas as decisões do prompt, sem TBD/TODO.
2. Executar `git diff --check`.
3. Revisar integralmente o staged diff.
4. Commit: `docs(colaborador): consolidar especificacao da area completa`.

### Tarefa 2 — Estruturar tipos, datas e regras de domínio

**Arquivos principais:**

- Criar `frontend/src/config/business.ts`.
- Criar `frontend/src/features/profile/types.ts`.
- Criar `frontend/src/features/squads/types.ts`.
- Criar `frontend/src/features/workloads/types.ts`.
- Criar `frontend/src/features/approvals/types.ts`.
- Criar `frontend/src/features/calendar/types.ts`.
- Criar `frontend/src/features/time-off/types.ts`.
- Criar `frontend/src/features/audit/types.ts`.
- Criar `frontend/src/features/time-entries/types.ts`.
- Atualizar `frontend/src/shared/types/domain.ts` como barrel compatível.
- Atualizar `frontend/src/shared/utils/date.ts`.
- Criar `frontend/src/features/workloads/domain.ts`.
- Criar `frontend/src/features/calendar/domain.ts`.
- Criar `frontend/src/features/approvals/domain.ts`.
- Atualizar `frontend/src/features/time-entries/domain.ts`.
- Criar/atualizar testes `*.test.ts` correspondentes.

**Ciclo TDD:**

1. Escrever testes falhos para timezone corporativo, data futura, competência fechada/reaberta, carga histórica e transições diárias.
2. Executar os testes alvo e confirmar falhas esperadas.
3. Implementar tipos e funções mínimas.
4. Escrever testes falhos para saldo positivo/zero/negativo, mês/intervalo/total, futuro/projeção, feriado, férias, afastamento integral/parcial e folga.
5. Implementar o agregador puro de saldos e estados de calendário.
6. Executar testes alvo, `npm run typecheck` e `npm run lint`.

**Commit:** `refactor(colaborador): estruturar dominio de jornada e saldos`.

### Tarefa 3 — Migrar persistência e adicionar ciclo de vida/auditoria

**Arquivos principais:**

- Criar `frontend/src/services/storage.ts`.
- Atualizar `frontend/src/services/timeEntryMigration.ts`.
- Atualizar `frontend/src/services/timeEntryService.ts`.
- Criar `frontend/src/services/auditService.ts`.
- Criar `frontend/src/services/dayApprovalService.ts`.
- Criar/atualizar testes de services e migração.

**Ciclo TDD:**

1. Escrever testes falhos para migração `v2` → `v3`, precedência de `v3`, idempotência, preservação de `v2`, JSON inválido, migração individual, campos removidos e snapshots seguros.
2. Implementar storage `v3` com gravação, releitura e validação.
3. Escrever testes falhos para criar, editar com versão/motivo, duplicar com novo ID, cancelar logicamente, propriedade e aprovado somente leitura.
4. Implementar comandos e auditoria sem excluir fisicamente.
5. Escrever testes de status diário, correção, conclusão, fechamento e reabertura.
6. Implementar repositório de aprovação e políticas de mutação.
7. Executar testes alvo, lint e typecheck.

**Commit:** `refactor(colaborador): versionar persistencia e ciclo de vida`.

### Tarefa 4 — Completar formulário e histórico

**Arquivos principais:**

- Atualizar `frontend/src/mocks/demoData.ts`.
- Atualizar `frontend/src/features/time-entries/TimeEntryForm.tsx`.
- Criar componentes menores em `frontend/src/features/time-entries/components/`.
- Criar `frontend/src/features/time-entries/useTimeEntryForm.ts`.
- Criar `frontend/src/features/history/HistoryFilters.tsx`.
- Criar `frontend/src/features/history/TimeEntryHistory.tsx`.
- Criar `frontend/src/features/history/useTimeEntryHistory.ts`.
- Atualizar `frontend/src/pages/NovoApontamentoPage.tsx`.
- Atualizar `frontend/src/pages/HistoricoPage.tsx`.
- Atualizar `frontend/src/app/AppRoutes.tsx`.
- Criar testes de markup/contratos de interface sem nova infraestrutura.

**Ciclo TDD:**

1. Testar validações novas: data, disciplina, tipo documental, detalhe e duração.
2. Implementar campos e foco no primeiro erro.
3. Testar paginação/filtros e ações permitidas por status.
4. Implementar histórico responsivo com estados vazio/loading/erro.
5. Implementar edição, duplicação e cancelamento com confirmação e feedback.
6. Verificar que Avanço e Documento (LD) não aparecem.
7. Executar testes alvo, lint, typecheck e build.

**Commit:** `feat(colaborador): completar formulario e historico`.

### Tarefa 5 — Implementar calendário, dashboard e saldos

**Arquivos principais:**

- Criar `frontend/src/services/holidayProvider.ts`.
- Criar `frontend/src/services/calendarEventService.ts`.
- Criar `frontend/src/features/calendar/MonthlyCalendar.tsx`.
- Criar `frontend/src/features/calendar/CalendarLegend.tsx`.
- Criar `frontend/src/features/calendar/DayDetails.tsx`.
- Criar `frontend/src/features/calendar/useCalendarMonth.ts`.
- Atualizar `frontend/src/features/collaborator/useDailyDashboard.ts`.
- Criar `frontend/src/features/collaborator/useCollaboratorDashboard.ts`.
- Atualizar `frontend/src/pages/ColaboradorPage.tsx`.
- Criar testes de provider, calendário, agregados e markup acessível.

**Ciclo TDD:**

1. Testar consulta de feriados por localidade/intervalo e fixtures determinísticas.
2. Testar todos os estados do calendário e precedência/combinação de eventos.
3. Implementar provider e calendário mensal limitado.
4. Testar cards real/projetado, pendências, aprovações e correções.
5. Implementar dashboard sem cálculos no JSX.
6. Verificar legenda textual, nomes acessíveis e seleção de data.
7. Executar testes alvo, lint, typecheck e build.

**Commit:** `feat(colaborador): implementar calendario e saldos`.

### Tarefa 6 — Implementar folgas, notificações e auditoria

**Arquivos principais:**

- Criar `frontend/src/services/timeOffService.ts`.
- Criar `frontend/src/services/notificationService.ts`.
- Criar `frontend/src/features/time-off/domain.ts`.
- Criar `frontend/src/features/time-off/TimeOffRequestForm.tsx`.
- Criar `frontend/src/features/time-off/TimeOffRequestList.tsx`.
- Criar `frontend/src/features/time-off/useTimeOffRequests.ts`.
- Criar `frontend/src/pages/FolgasPage.tsx`.
- Atualizar rotas e navegação.
- Criar testes de domínio, service e markup.

**Ciclo TDD:**

1. Testar criação futura, vínculo por snapshot e necessidade de aprovação.
2. Testar exclusão lógica de pendente, cancelamento de aprovada futura, bloqueio após data, notificação, auditoria e projeção.
3. Implementar service e hooks.
4. Implementar página, confirmação e feedback.
5. Executar testes alvo, lint, typecheck e build.

**Commit:** `feat(colaborador): implementar solicitacoes de folga`.

### Tarefa 7 — Implementar perfil, squad e carga versionada

**Arquivos principais:**

- Atualizar `frontend/src/services/profileService.ts`.
- Criar `frontend/src/services/squadService.ts`.
- Criar `frontend/src/services/workloadService.ts`.
- Criar `frontend/src/features/profile/ProfileSummary.tsx`.
- Criar `frontend/src/features/profile/SquadSelector.tsx`.
- Criar `frontend/src/features/workloads/WorkloadRequestForm.tsx`.
- Criar `frontend/src/features/workloads/WorkloadHistory.tsx`.
- Atualizar `frontend/src/features/collaborator/useProfile.ts`.
- Atualizar `frontend/src/pages/PerfilPage.tsx`.
- Criar testes de services, regras e markup.

**Ciclo TDD:**

1. Testar primeiro cadastro obrigatório quando sem carga.
2. Testar troca de squad e preservação de snapshots antigos.
3. Testar solicitação de carga, carga vigente enquanto pendente e vigência aprovada sem recálculo passado.
4. Implementar repositórios e UI sem botões de aprovação.
5. Testar auditoria e snapshots das solicitações.
6. Executar testes alvo, lint, typecheck e build.

**Commit:** `feat(colaborador): completar perfil squad e carga`.

### Tarefa 8 — Corrigir layout e concluir acessibilidade

**Arquivos principais:**

- Atualizar `frontend/src/components/AppLayout.tsx`.
- Atualizar `frontend/src/components/Header.tsx`.
- Atualizar `frontend/src/components/Sidebar.tsx`.
- Criar `frontend/src/components/ConfirmDialog.tsx`.
- Atualizar `frontend/src/components/PageContainer.tsx`.
- Atualizar `frontend/src/styles/index.css`.
- Atualizar testes de markup/layout.

**Passos:**

1. Escrever verificações de markup para cabeçalho, sidebar, drawer, labels, legenda e status textual.
2. Reestruturar cabeçalho em largura total e sidebar abaixo dele.
3. Garantir drawer sem reserva de espaço, foco visível e ausência de overflow horizontal.
4. Revisar desktop, tablet e mobile no navegador.
5. Testar navegação por teclado, estados vazios, formulários e console.
6. Executar testes, lint, typecheck e build.

**Commit:** `fix(colaborador): concluir layout e acessibilidade`.

### Tarefa 9 — Verificação integral e entrega

**Passos:**

1. Executar `npm test` em `frontend`.
2. Executar `npm run lint`.
3. Executar `npm run typecheck`.
4. Executar `npm run build`.
5. Executar `git diff --check`.
6. Procurar `any`, `console.log`, TODO/FIXME, segredos e arquivos gerados indevidos.
7. Iniciar o frontend e navegar por login, visão geral, novo apontamento, histórico, folgas e perfil em desktop e mobile.
8. Validar estados normal, déficit, excedente, feriado, férias, afastamento parcial e folga; verificar console.
9. Se houver correções, escrever teste de regressão quando aplicável e criar commit específico.
10. Executar novamente toda a suíte após o último commit.
11. Confirmar árvore limpa, listar commits e fazer push apenas para `origin/refactor/frontend-colaborador`.

**Critério final:** todas as verificações com saída real aprovada, nenhum arquivo sensível/gerado no Git, branch limpa e remoto atualizado. Não abrir pull request e não fazer merge na `main`.
