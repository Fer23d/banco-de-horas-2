# PR Review Corrections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar os bloqueadores Critical e Important encontrados na revisão técnica da branch antes da criação do Pull Request para `main`.

**Architecture:** As correções preservam a arquitetura frontend-only e os services locais existentes. Migrações continuam encadeadas e idempotentes, regras de aprovação permanecem no domínio, falhas pós-commit são diferenciadas da mutação principal, e storage/foco recebem proteções reutilizáveis sem novas dependências.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest 4, React Router 7 e Tailwind CSS 4 já instalados.

## Global Constraints

- Trabalhar somente em `refactor/frontend-colaborador`; não alterar `main`, fazer rebase, merge ou force push.
- Não adicionar ou atualizar dependências.
- Preservar `SMA_banco de horas 2.html`, `frontend/package.json` e `frontend/package-lock.json`.
- Manter `sma:time-entries:v1` e `sma:time-entries:v2` intactas como backups; consultas normais usam somente `v3` depois de validada.
- Não implementar telas funcionais de Supervisor ou Diretor/Administração.
- Escrever cada teste antes do código, confirmar RED, aplicar a menor correção e confirmar GREEN.

---

### Task 1: Restaurar migração encadeada e validação individual

**Files:**
- Modify: `frontend/src/services/timeEntryMigration.ts`
- Modify: `frontend/src/services/timeEntryService.ts`
- Test: `frontend/src/services/timeEntryService.test.ts`

**Interfaces:**
- Consumes: chaves `sma:time-entries:v1`, `sma:time-entries:v2` e `sma:time-entries:v3`.
- Produces: `LEGACY_V1_TIME_ENTRY_STORAGE_KEY`, `migrateV1TimeEntries`, `normalizeTimeEntry` e a cadeia idempotente `v1 → v2 → v3`.

- [ ] **Step 1: Escrever testes RED da atualização direta e dos registros mistos**

Adicionar testes que iniciem somente com `v1`, confirmem a conversão conhecida de `projectId`, preservação de `v1`, criação validada de `v2` e `v3`, releitura sem duplicação e escrita única. Adicionar conjunto `v2` com um registro válido e registros com data impossível, duração acima de 1.440 minutos e versão zero; somente o válido deve alcançar `v3`.

```ts
expect(await service.listByDate(collaboratorId, '2026-07-13')).toHaveLength(1)
expect(storage.getItem(LEGACY_V1_TIME_ENTRY_STORAGE_KEY)).toBe(originalV1)
expect(storage.getItem(LEGACY_V2_TIME_ENTRY_STORAGE_KEY)).not.toBeNull()
expect(storage.getItem(TIME_ENTRY_STORAGE_KEY)).not.toBeNull()
```

- [ ] **Step 2: Executar RED**

Run: `npm test -- --run src/services/timeEntryService.test.ts`

Expected: falhar porque a chave `v1` não é consultada e a validação `v2` ainda aceita registros incompatíveis com `v3`.

- [ ] **Step 3: Implementar normalização compartilhada e migração encadeada**

Mover a validação integral do registro persistido para `normalizeTimeEntry(value, collaboratorId)`, incluindo data ISO real, duração entre 1 e 1.440 minutos, versão positiva, `projectCode` normalizado e campos obrigatórios. Fazer `migrateV2TimeEntries` validar cada resultado com esse normalizador.

```ts
export const LEGACY_V1_TIME_ENTRY_STORAGE_KEY = 'sma:time-entries:v1'

export function normalizeTimeEntry(value: unknown, collaboratorId: string): TimeEntry | null {
  // Retorna null somente para o registro inválido; nunca invalida os irmãos válidos.
}
```

Se `v3` válida existir, retorná-la sem consultar versões anteriores. Sem `v3`, preferir `v2`; quando somente `v1` existir, converter e validar `v2`, gravar e reler `v2`, depois converter e publicar `v3`. Não remover nem alterar `v1` ou `v2`.

- [ ] **Step 4: Executar GREEN e regressões de persistência**

Run: `npm test -- --run src/services/timeEntryService.test.ts`

Expected: todos os testes do service aprovados, incluindo idempotência, falhas controladas e conjuntos parcialmente inválidos.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/timeEntryMigration.ts frontend/src/services/timeEntryService.ts frontend/src/services/timeEntryService.test.ts
git commit -m "fix(persistencia): restaurar migracao encadeada de apontamentos"
```

### Task 2: Fechar o contrato diário de aprovação

**Files:**
- Modify: `frontend/src/features/approvals/domain.ts`
- Modify: `frontend/src/features/approvals/domain.test.ts`
- Modify: `frontend/src/services/dayApprovalService.ts`
- Modify: `frontend/src/services/dayApprovalService.test.ts`
- Modify: `frontend/src/features/collaborator/useCollaboratorDashboard.ts`
- Modify: `frontend/src/features/history/useTimeEntryHistory.ts`
- Modify: `frontend/src/features/history/entryActions.ts`
- Modify: `frontend/src/features/history/TimeEntryHistory.tsx`
- Modify: `frontend/src/features/calendar/DayDetails.tsx`
- Test: `frontend/src/features/calendar/interface.test.tsx`
- Test: `frontend/src/features/history/entryActions.test.ts`

**Interfaces:**
- Consumes: `DailySummary`, `DayApproval`, competência, snapshot de responsável e versão esperada.
- Produces: `isDayApprovalApplicable`, status derivado anulável para dias não aplicáveis e comandos com propriedade/transição/versão verificadas.

- [ ] **Step 1: Escrever testes RED de aplicabilidade e transições**

Cobrir futuro, fim de semana sem trabalho, feriado/férias integrais e dia útil. Cobrir rejeição de aprovação em `APPROVED` e `CORRECTION_REQUESTED`, rejeição sem snapshot, conflito de versão e autorização do supervisor do snapshot. `REOPENED` pode voltar a `APPROVED` porque é o fechamento explícito do fluxo de reabertura documentado.

```ts
expect(isDayApprovalApplicable({ isFuture: true, expectedMinutes: 0, workedMinutes: 0, hasIntegralEventConflict: false })).toBe(false)
expect(() => approveDay(approved, command)).toThrow('não está disponível')
await expect(service.approveDay({ ...command, expectedVersion: 99 })).rejects.toThrow('versão')
```

- [ ] **Step 2: Executar RED**

Run: `npm test -- --run src/features/approvals/domain.test.ts src/services/dayApprovalService.test.ts src/features/calendar/interface.test.tsx src/features/history/entryActions.test.ts`

Expected: falhar porque futuro/dias não aplicáveis recebem status, transições são abertas e comandos não verificam versão ou responsável ausente.

- [ ] **Step 3: Implementar matriz de domínio e chamadas anuláveis**

Aplicabilidade deve exigir data não futura e um conjunto real: jornada ajustada positiva ou trabalho válido, sem conflito de evento integral. `deriveDayApprovalStatus` retorna `null` quando não aplicável. `getForDate` não cria nem exibe aprovação nesses casos.

```ts
export function isDayApprovalApplicable(day: {
  isFuture: boolean
  expectedMinutes: number
  workedMinutes: number
  hasIntegralEventConflict: boolean
}) {
  return !day.isFuture && !day.hasIntegralEventConflict
    && (day.expectedMinutes > 0 || day.workedMinutes > 0)
}
```

Supervisor deve corresponder ao snapshot, que não pode ser `null`, e informar `expectedVersion`. Aprovação aceita apenas `AVAILABLE_FOR_APPROVAL` ou `REOPENED`; correção aceita apenas `AVAILABLE_FOR_APPROVAL`; reabertura aceita estados terminais documentados. Dashboard, detalhe e histórico tratam `DayApproval | null` com texto “Aprovação não aplicável”.

- [ ] **Step 4: Executar GREEN e regressões relacionadas**

Run: `npm test -- --run src/features/approvals/domain.test.ts src/services/dayApprovalService.test.ts src/features/calendar/interface.test.tsx src/features/history/entryActions.test.ts`

Expected: matriz, propriedade, versão e apresentação aprovadas.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/approvals frontend/src/services/dayApprovalService.ts frontend/src/services/dayApprovalService.test.ts frontend/src/features/collaborator/useCollaboratorDashboard.ts frontend/src/features/history frontend/src/features/calendar/DayDetails.tsx frontend/src/features/calendar/interface.test.tsx
git commit -m "fix(aprovacoes): validar aplicabilidade transicoes e responsavel"
```

### Task 3: Diferenciar falha de auditoria após persistência

**Files:**
- Modify: `frontend/src/services/timeEntryService.ts`
- Test: `frontend/src/services/timeEntryService.test.ts`

**Interfaces:**
- Consumes: `AuditRecorder` injetável e mutações já persistidas.
- Produces: callback `onAuditError(message, error)` e gravação de auditoria que não transforma uma mutação confirmada em falsa falha.

- [ ] **Step 1: Escrever teste RED de falha pós-commit**

Injetar auditoria que lança após a gravação principal. Confirmar que `create` resolve, o registro pode ser relido uma única vez e `onAuditError` recebe o erro.

- [ ] **Step 2: Executar RED**

Run: `npm test -- --run src/services/timeEntryService.test.ts`

Expected: a Promise rejeita apesar de o registro já estar persistido.

- [ ] **Step 3: Implementar tratamento pós-commit mínimo**

Capturar erro somente dentro de `record`, chamar `onAuditError` e preservar o retorno da mutação principal. Falhas da gravação principal continuam rejeitando normalmente.

- [ ] **Step 4: Executar GREEN**

Run: `npm test -- --run src/services/timeEntryService.test.ts`

Expected: mutação confirmada, sem duplicidade, com falha de auditoria sinalizada separadamente.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/timeEntryService.ts frontend/src/services/timeEntryService.test.ts
git commit -m "fix(auditoria): preservar resultado de mutacao confirmada"
```

### Task 4: Restaurar foco ao navegar pelo drawer

**Files:**
- Modify: `frontend/src/components/AppLayout.tsx`
- Modify: `frontend/src/components/drawer.ts`
- Test: `frontend/src/components/layout.test.tsx`

**Interfaces:**
- Consumes: `scheduleDrawerTriggerFocus` e callback de fechamento do drawer.
- Produces: `closeDrawerAfterNavigation(close)` que sempre solicita retorno agendado ao acionador.

- [ ] **Step 1: Escrever teste RED do fechamento por navegação**

```ts
const close = vi.fn()
closeDrawerAfterNavigation(close)
expect(close).toHaveBeenCalledWith(true)
```

- [ ] **Step 2: Executar RED**

Run: `npm test -- --run src/components/layout.test.tsx`

Expected: falhar porque a função não existe e `onNavigate` fecha sem retorno de foco.

- [ ] **Step 3: Implementar callback compartilhado**

Usar a função testada em `MobileDrawer.onNavigate`, mantendo Escape, backdrop e botão interno com o comportamento atual.

- [ ] **Step 4: Executar GREEN e validar manualmente no navegador**

Run: `npm test -- --run src/components/layout.test.tsx`

Expected: testes aprovados; após clicar em um link do drawer, `document.activeElement` deve ser o botão que abre o menu.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/AppLayout.tsx frontend/src/components/drawer.ts frontend/src/components/layout.test.tsx
git commit -m "fix(acessibilidade): restaurar foco apos navegacao mobile"
```

### Task 5: Tornar storage e tema resilientes

**Files:**
- Modify: `frontend/src/services/storage.ts`
- Create: `frontend/src/services/storage.test.ts`
- Modify: `frontend/src/app/ThemeProvider.tsx`

**Interfaces:**
- Consumes: provider de `StorageLike`, fallback em memória e preferência de tema.
- Produces: `createResilientStorage` e inicialização de tema sem acesso direto desprotegido a `localStorage`.

- [ ] **Step 1: Escrever testes RED do getter e das operações bloqueadas**

Cobrir provider que lança ao obter o storage, `getItem` que lança e `setItem` que lança. O fallback deve manter leitura/escrita durante a sessão sem propagar `SecurityError`.

- [ ] **Step 2: Executar RED**

Run: `npm test -- --run src/services/storage.test.ts`

Expected: falhar porque `createResilientStorage` não existe.

- [ ] **Step 3: Implementar fallback em memória e integrar o tema**

`createBrowserStorage` deve retornar o wrapper resiliente. Leituras bem-sucedidas alimentam o fallback; escritas atualizam o fallback e tentam o storage primário. `ThemeProvider` usa essa abstração e protege também `matchMedia`, assumindo tema claro quando a preferência não puder ser consultada.

- [ ] **Step 4: Executar GREEN**

Run: `npm test -- --run src/services/storage.test.ts src/pages/LoginPage.test.tsx src/components/layout.test.tsx`

Expected: storage bloqueado não derruba a aplicação e temas existentes continuam aprovados.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/storage.ts frontend/src/services/storage.test.ts frontend/src/app/ThemeProvider.tsx
git commit -m "fix(storage): manter producao ativa sem localStorage"
```

### Task 6: Verificação e nova revisão técnica

**Files:**
- Modify only if a new Critical or Important issue is proven by the checks below.

**Interfaces:**
- Consumes: todos os commits corretivos.
- Produces: evidência atual para push e Pull Request.

- [ ] **Step 1: Executar suíte e gates sequencialmente**

```bash
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

- [ ] **Step 2: Repetir segurança, hashes e limpeza**

Confirmar ausência de segredos, caminhos pessoais, artefatos, screenshots e alterações nos três arquivos protegidos.

- [ ] **Step 3: Solicitar re-review do range completo**

Usar o mesmo `BASE_SHA` de `origin/main` e o novo `HEAD_SHA`; exigir classificação Critical/Important/Minor. Corrigir qualquer Critical/Important comprovado e repetir a etapa.

- [ ] **Step 4: Push e Pull Request**

Com árvore limpa, gates aprovados e revisão sem bloqueadores, enviar somente `refactor/frontend-colaborador`, verificar PR existente e criar ou atualizar PR pronto para revisão contra `main`, sem merge ou auto-merge.

### Task 7: Resolver bloqueios da segunda revisão

**Files:**
- Modify: `frontend/src/services/storage.ts`
- Modify: `frontend/src/services/storage.test.ts`
- Modify: services com efeitos secundários pós-persistência e seus testes
- Modify: `frontend/src/services/timeEntryService.ts`
- Modify: `frontend/src/services/timeEntryService.test.ts`
- Modify: `frontend/src/features/approvals/domain.ts`
- Modify: `frontend/src/features/approvals/domain.test.ts`
- Modify: `frontend/src/services/dayApprovalService.ts`
- Modify: `frontend/src/services/dayApprovalService.test.ts`
- Modify: documentação canônica existente

- [ ] **Step 1: Preservar escrita no fallback após falha isolada de `setItem`**

Escrever teste em que a leitura primária funciona, a escrita falha e a leitura seguinte deve retornar a versão nova mantida em memória. Marcar chaves pendentes e só voltar a priorizar o primário depois de uma escrita bem-sucedida.

- [ ] **Step 2: Uniformizar a política de efeitos secundários pós-commit**

Escrever testes de falha de auditoria/notificação para folga, carga, perfil/squad e aprovação. Uma mutação primária já confirmada deve resolver normalmente e sinalizar a falha secundária por callback, sem induzir repetição do comando.

- [ ] **Step 3: Confirmar integralmente a etapa `v1 → v2`**

Adicionar storage de teste que corrompe apenas a escrita `v2`. Depois de gravar e reler, comparar o conteúdo persistido com a serialização convertida antes de publicar `v3`; em caso de divergência, manter `v1`, não publicar `v3` e retornar erro controlado.

- [ ] **Step 4: Bloquear aprovação futura no domínio e no service**

Adicionar testes explícitos de data futura. `deriveDayApprovalStatus` e `getForDate` não produzem conjunto futuro, e `approveDay` rejeita qualquer data igual ou posterior ao dia corporativo atual.

- [ ] **Step 5: Atualizar documentação canônica**

Corrigir somente afirmações que ficaram históricas: ciclo de vida de apontamentos, calendário/eventos, aprovação corporativa e migração encadeada `v1 → v2 → v3`. Manter explícitas as limitações de backend e autenticação real.

- [ ] **Step 6: Repetir gates e revisão independente**

Executar suíte completa, lint, typecheck, build e `git diff --check`; repetir auditoria e solicitar nova revisão do range completo. Somente prosseguir ao push/PR sem Critical ou Important.
