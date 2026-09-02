# Plano de implementação — Área do Colaborador

## 1. Objetivo e limites

Este plano distribui a área do Colaborador na estrutura React atual, organiza entregas pequenas e registra a primeira fatia já implementada. As demais fatias continuam como planejamento.

Ficam expressamente fora deste plano detalhado: Supervisor, Diretor, homologação, gestão corporativa, backend, banco de dados, autenticação real, JWT e SSO. Pontos de integração futura são apenas preservados como contratos.

## 2. Diretrizes arquiteturais

- Organizar por domínio/feature, não por uma página monolítica.
- Manter componentes visuais genéricos em `src/components` e lógica de negócio nas features.
- Centralizar regras de jornada, aplicabilidade e saldo em funções puras testáveis.
- Colocar acesso a dados atrás de services assíncronos com interfaces; mocks/local storage são adaptadores temporários.
- Separar `TimeEntry`, `CalendarEvent` e `DailySummary`; eventos de ausência e compensação não são apontamentos de trabalho.
- Armazenar duração em minutos e data civil em formato ISO.
- Derivar o dono da sessão; nunca receber seleção livre de colaborador.
- Separar estado remoto/cache, estado de formulário e estado de navegação/filtros.
- Preparar paginação e filtros no contrato, mesmo que o primeiro adaptador use mocks.
- Não adicionar dependência sem necessidade aprovada em etapa própria.

## 3. Organização modular sugerida

Estrutura conceitual sob `frontend/src/features/`:

```text
features/
├── auth/
├── collaborator/
├── profile/
├── timeEntries/
├── workSchedules/
├── calendar/
├── clients/
├── projects/
├── projectDocuments/
├── activities/
├── disciplines/
├── squadSummary/
└── reports/
```

Não é necessário criar todas as pastas de uma vez. Cada etapa cria somente o módulo que efetivamente utiliza.

### 3.1 Módulos da fase do Colaborador

| Módulo | Responsabilidade | Componentes principais sugeridos | Hooks | Services | Tipos/utilitários | Dependências |
|---|---|---|---|---|---|---|
| `auth` | Sessão corporativa e contexto do usuário atual. | `DemoLogin`, `SessionGuard`, `CurrentUserBadge`. | `useSession`. | `demoSessionService`. | `Session`, `SessionUser`. | `profile`; roteamento. |
| `profile` | Perfil profissional somente leitura e referência da jornada. | `ProfileSummary`, `WorkProfileCard`. | `useProfile`. | `profileService`. | `ProfessionalProfile`, vigência. | `auth`, `workSchedules`. |
| `collaborator` | Composição do dashboard e navegação da área individual. | `CollaboratorDashboard`, cards de resumo e atenção. | `useCollaboratorDashboard`. | `collaboratorSummaryService`. | `DashboardSummary`. | sessão, jornada, apontamentos, calendário. |
| `timeEntries` | Criar, validar, listar, editar, duplicar e cancelar apontamentos. | `TimeEntryForm`, `TimeEntryFields`, `DurationInput`, `TimeEntryTable`, `EntryActions`, `EntryDetails`. | `useTimeEntryForm`, `useTimeEntries`, `useEntryActions`. | `timeEntryService`, adaptador local. | `TimeEntry`, comandos, filtros, paginação, validadores e formatadores. | sessão, catálogos, jornada. |
| `workSchedules` | Jornada vigente, dias previstos, eventos e cálculos de saldo. | `ScheduleSummary`, `DailyBalance`, `MonthlyBalance`. | `useWorkSchedule`, `useBalancePreview`. | `workScheduleService`. | `WorkSchedule`, `DailyWorkContext`, funções puras em minutos. | perfil, calendário de feriados, apontamentos. |
| `calendar` | Calendário mensal individual e estados acessíveis por dia. | `MonthlyCalendar`, `CalendarDay`, `CalendarLegend`, `DayDetails`. | `useCalendarMonth`. | `calendarSummaryService`. | `CalendarDaySummary`, formatação de datas. | jornada, eventos, apontamentos. |
| `clients` | Catálogo de clientes visíveis ao Colaborador. Na primeira fatia é independente do número do projeto. | `ClientSelect`. | `useClients`. | `clientService`. | `Client`, filtros. | sessão. |
| `projects` | Futuro catálogo oficial de projetos e referência estável. Não existe na primeira fatia. | `ProjectSelect`, `ProjectSummary`. | `useProjects`. | `projectService`. | `Project`, `ProjectCapabilities`. | backend, cliente, sessão. |
| `projectDocuments` | Documentos da LD e tipos documentais aplicáveis. | `DocumentTypeSelect`, `ProjectDocumentSelect`, `DocumentPreview`. | `useProjectDocuments`. | `projectDocumentService`. | `ProjectDocument`, `DocumentType`. | projeto. |
| `activities` | Catálogo tipado e matriz de campos aplicáveis. | `ActivitySelect`. | `useActivities`. | `activityService`. | `Activity`, `ActivityCategory`, `FieldApplicability`. | projeto e regras do formulário. |
| `disciplines` | Catálogo de disciplinas aplicáveis. | `DisciplineSelect`. | `useDisciplines`. | `disciplineService`. | `Discipline`. | projeto, atividade. |
| `reports` | Exportação individual por período/filtros. | `PersonalExportDialog`, `ExportButton`. | `usePersonalExport`. | `personalReportService`. | `PersonalExportRequest`, colunas e formatadores. | sessão e filtros de apontamentos. |
| `squadSummary` | Exibir somente métricas agregadas e anonimizadas da squad. | `SquadAggregateCard`. | `useSquadAggregate`. | `squadAggregateService`. | `SquadAggregate`, regras de supressão. | sessão/vínculo; contrato agregado futuro. |

### 3.2 Módulos que não pertencem a esta fase

- gestão de usuários e squads;
- administração/importação de projetos e LD;
- homologação;
- relatório geral da equipe;
- exportação corporativa;
- auditoria corporativa.

Esses itens são **Fora do escopo da fase do Colaborador** e não devem ser antecipados em componentes ou rotas.

## 4. Contratos transversais recomendados

### 4.1 Services

Services devem expor operações orientadas ao usuário atual e período, por exemplo:

- `listTimeEntries({ from, to, filters, cursor, pageSize })`;
- `getCalendarSummary({ year, month })`;
- `getDashboardSummary({ from, to })`;
- `createTimeEntry(command)` sem `collaboratorId` editável;
- `updateTimeEntry(id, version, command, reason)`;
- `duplicateTimeEntry(id, overrides)`;
- `cancelTimeEntry(id, version, reason)`;
- `exportPersonalEntries({ from, to, filters })`.

O adaptador local pode obter o ID da sessão internamente. O contrato futuro de API deverá impor a mesma autorização.

### 4.2 Regras puras

Utilitários de domínio, sem React ou armazenamento:

- conversão/validação de minutos;
- jornada vigente por data;
- aplicabilidade de campos;
- resumo diário;
- alocação normal/extra;
- redução por férias/afastamento/feriado/folga;
- saldo diário e mensal;
- estado acessível do calendário;
- validação de comandos de criação/edição/cancelamento.

### 4.3 Estado

- sessão e tema: contexto global pequeno;
- formulário: estado local da rota de apontamento;
- filtros: URL/query string quando compartilháveis;
- dados: hook/service por consulta e período;
- derivados: funções puras/memoização baseada em conjuntos limitados;
- persistência temporária: adaptador versionado, nunca acesso direto espalhado a `localStorage`.

## 5. Estratégia por fatias verticais

A implementação passa a ser organizada por fluxos completos, cada um atravessando domínio, service, persistência, interface e testes:

1. **Fatia 1 — sessão e apontamento diário básico (implementada):** sessão corporativa, perfil, jornada semanal, clientes e atividades simulados, número do projeto digitado, criação persistida localmente, dashboard e resumo diário.
2. **Fatia 2 — histórico e ciclo de vida:** histórico paginado, edição versionada, duplicação, cancelamento lógico e motivos; rascunho persistido continua sujeito a decisão.
3. **Fatia 3 — calendário e eventos:** calendário mensal e `CalendarEvent` para feriados, férias, afastamentos, folgas, compensações e exceções de jornada.
4. **Fatia 4 — contexto técnico do projeto:** disciplina, tipo de documento, documentos da LD e percentual de avanço, sem antecipar administração/importação.
5. **Fatia 5 — exportação individual:** exportação limitada ao usuário e período/filtros.
6. **Fatia 6 — acessibilidade, escala e qualidade:** paginação real, desempenho, cobertura de testes e refinamentos transversais.

Visão agregada da squad, homologação, Supervisor, Diretor e integrações definitivas permanecem fora da sequência do Colaborador desta fase.

### Referência de capacidades internas

Os blocos abaixo descrevem capacidades e dependências técnicas, não uma ordem de entregas horizontais.

#### Capacidade — Sessão corporativa e perfil

**Objetivo:** retirar conceitualmente a seleção livre de colaborador e estabelecer um único usuário atual com perfil/jornada visíveis.

**Dependências:** rotas e layout existentes.

**Entregáveis:** tipos de sessão/perfil, provider corporativo, guard de rotas, mock de um usuário, perfil somente leitura.

**Critérios de conclusão:** todas as rotas conhecem o mesmo usuário; nenhuma UI permite escolher colega; jornada não depende de nome.

**Riscos:** confundir sessão corporativa com segurança real; persistir dados entre usuários de teste.

**Não fazer:** autenticação real, Firebase, JWT, SSO, gestão de usuários.

#### Capacidade — Tipos e modelo funcional

**Objetivo:** representar apontamento, resumo diário, status, perfil, jornada, eventos futuros e paginação com tipos explícitos.

**Dependências:** decisões mínimas de campos e enums.

**Entregáveis:** tipos discriminados, comandos, filtros, respostas paginadas, fixtures válidas/inválidas.

**Critérios de conclusão:** não existem strings mágicas para atividades especiais; normal/extra é derivado no resumo e não persistido no apontamento; duração usa minutos.

**Riscos:** cristalizar regras ainda não decididas; tipos excessivamente acoplados à UI.

**Não fazer:** telas, persistência definitiva ou status de homologação detalhado.

#### Capacidade — Mocks e camada de services

**Objetivo:** isolar acesso a dados e oferecer persistência temporária substituível.

**Dependências:** tipos e sessão.

**Entregáveis:** interfaces de services, fixtures, adaptadores em memória/local versionados, isolamento por usuário, paginação simulada.

**Critérios de conclusão:** componentes não acessam `localStorage` diretamente; consultas exigem período e retornam só o usuário atual.

**Riscos:** mocks criarem comportamento impossível para API futura; migração de schema local.

**Não fazer:** backend, banco, listener global ou coleção pública.

#### Capacidade — Dashboard individual

**Objetivo:** exibir visão limitada do período do Colaborador.

**Dependências:** sessão, perfil e services de resumo.

**Entregáveis:** cards de previsto, apontado, normal, extra, faltante, saldo provisório e dias de atenção.

**Critérios de conclusão:** dados são do usuário atual e de período delimitado; nenhum colega aparece.

**Riscos:** rotular soma apontada como saldo; cálculos duplicados entre cards.

**Não fazer:** dashboard de Supervisor/Diretor ou agregação corporativa.

#### Capacidade — Regras de jornada e saldo

**Objetivo:** centralizar cálculos em minutos para jornadas de 4h, 6h, 8h e configurações futuras.

**Dependências:** perfil, modelo de eventos e decisões de negócio prioritárias.

**Entregáveis:** funções puras, casos de teste, resumo diário/mensal e indicador provisório.

**Critérios de conclusão:** cobrir dia comum, fim de semana, feriado, férias, afastamento, folga, normal e extra; saldo é somente leitura.

**Riscos:** política incompleta de compensação/feriados; divergência futura com backend.

**Não fazer:** autorização de extra ou homologação.

#### Capacidade — Calendário individual

**Objetivo:** apresentar a situação diária e permitir seleção de data com acessibilidade.

**Dependências:** resumos de jornada e apontamentos por mês.

**Entregáveis:** calendário, célula diária, legenda textual/ícones, detalhes e navegação por teclado.

**Critérios de conclusão:** não depender apenas de cores; estados combinados são legíveis; consulta limitada a um mês.

**Riscos:** excesso de cálculos por célula; contraste e foco inadequados.

**Não fazer:** calendário de colegas ou gestão de escala.

#### Capacidade — Formulário de apontamento

**Objetivo:** criar apontamento ativo do próprio Colaborador; rascunho persistido é posterior.

**Dependências:** tipos, sessão, services e regras de aplicabilidade.

**Entregáveis:** data, duração, cliente/projeto/atividade, detalhes, disciplina, documento, avanço e observação; prévia diária.

**Critérios de conclusão:** campos aparecem conforme cenário; validações são tipadas; `collaboratorId` não é editável; nenhum valor sentinela `-` é salvo.

**Riscos:** formulário grande/monolítico; perda de dados ainda não enviados na navegação.

**Não fazer:** aprovação, cadastro administrativo ou regra definitiva apenas no frontend.

#### Capacidade — Clientes, projetos, atividades e documentos

**Objetivo:** desacoplar catálogos e dependências do formulário.

**Dependências:** services e matriz de aplicabilidade.

**Entregáveis:** seletores reutilizáveis, carregamento/erro/vazio, projetos com capacidades e documentos por projeto.

**Critérios de conclusão:** projeto possui ID/código/nome; fixos são configuração; opções dependentes são reiniciadas com segurança.

**Riscos:** cascatas de requisições e estado obsoleto; catálogos hardcoded virarem regra.

**Não fazer:** importação de LD ou exclusão/cadastro administrativo de projeto.

#### Capacidade — Histórico e filtros paginados

**Objetivo:** consultar apenas o histórico individual por período.

**Dependências:** services paginados e modelo completo.

**Entregáveis:** tabela/detalhe responsivo, filtros, URL de consulta, paginação por cursor e estados de carregamento.

**Critérios de conclusão:** não carregar tudo; filtros preservam período; colunas funcionais estão disponíveis; cancelados podem ser consultados.

**Riscos:** filtros locais divergirem da API futura; tabela inacessível no mobile.

**Não fazer:** relatório geral da equipe ou acesso a colegas.

#### Capacidade — Edição, duplicação e cancelamento

**Objetivo:** gerenciar o ciclo de vida sem perda histórica.

**Dependências:** histórico, versão e services de comando.

**Entregáveis:** edição com motivo, controle de versão, duplicação futura e cancelamento lógico com status `CANCELLED`.

**Critérios de conclusão:** `id`/`createdAt` preservados na edição; versão incrementada; cancelado sai dos totais; duplicado recebe novo ID.

**Riscos:** conflito de edição; totais não invalidados; motivo insuficiente.

**Não fazer:** restrições pós-homologação — serão definidas com Supervisor.

#### Capacidade — Exportação individual

**Objetivo:** exportar os próprios registros de um período/filtro explícito.

**Dependências:** histórico, filtros e contrato de relatório.

**Entregáveis:** seleção de período/formato, colunas definidas, tratamento de volume e feedback de geração.

**Critérios de conclusão:** arquivo não contém colegas; período e filtros são identificáveis; cancelados seguem opção clara.

**Riscos:** geração síncrona grande bloquear UI; fórmulas/injeção em planilhas; formatos inconsistentes.

**Não fazer:** exportação da equipe/empresa.

#### Capacidade — Responsividade e acessibilidade

**Objetivo:** concluir a experiência transversal. A visão agregada da squad foi adiada.

**Dependências:** principais fluxos funcionais e regra de anonimização.

**Entregáveis:** navegação por teclado, foco, labels, contraste, leitores de tela e mobile.

**Critérios de conclusão:** fluxo utilizável sem mouse e sem depender de cor.

**Riscos:** acessibilidade tratada apenas no fim.

**Não fazer:** visão individual ou agregada de squad, gestão ou drill-down nesta fase.

#### Capacidade — Testes e endurecimento

**Objetivo:** cobrir domínio e fluxos críticos antes de integração futura.

**Dependências:** módulos estabilizados.

**Entregáveis:** testes unitários de minutos/jornada/saldo, integração de services/forms, rotas, acessibilidade, grandes páginas mockadas e cenários de erro.

**Critérios de conclusão:** casos de 4h/6h/8h, feriado, fim de semana, férias, afastamento, folga, extra, edição, duplicação, cancelamento e paginação aprovados.

**Riscos:** testes acoplados a implementação; ausência de massa realista.

**Não fazer:** usar testes do frontend como substituto de validação autoritativa futura no backend.

## 6. Preparação para aproximadamente 400 usuários

### 6.1 Requisitos de dados

- Toda consulta de apontamento deve ser delimitada pelo usuário atual e período.
- Histórico deve usar paginação por cursor/token e `pageSize` limitado.
- Filtros devem fazer parte do contrato do service para futuro processamento na API.
- Dashboard e calendário devem solicitar resumos do período, não o histórico completo.
- Não criar listener em tempo real sobre registros corporativos; se atualização em tempo real for necessária, limitar por usuário e janela.
- Cache local deve ter chave por usuário, período e versão do schema.
- Cancelar/deduplicar requisições ao trocar rapidamente período/filtros.
- Respostas devem diferenciar dados, totais e cursor sem exigir reprocessamento global.

### 6.2 Requisitos de renderização

- Evitar `filter`/`reduce` repetidos sobre coleções grandes durante cada render.
- Calcular resumos em selectors/funções puras sobre o conjunto do período.
- Paginar antes de considerar virtualização.
- Manter chaves estáveis, componentes de célula pequenos e estados de loading localizados.
- Executar exportações grandes de forma assíncrona ou delegá-las futuramente ao backend.

### 6.3 Privacidade na escala

- Nunca transportar dados individuais de colegas para “ocultá-los” no frontend.
- O agregado de squad deve vir já agregado, sem IDs ou nomes.
- Aplicar limiar mínimo e supressão de grupos pequenos.
- Evitar filtros combináveis que reduzam um agregado a uma pessoa.
- Não registrar detalhes de apontamentos em telemetria de frontend.

## 7. Dependências e decisões entre etapas

```text
Sessão/perfil
  └─> tipos/modelo
       └─> services/mocks
            ├─> jornada e saldo ─> dashboard ─> calendário
            ├─> catálogos ──────> formulário
            └─> histórico ──────> edição/duplicação/cancelamento ─> exportação

Responsividade, acessibilidade e testes acompanham todas as etapas e recebem fechamento dedicado.
```

Decisões bloqueantes devem ser resolvidas antes da etapa correspondente, em especial calendário de feriados, jornada vigente, compensação, avanço, obrigatoriedade de campos, limites de duração e janela de edição.

## 8. Critérios globais de conclusão da fase do Colaborador

- usuário corporativo único, sem seleção de colegas;
- dados e comandos isolados pelo usuário da sessão;
- apontamento tipado com campos condicionais;
- jornada e saldo em minutos, centralizados e testados;
- calendário acessível e histórico paginado;
- edição versionada, duplicação e cancelamento lógico;
- exportação exclusivamente individual;
- persistência temporária substituível por API;
- nenhuma função administrativa, de homologação ou gestão corporativa;
- nenhuma regra crítica confiada exclusivamente à UI quando houver backend futuro.

## 9. Pontos reservados para fases futuras

### Supervisor

- homologação e seu status separado;
- restrições após aprovação;
- visão autorizada da equipe;
- tratamento de exceções e ajustes conforme política.

### Diretor/gestão corporativa

- relatórios corporativos;
- exportação global;
- indicadores organizacionais;
- gestão corporativa e auditoria.

### Plataforma futura

- autenticação real/JWT/SSO;
- backend e banco;
- autorização por perfil e vínculo;
- fonte oficial de perfil, jornada, feriados, férias e afastamentos;
- cálculos autoritativos e trilha de auditoria.

Esses pontos são **Fora do escopo da fase do Colaborador** e não devem gerar implementação antecipada.

## 10. Estado atual consolidado da área do Colaborador

### Implementado

- sessão corporativa por perfil, restaurada após recarregar e com opção de sair;
- proteção das rotas do Colaborador e redirecionamentos de login;
- perfil somente leitura com cargo, squad e jornada;
- jornada semanal de 480 minutos de segunda a sexta e zero no fim de semana;
- tipos `TimeEntry`, `DailySummary`, perfil, jornada e catálogos;
- regras puras de conversão, formatação, validação, jornada, soma e resumo diário;
- catálogo corporativo de clientes e vinte atividades; não há catálogo oficial de projetos nesta fase;
- service com interface e adaptador `localStorage`, chave versionada e isolamento por colaborador;
- formulário com data, cliente, número do projeto, atividade, duração e detalhamento;
- dashboard com saldos reais locais por dia, mês, intervalo e total, além da lista do dia;
- calendário mensal corporativo, eventos integrais/parciais e solicitações de folga;
- histórico paginado com filtros, edição, duplicação e cancelamento lógico;
- perfil com squad ativa e carga horária versionada;
- contrato corporativo de aprovação diária, sem tela funcional de Supervisor;
- estados de carregamento, vazio, sucesso e erro;
- navegação responsiva, foco visível e tema claro/escuro preservado;
- testes unitários de domínio e persistência defensiva com Vitest.

### Decisões provisórias

- `TimeEntry.status` usa somente `ACTIVE | CANCELLED`; novos registros começam `ACTIVE` e o cancelamento é lógico;
- normal, extra e faltante existem somente em `DailySummary`;
- duração é inteiro em minutos e limitada provisoriamente a 1.440;
- `TimeEntry` usa somente `projectCode`; não possui `projectId` ou `projectName` nesta fase;
- `projectCode` preserva o conteúdo informado e remove somente espaços externos, com limite provisório de 80 caracteres;
- o storage atual usa `sma:time-entries:v3`; a migração encadeada `v1 → v2 → v3` relê e valida cada etapa, mantém backups anteriores e nunca combina versões nas consultas;
- o mapa de projetos antigos existe somente no módulo de migração como compatibilidade temporária, não como catálogo oficial;
- perfil e catálogos são mocks sem nomes reais;
- saldo é prévia local e não oficial;
- `CalendarEvent` representa feriados, férias e afastamentos corporativos; folgas possuem coleção própria.

### Pendências e limitações

- sem backend, autenticação real ou confirmação autoritativa das regras;
- sem rascunho persistido ou exportação individual;
- feriados ainda não possuem fonte oficial completa;
- disciplina e tipo documental existem como catálogos mínimos; documentos da LD e percentual de avanço permanecem fora do escopo;
- sem exportação, visão agregada da squad ou homologação;
- aprovação diária possui domínio/service corporativos e apresentação no dashboard/histórico; a tela funcional de Supervisor e a homologação corporativa permanecem fora do escopo;
- storage local é corporativo, específico do navegador e não oferece segurança.

### Próximos passos recomendados

1. revisar a fatia com usuários e consolidar limites de data/duração;
2. validar com produto as regras ainda provisórias de feriados, compensação e aprovação;
3. definir exportação individual e fonte oficial de calendário antes da integração;
4. manter os testes de domínio como contrato para a futura API/backend.

## 11. Rodada corretiva aprovada em 20/07/2026

A sequência corretiva que levou ao estado consolidado acima, detalhada em `docs/superpowers/plans/2026-07-20-rodada-corretiva-colaborador-implementation.md`, foi:

1. corrigir shell, sidebar/drawer, foco e marca reutilizável;
2. substituir datas adjacentes do calendário por placeholders inertes e esclarecer a origem corporativa dos feriados;
3. completar o catálogo com vinte atividades e remover a ação duplicada;
4. remover projeção futura e limitar saldos reais ao dia atual;
5. neutralizar conflitos de eventos integrais e bloquear novos lançamentos nessas datas;
6. reformular filtro de situação e ações de cancelados;
7. destacar versões editadas sem alterar status de aprovação;
8. verificar todas as páginas, temas, breakpoints, console e suíte integral.

Essa rodada preserva `sma:time-entries:v3`, seus backups, auditoria, dados históricos e o acesso corporativo atual. Não cria autenticação, backend, fonte oficial de feriados, Supervisor ou Diretor.
