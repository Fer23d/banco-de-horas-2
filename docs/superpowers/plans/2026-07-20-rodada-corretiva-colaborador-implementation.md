# Rodada corretiva do Colaborador Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Corrigir os onze problemas aprovados da área do Colaborador sem alterar dependências, autenticação, backend ou a arquitetura modular existente.

**Architecture:** Manter features por domínio, regras puras e services assíncronos. O shell coordena layout e foco; calendário, saldo e bloqueio de datas ficam em funções puras; componentes recebem contratos pequenos; `localStorage` continua escondido pelos services `v3`.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS 4, React Router 7, Vitest 4 e oxlint já instalados.

---

### Task 1: Registrar a especificação corretiva

**Files:**
- Create: `docs/superpowers/specs/2026-07-20-rodada-corretiva-colaborador-design.md`
- Create: `docs/superpowers/plans/2026-07-20-rodada-corretiva-colaborador-implementation.md`
- Modify: `docs/superpowers/specs/2026-07-19-area-colaborador-design.md`
- Modify: `docs/colaborador-analise-prototipo.md`
- Modify: `docs/colaborador-modelo-funcional.md`
- Modify: `docs/colaborador-plano-implementacao.md`
- Modify: `frontend/README.md`

- [ ] Registrar diagnóstico, regras, persistência, acessibilidade, testes e aceite sem decisões abertas.
- [ ] Atualizar as fontes anteriores que ainda prometem seis atividades ou projeção ao Colaborador.
- [ ] Executar `git diff --check`, `git diff --stat` e revisar `git diff` integralmente.
- [ ] Confirmar que nenhum segredo, build ou manifest de pacote será staged.
- [ ] Commit: `docs(colaborador): planejar rodada corretiva da interface`.

### Task 2: Corrigir App Shell, sidebar, drawer e marca

**Files:**
- Create: `frontend/src/components/BrandMark.tsx`
- Create: `frontend/src/components/BrandMark.test.tsx`
- Modify: `frontend/src/components/AppLayout.tsx`
- Modify: `frontend/src/components/Header.tsx`
- Modify: `frontend/src/components/Sidebar.tsx`
- Modify: `frontend/src/components/PageContainer.tsx`
- Modify: `frontend/src/components/layout.test.tsx`
- Modify: `frontend/src/pages/LoginPage.tsx`
- Modify: `frontend/src/styles/index.css`

- [ ] Escrever testes RED para fallback de marca, resumo de perfil, links, regiões do shell e semântica do drawer.
- [ ] Executar `npm test -- src/components/layout.test.tsx src/components/BrandMark.test.tsx` e confirmar as falhas esperadas.
- [ ] Implementar a API reutilizável `<BrandMark variant="compact" alt="SM&A" />` sem asset fictício.
- [ ] Reestruturar header global e coluna `flex min-w-0`; sidebar desktop no fluxo e drawer mobile sobreposto.
- [ ] Obter iniciais, nome, cargo e squad pelo contexto/service já existente, sem novo usuário fixo no componente.
- [ ] Implementar Escape, foco inicial, contenção de Tab e retorno de foco ao botão do header.
- [ ] Centralizar somente tokens usados pelos componentes afetados em `styles/index.css`.
- [ ] Executar testes alvo, `npm run lint` e `npm run typecheck`.
- [ ] Commit: `fix(layout): restaurar sidebar e alinhamento do colaborador`.

### Task 3: Corrigir grade mensal e aviso de feriados

**Files:**
- Modify: `frontend/src/features/calendar/domain.ts`
- Modify: `frontend/src/features/calendar/domain.test.ts`
- Modify: `frontend/src/features/calendar/MonthlyCalendar.tsx`
- Modify: `frontend/src/features/calendar/interface.test.tsx`

- [ ] Substituir o teste de 42 datas por testes RED de julho/2026, fevereiro/2026 e mês iniciado na segunda.
- [ ] Exigir 31 células `day` e quatro placeholders para julho/2026, sem `2026-06-29` ou `2026-08-01`.
- [ ] Executar testes alvo e confirmar que as datas adjacentes ainda são botões.
- [ ] Implementar união `placeholder | day` e preencher somente as semanas usadas.
- [ ] Renderizar placeholder como elemento não interativo, `aria-hidden`, sem data ou handler.
- [ ] Trocar o aviso pela frase de calendário corporativo aprovada, com `role="note"`.
- [ ] Executar testes alvo, lint e typecheck.
- [ ] Commit: `fix(calendario): exibir somente dias do mes selecionado`.

### Task 4: Completar catálogo e remover ação duplicada

**Files:**
- Modify: `frontend/src/mocks/demoData.ts`
- Modify: `frontend/src/features/time-entries/interface.test.tsx`
- Modify: `frontend/src/features/time-entries/domain.test.ts`
- Modify: `frontend/src/features/collaborator/DailyEntryList.tsx`
- Create: `frontend/src/features/collaborator/DailyEntryList.test.tsx`

- [ ] Escrever teste RED que compara os vinte nomes e a ordem exata.
- [ ] Escrever testes RED que excluem Férias, Afastamentos médicos, Feriado/emenda e Folga compensação de horas.
- [ ] Escrever teste RED do estado vazio/lista sem link “Novo apontamento”.
- [ ] Executar os testes alvo e confirmar seis opções e link duplicado.
- [ ] Substituir `demoActivities`, preservando IDs existentes dos nomes já conhecidos.
- [ ] Remover link/import sem uso de `DailyEntryList`; manter fallback legível para atividade histórica desconhecida.
- [ ] Executar testes alvo, lint e typecheck.
- [ ] Commit: `feat(apontamentos): completar catalogo de atividades`.

### Task 5: Remover projeção e consolidar eventos integrais

**Files:**
- Modify: `frontend/src/features/calendar/types.ts`
- Modify: `frontend/src/features/calendar/domain.ts`
- Modify: `frontend/src/features/calendar/domain.test.ts`
- Modify: `frontend/src/pages/ColaboradorPage.tsx`
- Modify: `frontend/src/features/history/HistoryPeriodSummary.tsx`
- Modify: `frontend/src/features/history/HistoryPeriodSummary.test.tsx`
- Modify: `frontend/src/features/collaborator/useCollaboratorDashboard.ts`
- Modify: `frontend/src/features/history/useTimeEntryHistory.ts`
- Modify: `frontend/src/features/calendar/DayDetails.tsx`

- [ ] Escrever testes RED para período posterior a hoje sem jornada, déficit ou saldo futuro.
- [ ] Escrever testes RED para 8h ativas sob férias/feriado/afastamento integral com saldo, normal e extra zero e conflito sinalizado.
- [ ] Executar testes de domínio e confirmar o déficit futuro e saldo positivo atuais.
- [ ] Remover `projectedBalanceMinutes`; adicionar `hasFutureDates` e `hasIntegralEventConflict`.
- [ ] Limitar agregação a hoje e neutralizar trabalho no resumo sob evento integral, preservando o registro de origem.
- [ ] Remover cards/resumos de projeção e mostrar nota de datas futuras somente quando necessária.
- [ ] Sinalizar conflito integral em detalhes e histórico, sem apagar ou migrar dados.
- [ ] Executar testes alvo, lint e typecheck.
- [ ] Commit: `fix(saldos): remover projecao e neutralizar eventos integrais`.

### Task 6: Bloquear lançamentos em eventos integrais

**Files:**
- Create: `frontend/src/features/calendar/entryDatePolicy.ts`
- Create: `frontend/src/features/calendar/entryDatePolicy.test.ts`
- Modify: `frontend/src/features/time-entries/useTimeEntryForm.ts`
- Modify: `frontend/src/services/calendarEventService.ts`
- Modify: `frontend/src/services/calendarEventService.test.ts`

- [ ] Escrever testes RED para férias, afastamento integral, feriado, afastamento parcial e precedência.
- [ ] Definir `EntryDateBlock = { blocked: true; message: string } | { blocked: false }`.
- [ ] Implementar mensagens aprovadas sem termos técnicos.
- [ ] No submit, carregar perfil, eventos e feriado da data; bloquear antes do service.
- [ ] Preservar afastamento parcial e validações independentes de aprovação/competência.
- [ ] Testar que eventos continuam somente leitura na área do Colaborador.
- [ ] Executar testes alvo, lint, typecheck e build.
- [ ] Commit: `fix(apontamentos): bloquear datas com evento integral`.

### Task 7: Reformular situação e ações de cancelados

**Files:**
- Modify: `frontend/src/features/history/useTimeEntryHistory.ts`
- Modify: `frontend/src/features/history/HistoryFilters.tsx`
- Modify: `frontend/src/features/history/TimeEntryHistory.tsx`
- Modify: `frontend/src/features/history/domain.ts`
- Modify: `frontend/src/features/history/domain.test.ts`
- Modify: `frontend/src/features/time-entries/interface.test.tsx`

- [ ] Escrever testes RED para `ACTIVE` padrão, rótulo e opções exatas.
- [ ] Extrair e testar `toServiceStatusFilter` para ativos, cancelados e todos.
- [ ] Testar que aplicar filtro reinicia paginação pela transição pura usada pelo hook.
- [ ] Ajustar tipo para `ACTIVE | CANCELLED | ALL`, inicializar `ACTIVE` e mapear `ALL` para `undefined`.
- [ ] Garantir que cancelado não renderize Editar, Duplicar, Cancelar ou Concluir correção.
- [ ] Executar testes alvo, lint e typecheck.
- [ ] Commit: `fix(historico): ajustar filtro e registros cancelados`.

### Task 8: Destacar revisões do apontamento

**Files:**
- Create: `frontend/src/features/time-entries/EntryRevisionBadge.tsx`
- Create: `frontend/src/features/time-entries/EntryRevisionBadge.test.tsx`
- Modify: `frontend/src/features/collaborator/DailyEntryList.tsx`
- Modify: `frontend/src/features/history/TimeEntryHistory.tsx`
- Modify: `frontend/src/services/timeEntryService.test.ts`

- [ ] Escrever testes RED para versão 1 sem badge, versão 2 com badge e timestamp inválido sem data inventada.
- [ ] Implementar badge “Editado” e detalhe `Editado em DD/MM/AAAA às HH:mm · Versão N`.
- [ ] Reutilizar o componente na lista diária e no histórico, junto ao status de aprovação.
- [ ] Confirmar em teste que edição preserva `createdAt`, incrementa versão e atualiza `updatedAt`.
- [ ] Impedir ações em linha com conflito integral usando o sinal já calculado.
- [ ] Executar testes alvo, lint e typecheck.
- [ ] Commit: `feat(apontamentos): destacar revisoes do registro`.

### Task 9: Verificação visual e regressões

**Files:** Modify only an affected file after reproducing a defect and adding its regression test.

- [ ] Iniciar Vite em `127.0.0.1:4173` e usar o acesso corporativo existente.
- [ ] Visitar Visão geral, Novo apontamento, Histórico, Folgas e Perfil.
- [ ] Validar 1920, 1440, 1024 e 390 px nos temas claro e escuro.
- [ ] Validar drawer por clique, Tab, Shift+Tab, Escape, backdrop e navegação.
- [ ] Validar meses que começam/terminam no meio da semana, sem datas adjacentes.
- [ ] Validar vinte atividades, exclusões, ausência de projeção, três situações e badge Editado.
- [ ] Validar férias, feriado, afastamentos integral/parcial e ausência de saldo positivo em conflito.
- [ ] Inspecionar console e overflow horizontal; encerrar o servidor.
- [ ] Se necessário, criar teste RED, corrigir e commit `fix(colaborador): concluir revisao visual e acessibilidade`.

### Task 10: Verificação final e entrega

**Files:** Verify only.

- [ ] Executar `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` e `git diff --check`.
- [ ] Confirmar SHA-256 do HTML igual ao valor aprovado.
- [ ] Confirmar hashes de `package.json`/`package-lock.json` iguais à linha de base e ausência de generated/secrets.
- [ ] Ler status, commits e divergência local/remota.
- [ ] Aplicar `superpowers:verification-before-completion` e `superpowers:finishing-a-development-branch`; a decisão já aprovada é manter esta branch e fazer push sem PR/merge.
- [ ] Fazer push somente de `refactor/frontend-colaborador` para `origin/refactor/frontend-colaborador`, sem force.
- [ ] Confirmar árvore limpa e divergência `0 0` após o push.
