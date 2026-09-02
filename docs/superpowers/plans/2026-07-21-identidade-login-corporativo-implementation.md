# Identidade SM&A e Login Corporativo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar a logo oficial e uma identidade clara/escura acessível, padronizar os nove estados do calendário e criar acesso corporativo explícito por perfil sem alterar as regras funcionais do Colaborador.

**Architecture:** O asset oficial entra por um `BrandMark` reutilizável. Um único sistema de tokens CSS alimenta shell, componentes e estados do calendário. A sessão corporativa `v2` é tipada, persistida por um service isolado e protegida por uma política pura de rotas; a área do Colaborador continua usando o perfil atual, enquanto Supervisor e Diretor/Administração recebem placeholders honestos.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS 4, React Router 7, Vitest 4 e oxlint já instalados.

## Global Constraints

- Trabalhar somente na branch `refactor/frontend-colaborador`; não criar branch, worktree, merge ou pull request.
- Não modificar `frontend/package.json`, `frontend/package-lock.json`, o HTML original ou versões de dependências; não instalar pacotes.
- Preservar o SHA-256 do HTML `5CBA2AE824DA4349C818888F8CFB2B17A74CCD7B5EBF1489E92DCF2182A1182F`.
- Copiar exatamente o JPEG oficial 243 × 92 para `frontend/src/assets/brand/sma-logo.jpg`, sem recorte, filtro, reamostragem ou recoloração.
- Preservar arquitetura, largura de 256 px, breakpoint de 1024 px, rotas, foco e comportamento da sidebar/drawer aprovados em `53b77ec`.
- Não alterar cálculos, dados, regras de apontamento, calendário, saldos, histórico, folgas ou perfil.
- Não implementar autenticação real, senha, Microsoft Login, backend, banco ou áreas funcionais de Supervisor e Diretor/Administração.
- Os nove estados do calendário devem manter categorias, textos e símbolos distintos; não podem reutilizar a paleta institucional como substituta.
- Nenhum componente recebe hex/rgb/hsl inline; cores estruturais e do calendário ficam em `frontend/src/styles/index.css`.
- Cada fatia de produção segue RED → GREEN → refatoração e termina em commit lógico somente com testes relacionados aprovados.

---

### Task 1: Registrar especificação e plano

**Files:**
- Create: `docs/superpowers/specs/2026-07-21-identidade-login-corporativo-design.md`
- Create: `docs/superpowers/plans/2026-07-21-identidade-login-corporativo-implementation.md`

**Interfaces:**
- Consumes: imagem oficial anexada e linha de base do commit `53b77ec`.
- Produces: fonte de verdade para tokens, sessão `v2`, rotas, testes e critérios de aceite.

- [ ] **Step 1: Registrar a análise da imagem e os valores fechados**

Documentar `#0F455F`, `#75AC96`, método de mediana/núcleo, dimensão 243 × 92 e destino do asset. Incluir todos os valores claro/escuro dos nove estados.

- [ ] **Step 2: Registrar arquitetura e limites**

Documentar `DemoRole`, `DemoSession`, chave `sma:demo-session:v2`, migração de `v1`, rotas por perfil, remoção dos atalhos e preservação da sidebar.

- [ ] **Step 3: Verificar os documentos**

Run:

```powershell
rg -n "pendência de implementação|placeholder a definir|decisão aberta" docs/superpowers/specs/2026-07-21-identidade-login-corporativo-design.md docs/superpowers/plans/2026-07-21-identidade-login-corporativo-implementation.md
git diff --check
```

Expected: nenhuma decisão aberta e `git diff --check` com exit code 0.

- [ ] **Step 4: Commit**

```powershell
git add -- docs/superpowers/specs/2026-07-21-identidade-login-corporativo-design.md docs/superpowers/plans/2026-07-21-identidade-login-corporativo-implementation.md
git diff --cached --stat
git diff --cached
git commit -m "docs(frontend): definir identidade e login corporativo"
```

### Task 2: Integrar o asset e o BrandMark oficial

**Files:**
- Create: `frontend/src/assets/brand/sma-logo.jpg`
- Modify: `frontend/src/components/BrandMark.tsx`
- Modify: `frontend/src/components/BrandMark.test.tsx`
- Modify: `frontend/src/components/Header.tsx`
- Modify: `frontend/src/components/Sidebar.tsx`
- Modify: `frontend/src/components/layout.test.tsx`

**Interfaces:**
- Consumes: JPEG oficial e API atual `BrandMarkProps`.
- Produces: `<BrandMark variant="compact|full" src? alt? />` com asset padrão, proporção preservada e fallback textual.

- [ ] **Step 1: Escrever testes RED do asset, imagem e fallback**

Adicionar em `BrandMark.test.tsx`:

```tsx
it('usa a logo oficial por padrão com texto alternativo e proporção preservada', () => {
  const markup = renderToStaticMarkup(<BrandMark variant="full" />)
  expect(markup).toContain('<img')
  expect(markup).toContain('sma-logo.jpg')
  expect(markup).toContain('alt="SM&amp;A — Sistemas Elétricos e Automação"')
  expect(markup).toContain('object-contain')
})

it('usa fallback textual quando a origem está vazia', () => {
  const markup = renderToStaticMarkup(<BrandMark src="" />)
  expect(markup).not.toContain('<img')
  expect(markup).toContain('SM&amp;A')
})
```

Atualizar `layout.test.tsx` para exigir uma única logo oficial no header e nenhuma marca temporária dentro do cartão da squad.

- [ ] **Step 2: Executar e confirmar RED**

Run:

```powershell
npm test -- --run src/components/BrandMark.test.tsx src/components/layout.test.tsx
```

Expected: falhar porque o `BrandMark` ainda usa fallback por padrão e o asset não existe.

- [ ] **Step 3: Copiar o binário sem alteração**

```powershell
New-Item -ItemType Directory -Force frontend/src/assets/brand
$logoAnexada = Join-Path $env:TEMP 'codex-clipboard-efd3f1d8-e64b-4b62-b6b2-2f337ca89715.jpg'
Copy-Item -LiteralPath $logoAnexada -Destination 'frontend/src/assets/brand/sma-logo.jpg'
Get-FileHash -Algorithm SHA256 -LiteralPath $logoAnexada,'frontend/src/assets/brand/sma-logo.jpg'
```

Expected: os dois hashes idênticos.

- [ ] **Step 4: Implementar o BrandMark mínimo**

Usar esta API em `BrandMark.tsx`:

```tsx
import { useState } from 'react'
import officialLogo from '../assets/brand/sma-logo.jpg'

const defaultAlt = 'SM&A — Sistemas Elétricos e Automação'

export function BrandMark({ alt = defaultAlt, variant = 'compact', src = officialLogo, className = '' }: BrandMarkProps) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(src) && !failed
  return (
    <span className={`brand-mark brand-mark--${variant} ${className}`} data-brand-variant={variant}>
      {showImage
        ? <img src={src} alt={alt} className="h-full w-full object-contain" onError={() => setFailed(true)} />
        : <span className="brand-mark__fallback" role="img" aria-label={alt}>SM&amp;A</span>}
    </span>
  )
}
```

No header, usar variante compacta visível em mobile e desktop. Na sidebar, remover o `BrandMark` do cartão da squad sem alterar sua estrutura de navegação.

- [ ] **Step 5: Executar GREEN e verificações relacionadas**

```powershell
npm test -- --run src/components/BrandMark.test.tsx src/components/layout.test.tsx
npm run lint
npm run typecheck
```

Expected: testes alvo, lint e TypeScript aprovados.

- [ ] **Step 6: Commit**

```powershell
git add -- frontend/src/assets/brand/sma-logo.jpg frontend/src/components/BrandMark.tsx frontend/src/components/BrandMark.test.tsx frontend/src/components/Header.tsx frontend/src/components/Sidebar.tsx frontend/src/components/layout.test.tsx
git diff --cached --stat
git diff --cached
git commit -m "feat(brand): integrar logo oficial ao sistema"
```

### Task 3: Centralizar identidade, temas e contraste

**Files:**
- Modify: `frontend/src/styles/index.css`
- Create: `frontend/src/styles/themeTokens.test.ts`
- Modify: `frontend/src/components/AppLayout.tsx`
- Modify: `frontend/src/components/Header.tsx`
- Modify: `frontend/src/components/Sidebar.tsx`
- Modify: `frontend/src/components/PageContainer.tsx`
- Modify: `frontend/src/components/ThemeToggle.tsx`
- Modify: `frontend/src/components/ConfirmDialog.tsx`

**Interfaces:**
- Consumes: escalas e pares de contraste da especificação.
- Produces: tokens `--brand-*`, `--color-*` e classes `.ui-card`, `.ui-field`, `.ui-button-*`, `.ui-badge-*`, `.brand-mark`.

- [ ] **Step 1: Escrever teste RED de tokens e contraste**

Criar `themeTokens.test.ts` que lê `index.css`, extrai valores por seletor e calcula luminância relativa:

```ts
function contrastRatio(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const channels = hex.match(/[A-F\d]{2}/gi)!.map((value) => Number.parseInt(value, 16) / 255)
      .map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  }
  const a = luminance(foreground)
  const b = luminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}
```

Exigir os tokens institucionais extraídos, texto normal ≥4,5:1, borda/foco ≥3:1 e ausência de `--color-sma-*`.

- [ ] **Step 2: Executar RED**

```powershell
npm test -- --run src/styles/themeTokens.test.ts
```

Expected: falhar porque os novos tokens não existem e os antigos `sma-*` ainda estão presentes.

- [ ] **Step 3: Substituir a camada de tema**

Definir em `index.css` os valores fechados:

```css
@theme {
  --color-brand-primary-950: #092E42;
  --color-brand-primary-800: #0F455F;
  --color-brand-primary-600: #1D617B;
  --color-brand-primary-100: #E6F2F4;
  --color-brand-primary-50: #F7FBFC;
  --color-brand-secondary-700: #3A6F5B;
  --color-brand-secondary-500: #75AC96;
  --color-brand-secondary-100: #E9F2EC;
}

:root {
  --color-background: #F7F7F7;
  --color-surface: #FFFFFF;
  --color-surface-raised: #FFFFFF;
  --color-surface-subtle: #F1F5F7;
  --color-text: #17212B;
  --color-text-muted: #4B5B67;
  --color-border: #758798;
  --color-primary: #0F455F;
  --color-primary-contrast: #FFFFFF;
}

.dark {
  --color-background: #0E1720;
  --color-surface: #15232D;
  --color-surface-raised: #1B2D38;
  --color-surface-subtle: #20333F;
  --color-text: #F2F7FA;
  --color-text-muted: #B9C7D1;
  --color-border: #607787;
  --color-primary: #90C6D7;
  --color-primary-contrast: #0E1720;
}
```

Completar os demais tokens listados na especificação e criar classes reutilizáveis para cards, campos, botões, badges e foco.

- [ ] **Step 4: Migrar o shell para tokens semânticos**

Trocar somente detalhes visuais em AppLayout, Header, Sidebar, PageContainer, ThemeToggle e ConfirmDialog. Manter `DesktopSidebar`, `MobileDrawer`, `w-64`, `lg`, IDs, foco e handlers exatamente funcionais.

- [ ] **Step 5: Executar GREEN e regressões do shell**

```powershell
npm test -- --run src/styles/themeTokens.test.ts src/components/layout.test.tsx src/components/BrandMark.test.tsx
npm run lint
npm run typecheck
npm run build
```

Expected: tokens, contraste, shell, lint, TypeScript e build aprovados.

- [ ] **Step 6: Commit**

```powershell
git add -- frontend/src/styles/index.css frontend/src/styles/themeTokens.test.ts frontend/src/components/AppLayout.tsx frontend/src/components/Header.tsx frontend/src/components/Sidebar.tsx frontend/src/components/PageContainer.tsx frontend/src/components/ThemeToggle.tsx frontend/src/components/ConfirmDialog.tsx
git diff --cached --stat
git diff --cached
git commit -m "refactor(tema): centralizar tokens institucionais"
```

### Task 4: Padronizar os nove estados do calendário

**Files:**
- Modify: `frontend/src/styles/index.css`
- Modify: `frontend/src/styles/themeTokens.test.ts`
- Modify: `frontend/src/features/calendar/presentation.ts`
- Create: `frontend/src/features/calendar/CalendarStateBadge.tsx`
- Modify: `frontend/src/features/calendar/MonthlyCalendar.tsx`
- Modify: `frontend/src/features/calendar/CalendarLegend.tsx`
- Modify: `frontend/src/features/calendar/DayDetails.tsx`
- Modify: `frontend/src/features/calendar/domain.ts`
- Modify: `frontend/src/features/calendar/interface.test.tsx`
- Modify: `frontend/src/features/calendar/domain.test.ts`

**Interfaces:**
- Consumes: `CalendarVisualState` e tabela cromática fechada.
- Produces: `calendarStatePresentation[state] = { label, marker, tone }`, classe `.calendar-state--<tone>` e `<CalendarStateBadge state />`.

- [ ] **Step 1: Escrever testes RED para nove estados e uso consistente**

Exigir em `interface.test.tsx`:

```tsx
const states: DailySummary['visualState'][] = [
  'NO_SCHEDULE', 'NO_ENTRY', 'INCOMPLETE', 'COMPLETE', 'EXCEEDED',
  'VACATION', 'TIME_OFF', 'MEDICAL_LEAVE', 'HOLIDAY',
]

it('aplica o mesmo estado semântico no dia, legenda e detalhe', () => {
  for (const state of states) {
    const summary = day('2026-07-20', state)
    const calendar = renderToStaticMarkup(<MonthlyCalendar monthKey="2026-07" selectedDate={summary.date} days={[summary]} onMonthChange={vi.fn()} onSelectDate={vi.fn()} />)
    const details = renderToStaticMarkup(<DayDetails summary={summary} events={[]} approval={approval} />)
    expect(calendar).toContain(`data-calendar-state="${state}"`)
    expect(details).toContain(`data-calendar-state="${state}"`)
  }
})
```

O teste da legenda deve exigir os nove rótulos, incluindo “Sem jornada prevista”. `themeTokens.test.ts` deve calcular contraste das 54 variáveis claro/escuro.

- [ ] **Step 2: Executar RED**

```powershell
npm test -- --run src/features/calendar/interface.test.tsx src/features/calendar/domain.test.ts src/styles/themeTokens.test.ts
```

Expected: falhar porque DayDetails não exibe estado, `presentation.ts` contém classes cromáticas e os tokens não existem.

- [ ] **Step 3: Criar tokens e catálogo sem cor direta**

Usar em `presentation.ts`:

```ts
export const calendarStatePresentation: Record<CalendarVisualState, { label: string; marker: string; tone: string }> = {
  NO_SCHEDULE: { label: 'Sem jornada prevista', marker: '○', tone: 'no-schedule' },
  NO_ENTRY: { label: 'Sem apontamento', marker: '!', tone: 'no-entry' },
  INCOMPLETE: { label: 'Jornada incompleta', marker: '◷', tone: 'incomplete' },
  COMPLETE: { label: 'Jornada atingida', marker: '✓', tone: 'complete' },
  EXCEEDED: { label: 'Jornada excedida', marker: '+', tone: 'exceeded' },
  VACATION: { label: 'Férias', marker: '▣', tone: 'vacation' },
  TIME_OFF: { label: 'Folga', marker: '↺', tone: 'time-off' },
  MEDICAL_LEAVE: { label: 'Afastamento', marker: '✚', tone: 'medical-leave' },
  HOLIDAY: { label: 'Feriado', marker: '◆', tone: 'holiday' },
}
```

Declarar `surface`, `text` e `border` para cada tom em `:root` e `.dark`, usando exatamente a tabela da especificação. `.calendar-state` consome somente variáveis.

- [ ] **Step 4: Aplicar badge, texto e símbolo**

`CalendarStateBadge` renderiza marcador + rótulo e é usado na legenda e em DayDetails. MonthlyCalendar usa `data-calendar-state`, mantém símbolo visível no mobile, rótulo `sr-only sm:not-sr-only`, título e `aria-label`. Seleção usa `--calendar-selected-ring` e não muda a cor semântica do estado.

- [ ] **Step 5: Remover catálogo duplicado de rótulos**

`getCalendarVisualState` passa a ler `calendarStatePresentation`, eliminando `visualLabels` de `domain.ts` sem alterar a derivação dos estados.

- [ ] **Step 6: Executar GREEN e regressões**

```powershell
npm test -- --run src/features/calendar/interface.test.tsx src/features/calendar/domain.test.ts src/styles/themeTokens.test.ts
npm run lint
npm run typecheck
npm run build
```

Expected: nove estados, contraste, calendário, lint, TypeScript e build aprovados.

- [ ] **Step 7: Commit**

```powershell
git add -- frontend/src/styles/index.css frontend/src/styles/themeTokens.test.ts frontend/src/features/calendar/presentation.ts frontend/src/features/calendar/CalendarStateBadge.tsx frontend/src/features/calendar/MonthlyCalendar.tsx frontend/src/features/calendar/CalendarLegend.tsx frontend/src/features/calendar/DayDetails.tsx frontend/src/features/calendar/domain.ts frontend/src/features/calendar/interface.test.tsx frontend/src/features/calendar/domain.test.ts
git diff --cached --stat
git diff --cached
git commit -m "feat(calendario): padronizar cores semanticas dos estados"
```

### Task 5: Implementar sessão corporativa v2 e política de rotas

**Files:**
- Create: `frontend/src/features/session/types.ts`
- Create: `frontend/src/features/session/routePolicy.ts`
- Create: `frontend/src/features/session/routePolicy.test.ts`
- Modify: `frontend/src/services/demoSessionService.ts`
- Create: `frontend/src/services/demoSessionService.test.ts`
- Modify: `frontend/src/features/session/sessionContext.ts`
- Modify: `frontend/src/features/session/DemoSessionProvider.tsx`
- Modify: `frontend/src/features/session/ProtectedRoute.tsx`
- Modify: `frontend/src/features/session/PublicOnlyRoute.tsx`
- Modify: `frontend/src/components/layout.test.tsx`

**Interfaces:**
- Produces: `DemoRole`, `DemoSession`, `getDemoHomePath(role)`, `canAccessDemoPath(role, path)`, `signIn(role): DemoSession`.
- Preserves: `profile: CollaboratorProfile | null` no contexto para hooks existentes.

- [ ] **Step 1: Escrever testes RED do service**

Cobrir com storage em memória:

```ts
it('invalida v1 uma vez e não cria sessão automaticamente', () => {
  storage.setItem('sma:demo-session:v1', JSON.stringify({ active: true, collaboratorId: 'demo-collaborator-001' }))
  expect(service.restore()).toBeNull()
  expect(storage.getItem('sma:demo-session:v1')).toBeNull()
  expect(storage.getItem('sma:demo-session:migration:v2')).toBe('done')
  expect(service.restore()).toBeNull()
})

it.each(['COLLABORATOR', 'SUPERVISOR', 'DIRECTOR_ADMIN'] as const)('persiste sessão explícita %s', (role) => {
  const created = service.signIn(role)
  expect(created.role).toBe(role)
  expect(service.restore()).toEqual(created)
})
```

Também cobrir JSON inválido, `v2` inválida, `v2` válida, logout, idempotência e preservação de chaves de domínio.

- [ ] **Step 2: Escrever testes RED da política de rotas**

```ts
expect(getDemoHomePath('COLLABORATOR')).toBe('/colaborador')
expect(getDemoHomePath('SUPERVISOR')).toBe('/supervisor')
expect(getDemoHomePath('DIRECTOR_ADMIN')).toBe('/administracao')
expect(canAccessDemoPath('COLLABORATOR', '/supervisor')).toBe(false)
```

- [ ] **Step 3: Executar RED**

```powershell
npm test -- --run src/services/demoSessionService.test.ts src/features/session/routePolicy.test.ts
```

Expected: falhar porque tipos, service `v2` e política não existem.

- [ ] **Step 4: Implementar tipos e service mínimo**

Usar o contrato da especificação e injetar `SessionStorage`/relógio:

```ts
export class LocalDemoSessionService {
  constructor(private storage: SessionStorage = createBrowserSessionStorage(), private now = () => new Date().toISOString()) {}
  restore(): DemoSession | null { /* validar v2; invalidar v1 uma vez; nunca autoentrar */ }
  signIn(role: DemoRole): DemoSession { /* criar v2 explícita */ }
  signOut() { this.storage.removeItem(SESSION_KEY) }
}
```

Somente `COLLABORATOR` fornece `demoCollaborator` em `profile`.

- [ ] **Step 5: Implementar guardas por perfil**

`ProtectedRoute` recebe `allowedRoles: DemoRole[]`; sem sessão redireciona com `pathname + search + hash`; perfil errado redireciona para `getDemoHomePath(session.role)`. `PublicOnlyRoute` usa a mesma função.

- [ ] **Step 6: Executar GREEN e regressões**

```powershell
npm test -- --run src/services/demoSessionService.test.ts src/features/session/routePolicy.test.ts src/components/layout.test.tsx
npm run lint
npm run typecheck
```

Expected: migração, persistência, política, shell, lint e TypeScript aprovados.

- [ ] **Step 7: Commit**

```powershell
git add -- frontend/src/features/session frontend/src/services/demoSessionService.ts frontend/src/services/demoSessionService.test.ts frontend/src/components/layout.test.tsx
git diff --cached --stat
git diff --cached
git commit -m "feat(auth): versionar sessao corporativa por perfil"
```

### Task 6: Criar login, placeholders e rotas por perfil

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`
- Create: `frontend/src/pages/DemoAreaPlaceholderPage.tsx`
- Create: `frontend/src/pages/LoginPage.test.tsx`
- Create: `frontend/src/pages/DemoAreaPlaceholderPage.test.tsx`
- Modify: `frontend/src/app/AppRoutes.tsx`

**Interfaces:**
- Consumes: `signIn(role)`, `getDemoHomePath`, `BrandMark`, `ThemeToggle` e guardas por perfil.
- Produces: `/login`, `/supervisor`, `/administracao` e cards corporativos explícitos.

- [ ] **Step 1: Escrever testes RED de conteúdo**

Renderizar `LoginPage` com `MemoryRouter` e contexto. Exigir:

```ts
for (const label of ['Entrar como Colaborador', 'Entrar como Supervisor', 'Entrar como Diretor/Administração']) {
  expect(markup).toContain(label)
}
expect(markup).toContain('Ambiente de produ??o')
expect(markup).toContain('SM&amp;A — Sistemas Elétricos e Automação')
expect(markup).not.toMatch(/senha|Microsoft Login|Entrar com Microsoft/i)
```

Testar os dois placeholders com nome do perfil, “em desenvolvimento” e “Sair da produ??o”.

- [ ] **Step 2: Executar RED**

```powershell
npm test -- --run src/pages/LoginPage.test.tsx src/pages/DemoAreaPlaceholderPage.test.tsx
```

Expected: falhar porque login tem apenas um perfil e o placeholder não existe.

- [ ] **Step 3: Implementar login responsivo**

Usar uma lista tipada de cards e um único BrandMark. Cada botão chama `signIn(role)` e navega para a rota permitida; `state.from` só é usado quando `canAccessDemoPath(role, from)` for verdadeiro.

- [ ] **Step 4: Implementar placeholders honestos**

`DemoAreaPlaceholderPage` recebe `role`, usa `session.name`, identidade/tokens e logout que limpa a sessão e navega para `/login`. Não renderiza menus ou dados funcionais falsos.

- [ ] **Step 5: Configurar rotas**

```tsx
<Route path="/colaborador" element={<ProtectedRoute allowedRoles={['COLLABORATOR']}><AppLayout /></ProtectedRoute>}>…</Route>
<Route path="/supervisor" element={<ProtectedRoute allowedRoles={['SUPERVISOR']}><DemoAreaPlaceholderPage role="SUPERVISOR" /></ProtectedRoute>} />
<Route path="/administracao" element={<ProtectedRoute allowedRoles={['DIRECTOR_ADMIN']}><DemoAreaPlaceholderPage role="DIRECTOR_ADMIN" /></ProtectedRoute>} />
```

- [ ] **Step 6: Executar GREEN, suíte relacionada e build**

```powershell
npm test -- --run src/pages/LoginPage.test.tsx src/pages/DemoAreaPlaceholderPage.test.tsx src/services/demoSessionService.test.ts src/features/session/routePolicy.test.ts
npm run lint
npm run typecheck
npm run build
```

Expected: conteúdo, sessão, rotas, lint, TypeScript e build aprovados.

- [ ] **Step 7: Commit**

```powershell
git add -- frontend/src/pages/LoginPage.tsx frontend/src/pages/LoginPage.test.tsx frontend/src/pages/DemoAreaPlaceholderPage.tsx frontend/src/pages/DemoAreaPlaceholderPage.test.tsx frontend/src/app/AppRoutes.tsx
git diff --cached --stat
git diff --cached
git commit -m "feat(auth): criar login corporativo por perfil"
```

### Task 7: Remover atalhos e aplicar padrões visuais às páginas

**Files:**
- Modify: `frontend/src/pages/ColaboradorPage.tsx`
- Create: `frontend/src/pages/ColaboradorPage.test.tsx`
- Modify: arquivos `.tsx` de `frontend/src/pages`, `frontend/src/features` e `frontend/src/components` que usam cores estruturais antigas.
- Modify: `frontend/src/styles/index.css`
- Modify: `frontend/README.md`

**Interfaces:**
- Consumes: classes `.ui-*`, escala `ui-*`, tokens brand e componentes existentes.
- Produces: páginas claras/escuras consistentes sem alterar campos, handlers, dados ou regras.

- [ ] **Step 1: Escrever teste RED dos atalhos**

Renderizar `ColaboradorPage` com `MemoryRouter` e sessão Colaborador. Exigir ausência da faixa:

```ts
expect(markup).not.toContain('Consultar histórico')
expect(markup).not.toContain('Minhas folgas')
expect(markup).not.toContain('data-dashboard-shortcuts')
expect(markup).toContain('Carregando visão geral')
```

O teste de layout continua exigindo os links equivalentes na sidebar.

- [ ] **Step 2: Executar RED**

```powershell
npm test -- --run src/pages/ColaboradorPage.test.tsx src/components/layout.test.tsx
```

Expected: falhar porque os três atalhos ainda são renderizados.

- [ ] **Step 3: Remover faixa e imports sem uso**

Remover `Link` e o grid de três atalhos. O primeiro filho do fluxo após o cabeçalho passa a ser loading/erro ou `BalancePeriodFilter`, sem wrapper vazio.

- [ ] **Step 4: Migrar cores estruturais**

Substituir utilitários institucionais legados `sma-*` por `brand-*` e neutros estruturais por tokens/classes `ui-*`. Revisar Visão geral, Novo apontamento, Histórico, Folgas e Perfil, seus cards, filtros, formulários, ações e badges. Manter utilitários `red`, `amber`, `emerald`, `blue`, `violet`, `pink` e equivalentes somente quando expressarem estados funcionais não pertencentes à marca.

- [ ] **Step 5: Atualizar README**

Registrar três perfis, rotas, sessão `v2`, migração que não apaga dados e comandos existentes. Não prometer autenticação real.

- [ ] **Step 6: Executar GREEN e suíte completa do checkpoint**

```powershell
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

Expected: toda a suíte e verificações aprovadas.

- [ ] **Step 7: Auditar cores remanescentes**

```powershell
rg -n --pcre2 "#[0-9A-Fa-f]{3,8}|rgba?\(|hsla?\(" frontend/src --glob '!styles/index.css'
rg -n "sma-navy|sma-green|bg-black|text-black" frontend/src
```

Expected: nenhum literal fora de `index.css`, nenhum token institucional legado e preto estrutural ausente.

- [ ] **Step 8: Commit**

```powershell
git add -- frontend/src frontend/README.md
git diff --cached --stat
git diff --cached
git commit -m "feat(tema): aplicar identidade nas areas corporativas"
```

### Task 8: Validar visualmente e corrigir regressões

**Files:** Modify only an affected file after reproducing a defect and adding its regression test.

**Interfaces:**
- Consumes: aplicação completa da rodada.
- Produces: capturas temporárias fora do Git e evidências de console, contraste, layout e comportamento.

- [ ] **Step 1: Iniciar o frontend**

```powershell
npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
```

- [ ] **Step 2: Validar login**

Capturar login claro desktop, login escuro desktop e login mobile. Verificar logo, três cards, tema, ausência de senha/Microsoft e overflow.

- [ ] **Step 3: Validar cada perfil**

Entrar como Colaborador, Supervisor e Diretor/Administração; testar redirecionamento de rota errada, persistência após recarga e logout preservando dados funcionais.

- [ ] **Step 4: Validar área do Colaborador**

Capturar Visão geral clara/escura, header, sidebar clara/escura, Novo apontamento, Histórico, Folgas, Perfil, calendário claro/escuro e drawer mobile. Confirmar atalhos ausentes, sidebar 256 px, breakpoint 1024 px, drawer, Escape, foco, links ativos e ausência de overflow.

- [ ] **Step 5: Validar os nove estados**

Inspecionar calendário, legenda e DayDetails nos dois temas. Registrar `getComputedStyle` de fundo/texto/borda e confirmar os mesmos tokens, texto, símbolo e contraste calculado.

- [ ] **Step 6: Inspecionar console**

Expected: zero erros e nenhum warning relevante introduzido.

- [ ] **Step 7: Corrigir somente defeitos reproduzidos**

Para cada defeito: escrever teste RED, confirmar falha, aplicar correção mínima, executar GREEN e criar no máximo um commit consolidado:

```powershell
git commit -m "fix(frontend): concluir revisao visual e responsiva"
```

Não criar commit se nenhuma correção for necessária.

### Task 9: Revisão final, arquivos protegidos e push

**Files:** Verify only.

**Interfaces:**
- Consumes: todos os commits lógicos.
- Produces: branch verificada, limpa, publicada e sincronizada.

- [ ] **Step 1: Executar verificação fresca completa**

```powershell
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

- [ ] **Step 2: Auditar segredos, gerados e cores**

```powershell
git status --short --branch
git ls-files | rg "(^|/)(node_modules|dist)/|\.env$"
git show --format= --name-only HEAD~8..HEAD
rg -n -i "password|secret|api[_-]?key|token|BEGIN .*PRIVATE KEY|ghp_|github_pat_" frontend/src docs/superpowers
```

Resultados devem distinguir textos que dizem “sem senha/token” de credenciais reais; nenhum segredo ou artefato gerado pode estar tracked.

- [ ] **Step 3: Confirmar arquivos protegidos**

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath 'SMA_banco de horas 2.html','frontend/package.json','frontend/package-lock.json'
git diff 53b77ec -- frontend/package.json frontend/package-lock.json 'SMA_banco de horas 2.html'
```

Expected: hashes iguais à linha de base e diff vazio.

- [ ] **Step 4: Revisar commits e staged/working tree**

```powershell
git status --short --branch
git log --oneline 53b77ec..HEAD
git diff --check 53b77ec..HEAD
```

- [ ] **Step 5: Aplicar revisão ampla e finishing skill**

Usar `superpowers:requesting-code-review`, corrigir achados Critical/Important com teste e então `superpowers:finishing-a-development-branch`. A decisão previamente autorizada é manter esta branch e fazer push sem PR/merge.

- [ ] **Step 6: Push e confirmação**

```powershell
git push origin refactor/frontend-colaborador
git fetch origin
git rev-parse HEAD
git rev-parse origin/refactor/frontend-colaborador
git rev-list --left-right --count origin/refactor/frontend-colaborador...HEAD
git status --short --branch
```

Expected: hashes idênticos, divergência `0 0` e árvore limpa.
