# Especificação de design — Rodada corretiva da interface do Colaborador

## Contexto e objetivo

Esta é a fonte de verdade para a rodada corretiva de 20 de julho de 2026 na branch `refactor/frontend-colaborador`. A base React será corrigida de forma incremental, sem reconstrução, novas dependências, backend ou ampliação da autenticação.

A linha de base foi confirmada antes das alterações: árvore limpa, branch sincronizada em `0/0` com `origin/refactor/frontend-colaborador`, 117 testes em 21 arquivos, lint, TypeScript e build aprovados. O HTML legado apresentou SHA-256 `5CBA2AE824DA4349C818888F8CFB2B17A74CCD7B5EBF1489E92DCF2182A1182F`.

## Diagnóstico e resultado esperado

| Problema | Causa confirmada | Resultado aprovado |
|---|---|---|
| Shell desalinhado | `AppLayout` mistura posicionamentos `fixed`/`sticky`; a sidebar não apresenta o resumo profissional exigido. | Header global, sidebar real no desktop, conteúdo flexível e centralizado, drawer sobreposto no mobile. |
| Datas adjacentes | `getMonthGridDates` gera sempre 42 datas reais e o componente cria botão para todas. | Placeholders inertes antes/depois do mês; somente os dias reais são visíveis e selecionáveis. |
| Ação duplicada | `DailyEntryList` cria um terceiro link “Novo apontamento”. | Manter a ação superior e a navegação da sidebar; lista diária só apresenta conteúdo/estado vazio. |
| Catálogo incompleto | `demoActivities` possui seis itens. | Vinte atividades aprovadas, exatamente na ordem definida, sem eventos administrativos. |
| Projeção futura | `PeriodSummary`, dashboard e histórico apresentam saldo hipotético. | Somente saldo real até hoje; futuro não gera déficit e recebe nota discreta quando necessário. |
| Evento integral incoerente | A jornada é zerada, mas trabalho conflitante ainda produz extras/saldo; o formulário só consulta aprovação. | Evento integral neutraliza o resumo, preserva o registro para auditoria, sinaliza conflito e bloqueia novos lançamentos. |
| Aviso técnico | `MonthlyCalendar` expõe “provider corporativo e determinístico”. | Linguagem clara de calendário corporativo, sem alegar fonte oficial. |
| Situação ambígua | Valor vazio significa “Ativos e cancelados”. | “Situação do apontamento”: Somente ativos (padrão), Somente cancelados e Todos. |
| Edição discreta | A versão aparece apenas em rodapé. | Badge textual “Editado” para versão maior que 1 e detalhe com data/hora/versão. |
| Marca duplicada | “SM&A” está escrito diretamente em múltiplos componentes. | `BrandMark` reutilizável com fallback atual, sem logo ou paleta fictícia. |
| Acesso corporativo | `/login` já sustenta a revisão local. | Preservar o acesso existente sem criar autenticação, perfil ou rota nova. |

## App Shell e navegação

- O `Header` ocupa toda a largura e contém marca compacta, botão do drawer, contexto compacto e tema.
- No breakpoint `lg` existente, a `Sidebar` participa do fluxo ao lado da área principal, abaixo do header, sem margem/offset duplicado.
- A sidebar apresenta iniciais, nome, cargo, squad ativa, Visão geral, Novo apontamento, Histórico, Folgas e Perfil.
- A saída corporativa já funcional é preservada; não se cria novo fluxo de login.
- A área principal usa `min-width: 0`, largura integral e controle de overflow; `PageContainer` centraliza o conteúdo somente dentro da coluna disponível.
- No mobile, o drawer abre pelo header, fecha ao navegar, por Escape e pelo backdrop. O foco entra no drawer, fica contido enquanto aberto e retorna ao acionador ao fechar. A rolagem vertical permanece possível.

## Calendário mensal

`getMonthGridCells(monthKey)` passa a distinguir preenchimento e data real:

```ts
type MonthGridCell =
  | { kind: 'placeholder'; key: string }
  | { kind: 'day'; key: string; date: string }
```

- A semana permanece de segunda a domingo.
- Só existem placeholders necessários para completar a primeira e a última semana usada; não há seis semanas fixas.
- Placeholder é não interativo, `aria-hidden="true"`, sem número, data, status, evento, tooltip, foco ou handler.
- Datas reais, inclusive fins de semana, mantêm mouse, teclado, nomes acessíveis e navegação mensal.
- Placeholders não participam de consultas, cálculos ou filtros.

## Catálogo de atividades

O catálogo de criação continua corporativo, centralizado em `src/mocks/demoData.ts`, e contém exatamente:

1. Análise de documento
2. Apoio a colaborador
3. Apoio propostas
4. Apontamento de projeto — acompanhamento
5. ASO — mobilização
6. Atendimento de comentários do cliente
7. Atendimento de comentários internos
8. Elaboração de projeto
9. Emissão de documento
10. Gerenciamento e cronograma
11. Levantamento de campo
12. Levantamento de dados para início de atividade
13. Modelo 3D
14. Ociosidade
15. Ociosidade por TI
16. Reunião com cliente
17. Reunião interna
18. Treinamentos
19. Verificação de documento
20. Outros

O detalhamento permanece obrigatório. Férias, Afastamentos médicos, Feriado/emenda e Folga compensação de horas não são selecionáveis. Registros históricos com IDs/nomes legados continuam legíveis por fallback e não são migrados nem apagados; a restrição vale para novos comandos.

## Saldo real e datas futuras

- “Projeção futura” deixa de existir em cards, histórico, filtros, resumos, tooltips e detalhes do Colaborador.
- `calculatePeriodSummary` agrega somente até `min(endDate, today)`, portanto o futuro não acrescenta jornada, falta ou saldo.
- `PeriodSummary.hasFutureDates` permite informar: “Datas futuras não são consideradas no saldo real.”
- `projectedBalanceMinutes` deixa de integrar o contrato consumido pela interface do Colaborador.

## Eventos integrais e conflitos

Precedência diária:

1. feriado, férias ou afastamento integral neutralizam jornada e saldo;
2. afastamento parcial reduz a jornada pelos minutos justificados, até zero;
3. folga aprovada mantém a regra atual de compensação;
4. apontamentos ativos contam somente sem neutralizador integral;
5. apontamentos cancelados nunca contam.

Se um registro histórico ativo coexistir com evento integral, ele é preservado no `localStorage`, mas o resumo consolidado usa zero para trabalho, normal, extra, falta e saldo. `hasIntegralEventConflict` identifica a inconsistência; a UI a explica e deixa o registro somente leitura até futura resolução pelo Supervisor.

Novos lançamentos consultam eventos profissionais e feriados antes da persistência. A política pura retorna `{ blocked: false }` ou `{ blocked: true, message }` e utiliza:

- “Esta data está coberta por férias integrais e não permite apontamentos.”
- “Esta data está coberta por afastamento integral e não permite apontamentos.”
- “Esta data é um feriado integral e não exige apontamento.”

Afastamento parcial não bloqueia. Aprovação/competência permanece uma política independente. Nenhuma fixture ou entrada persistida arbitrária é apagada.

## Histórico, cancelamento e revisão

- O filtro usa `ACTIVE | CANCELLED | ALL`, inicia em `ACTIVE` e traduz `ALL` para ausência de filtro somente na chamada do service.
- Aplicar filtros sempre reinicia cursor e histórico de paginação.
- Cancelado tem badge textual e diferenciação com contraste, mas nenhuma ação: Editar, Duplicar, Cancelar e Concluir correção ficam ausentes.
- Cancelados seguem preservados para auditoria e fora dos saldos.
- `EntryRevisionBadge` aparece em lista diária e histórico quando `version > 1`.
- O detalhe apresenta `Editado em <data> às <hora> · Versão <n>` se `updatedAt` for válido. Sem timestamp válido, mostra somente a versão e não inventa data.
- Edição preserva `createdAt`, incrementa versão, atualiza `updatedAt`, mantém auditoria e não altera aprovação.

## Feriados, marca e temas

O modelo já distingue origem `DEMO`/`OFFICIAL`; somente `DEMO` é usado. A interface apresenta:

> Calendário de produ??o: os feriados nacionais, estaduais e municipais ainda não estão integrados a uma fonte oficial.

`BrandMark` aceita variante compacta/completa, texto alternativo e futura origem de imagem/SVG, mas nesta rodada usa apenas o fallback “SM&A”. Header, sidebar e acesso corporativo reutilizam o componente. Não se cria imagem, SVG, logo ou nova paleta. Tokens dos componentes afetados ficam centralizados em `styles/index.css`; tema claro/escuro e seletor permanecem operacionais.

## Persistência

Não é necessária nova migração. Permanecem `sma:time-entries:v3`, migração idempotente de `v2`, backup `v2`, IDs, snapshots, auditoria, versão e cancelamento lógico. O catálogo ampliado não reescreve atividades históricas. Conflitos são tratados no domínio de leitura e na política de ações.

## Acessibilidade, testes e aceite

- Drawer responde a teclado/backdrop/navegação, controla foco e não cria overflow.
- Datas reais têm nomes acessíveis; placeholders são ignorados por teclado e leitor de tela.
- Estado não depende só de cor; “Editado”, “Cancelado” e conflito integral são textuais.
- Aviso de feriados usa papel de nota e contraste nos dois temas.
- Testes de domínio cobrem grade, corte em hoje, neutralização, conflito, parcial e bloqueios.
- Testes de componentes cobrem shell, ação duplicada, catálogo, aviso, ausência de projeção, filtro, badges e marca.
- Revisão visual cobre as cinco páginas, claro/escuro, 1920/1440/1024/390 px, drawer, calendário e console.
- Aceite exige suíte, lint, TypeScript, build e `git diff --check` aprovados, HTML e manifests preservados, árvore limpa e push somente da branch requerida.

## Fora do escopo

- nova rota/tela de login, autenticação real, Microsoft Entra ID, credenciais ou seleção de perfil;
- Supervisor, Diretor, Administração, homologação e gestão de usuários/squads;
- backend, banco, fonte oficial de feriados, exportação, relatórios e importação LD;
- logo oficial, imagem gerada ou nova paleta corporativa;
- exclusão física, limpeza global do `localStorage` ou migração sem necessidade;
- nova branch, merge/rebase da `main`, pull request ou force push.
