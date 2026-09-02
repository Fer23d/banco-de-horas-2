# Especificação de design — Área completa do Colaborador

## Contexto e objetivo

Esta especificação consolida as regras aprovadas para evoluir o frontend React existente na branch `refactor/frontend-colaborador`. O resultado é uma área corporativa completa do Colaborador, responsiva e acessível, com regras de domínio testáveis e persistência local substituível por API.

O frontend React é a fonte de verdade. O arquivo legado `SMA_banco de horas 2.html` permanece intocado e serve apenas como referência visual. Não haverá backend, banco, autenticação real nem controles de Supervisor ou Diretor nesta entrega.

## Decisões de arquitetura

- Componentes React apresentam dados e encaminham intenções; não calculam saldos nem regras de transição.
- Funções puras concentram datas civis, jornada, saldos, calendário e transições de estado.
- Hooks coordenam carregamento, mutações e feedback de interface.
- Repositórios assíncronos escondem `localStorage` e expõem contratos compatíveis com uma API futura.
- Catálogos corporativos ficam isolados em `src/mocks` e nunca são tratados como fonte oficial.
- Todo tempo é armazenado em minutos inteiros; a interface apresenta `HHhMM`.
- Datas de negócio usam `YYYY-MM-DD` e o fuso corporativo configurável `America/Sao_Paulo`.
- O usuário da sessão é o único dono dos dados consultados e modificados.
- Apontamentos guardam snapshot da squad e do supervisor no momento da criação.
- Status do apontamento (`ACTIVE` ou `CANCELLED`) e status consolidado do dia são conceitos separados.
- Dados antigos são preservados por migração versionada e nunca combinados permanentemente com a nova versão.

## Navegação e layout

O cabeçalho ocupa toda a largura no topo. Abaixo dele, em desktop, a sidebar ocupa sua largura real e o conteúdo usa o restante da tela sem margem invisível. Em telas menores, a sidebar vira drawer sobreposto, fecha ao navegar ou acionar o backdrop e não reserva espaço quando oculta.

Menu do Colaborador:

- Visão geral;
- Novo apontamento;
- Histórico;
- Folgas;
- Perfil;
- Sair.

O layout mantém o design system atual: azul-marinho, verde, fundos claros/escuros, tipografia corporativa e cards arredondados. Estados têm texto e ícone ou marcador acessível; nenhuma informação depende apenas de cor.

## Identidade, perfil e vínculo

`CollaboratorProfile` contém identidade, cargo, status ativo, localidade controlada, squad ativa e histórico de cargas. A produ??o usa um único colaborador, localidade São Paulo/SP, squad Engenharia de Automação e supervisor corporativo associado.

O Colaborador pode trocar sua squad ativa entre as squads corporativas. O supervisor é resolvido pelo catálogo de squads e não é escolhido separadamente. A troca:

- afeta apenas novos apontamentos e novas solicitações;
- preserva snapshots de registros anteriores, inclusive pendentes;
- cria evento de auditoria.

Se não houver carga vigente, o perfil exige o primeiro cadastro da carga diária. A carga é única para todos os dias úteis e informada em horas e minutos. Depois de definida, não pode ser alterada diretamente: o Colaborador cria uma solicitação com nova carga, início pretendido e justificativa. Até uma aprovação externa, a carga atual permanece válida.

Versões aprovadas de carga valem a partir de sua data de vigência e nunca recalculam períodos anteriores. Solicitações preservam snapshot da squad e supervisor do momento da criação.

## Modelo de apontamento

`TimeEntry` contém:

- identificador e colaborador automáticos;
- data civil;
- cliente do catálogo corporativo;
- `projectCode` textual obrigatório;
- atividade do catálogo fixo;
- disciplina;
- tipo de documento;
- duração em minutos;
- detalhamento obrigatório;
- snapshot de squad/supervisor, ou `null` somente em legado que não possa ser associado com segurança;
- status de ciclo de vida;
- versão, criação e atualização;
- motivo da última edição, origem da duplicação e dados de cancelamento quando aplicáveis.

Não existem `projectId`, `projectName`, Avanço (%) ou Documento (LD). A migração ignora esses campos se aparecerem em registros antigos.

### Campos e validações

- Data: hoje ou data anterior da mesma competência aberta; nunca futura. Competência fechada bloqueia criação/edição, salvo reabertura explícita do dia ou do mês.
- Cliente: seletor obrigatório baseado no catálogo corporativo e independente do projeto.
- Código do projeto: obrigatório, máximo de 80 caracteres após `trim()`, preservando capitalização, espaços internos, zeros, pontos, barras e hífens.
- Atividade: catálogo fixo de vinte atividades de trabalho definido na rodada corretiva de 20/07/2026. Férias, afastamentos, feriados e folgas são eventos administrativos e não podem ser criados pelo seletor de atividade.
- Disciplina: escolha obrigatória entre `—` (Não se aplica), `A` (Automação) e `E` (Elétrica). O valor `—` é explícito e válido.
- Tipo de documento: escolha obrigatória entre `—`, `RN`, `GR`, `G`, `FD`, `DE`, `LM`, `DI`, `LC`, `LI`, `ET`, `MC`, `MO`, `MD`, `FG`, `LA`, `ES` e `CF`. O valor `—` é explícito e válido.
- Duração: horas inteiras de 0 a 24 e minutos inteiros de 0 a 59, total maior que zero e no máximo 24 horas; persistência em minutos.
- Detalhamento: obrigatório em todas as atividades, inclusive Outros, após remoção de espaços externos.

O único botão de submissão é `Salvar apontamento`. Não existe rascunho nem envio posterior. Submissão válida cria imediatamente um apontamento ativo e atualiza histórico, calendário e saldos. Duplo clique é bloqueado e falha de persistência gera erro controlado.

## Ciclo de vida do apontamento

Enquanto a competência estiver aberta e o dia não estiver aprovado, o Colaborador pode editar, duplicar e cancelar:

- edição preserva `id` e `createdAt`, exige motivo, incrementa versão e registra auditoria;
- duplicação abre uma cópia editável e, ao salvar, cria novo ID, versão 1, status ativo e `sourceEntryId`;
- cancelamento exige confirmação e motivo, faz soft delete, preserva o registro e o retira dos cálculos;
- apontamento aprovado é somente leitura;
- dia reaberto volta a permitir as mutações no escopo reaberto.

## Status consolidado do dia

`DayApproval` agrupa colaborador, data e snapshot de squad. Estados:

- `IN_PROGRESS`: dia atual;
- `AVAILABLE_FOR_APPROVAL`: dia anterior com conjunto atual disponível;
- `CORRECTION_REQUESTED`: supervisor solicitou correção com justificativa;
- `APPROVED`: conjunto aprovado e somente leitura;
- `REOPENED`: dia ou competência explicitamente reaberta;
- `NO_SUBMISSION`: dia útil encerrado sem apontamento após fechamento.

O dia atual nunca pode ser aprovado. Aprovação abaixo da carga é permitida apenas com justificativa. Aprovação e solicitação de correção são operações de domínio/repositório corporativo, sem botões na área do Colaborador.

Em correção, múltiplas edições permanecem liberadas e não mudam automaticamente o status. `Concluir correção` é a única ação que retorna o dia a `AVAILABLE_FOR_APPROVAL` e registra auditoria. Esse botão não aparece no fluxo normal.

Competências anteriores são fechadas por padrão na produ??o. Dias úteis sem registros tornam-se `NO_SUBMISSION`, sem horas fictícias. Reabertura possui responsável, instante, justificativa e escopo.

## Jornada e saldos

Para cada data, a versão de carga vigente é a versão aprovada com maior `effectiveFrom` não posterior à data. Sábados e domingos têm carga base zero; segunda a sexta usam a carga diária vigente.

Regras de evento:

- feriado integral, férias e afastamento integral neutralizam a jornada;
- afastamento parcial reduz a jornada por seus minutos justificados, limitado a zero;
- folga aprovada não neutraliza a carga e, sem trabalho, debita a carga integral do saldo;
- apontamentos cancelados não contam;
- horas acima da jornada geram saldo positivo;
- horas abaixo da jornada geram saldo negativo, inclusive quando o dia for aprovado com justificativa;
- datas futuras não entram no saldo real;
- datas futuras não entram no saldo real e não são apresentadas como projeção na área do Colaborador;
- final de semana sem evento não exige apontamento.

Cada resumo diário oferece jornada base, jornada ajustada, minutos justificados, trabalhados, normais, extras, faltantes e saldo. Resumos de mês, intervalo e total agregam somente datas até o dia atual. A área do Colaborador apresenta apenas valores reais; intervalos futuros são limitados sem gerar déficit hipotético.

## Eventos e feriados

`CalendarEvent` representa férias, afastamento integral/parcial e registros externos somente leitura. O Colaborador não cria, edita ou apaga esses eventos.

`HolidayProvider` é uma porta separada. A produ??o usa fixtures determinísticas e identificadas como fonte corporativa para a localidade controlada; não faz chamada externa e não afirma cobertura oficial completa. Uma API futura substituirá o provider sem alterar componentes.

## Folgas

O Colaborador solicita folga de dia inteiro para data futura, com justificativa e snapshot da squad/supervisor. A solicitação inicia `PENDING` e notifica o supervisor por uma porta local.

- solicitação futura pendente pode ser excluída logicamente;
- folga futura aprovada pode ser cancelada diretamente, sem nova aprovação;
- cancelamento de aprovada cria notificação, auditoria, remove o efeito projetado e libera apontamentos futuros;
- após a data, cancelamento direto é bloqueado;
- não existem controles de aprovação na interface do Colaborador.

## Calendário

O calendário mensal navegável mostra por dia: data, total trabalhado, jornada ajustada, saldo, eventos e situação de completude. A seleção atualiza detalhes e cards. Somente datas do mês selecionado são visíveis e interativas; células de alinhamento dos meses adjacentes permanecem vazias e ignoradas por teclado e leitores de tela.

Estados visuais e textuais:

- vermelho: Sem apontamento;
- amarelo: Jornada incompleta;
- verde: Jornada atingida;
- azul: Jornada excedida;
- rosa: Férias;
- cinza: Folga;
- tonalidade escura: Afastamento;
- roxo: Feriado.

Cada célula tem nome acessível e texto de situação. A legenda possui marcador, texto e descrição. Aprovação aparece nos detalhes do dia, dashboard e histórico, não como cor principal do calendário. Evento parcial e apontamentos aparecem simultaneamente.

## Dashboard

A Visão geral prioriza ações do Colaborador e apresenta:

- saudação, squad, supervisor e carga vigente;
- saldo de hoje, mês e total acumulado;
- aviso discreto quando um intervalo contém datas futuras, que não participam do saldo real;
- resumo e apontamentos do dia selecionado;
- calendário mensal;
- pendências, dias disponíveis para aprovação e correções solicitadas com justificativa;
- solicitações de folga e carga pendentes;
- atalhos para novo apontamento, histórico e folgas.

## Histórico

O histórico aceita dia, mês, intervalo ou todo o período disponível do usuário ativo. Filtros adicionais: cliente, projeto, atividade, disciplina, tipo de documento, classificação de completude e status do dia.

O contrato é paginado por cursor e tamanho limitado. A interface nunca depende de carregar todos os registros da empresa. Cada item mostra data, cliente, código do projeto, atividade, disciplina, tipo documental, detalhamento, duração, squad/supervisor do snapshot, status do dia, eventos, saldo, justificativas, cancelamento e ações permitidas. Avanço e Documento (LD) não aparecem.

## Perfil

O Perfil exibe dados básicos, ativo, localidade, squad/supervisor, carga vigente, histórico de versões, solicitações de carga, troca de squad e criação de solicitação de carga. Localidade é somente leitura. Nenhuma mudança atual reescreve histórico.

## Auditoria e notificações

`AuditEvent` registra ID, tipo, instante, ator, entidade, ID relacionado, antes/depois, justificativa e metadados. A entrega registra eventos de criação, edição, duplicação, cancelamento, correção/conclusão, reabertura, folga, troca de squad e solicitação de carga. Operações externas de aprovação também possuem contratos e testes.

`SupervisorNotification` registra notificações locais para solicitações de folga, cancelamento de folga aprovada e solicitação de carga, sem expor botão de Supervisor.

## Persistência e migração

A nova chave de apontamentos é `sma:time-entries:v3`.

- Uma `v3` válida tem precedência e impede nova migração.
- Na ausência de `v3`, a `v2` é migrada uma vez.
- A `v2` permanece integralmente inalterada como backup.
- Registros válidos são migrados individualmente mesmo que outros sejam inválidos.
- IDs, cliente, projeto, atividade, duração, data, detalhes e timestamps são preservados.
- Disciplina e tipo documental ausentes recebem `—`.
- Avanço e Documento (LD) são ignorados.
- O colaborador corporativo conhecido recebe o snapshot determinístico vigente; outros legados recebem snapshot `null`, sem atribuição inventada.
- A migração só é concluída após gravar, reler e validar a `v3`.
- Falha ou JSON inválido retorna coleção vazia/erro controlado, preserva a fonte e não sobrescreve dados.
- Consultas normais usam somente `v3`; versões anteriores não são combinadas.

Perfil, aprovações, eventos, folgas, auditoria e notificações usam repositórios locais próprios e chaves versionadas. Componentes não acessam `localStorage` diretamente.

## Escala e privacidade

- Toda consulta recebe colaborador e período, e o repositório valida propriedade.
- Histórico retorna página limitada e cursor; filtros farão parte do contrato futuro de API.
- Dashboard e calendário calculam apenas janelas delimitadas.
- Não existem listeners globais nem dados individuais de colegas.
- Nenhum detalhe sensível é registrado em logs.
- A produ??o local não representa segurança; backend futuro repetirá autorização e cálculos autoritativos.

## Acessibilidade e experiência

- Labels são associados a controles e erros por `aria-describedby`.
- O primeiro campo inválido recebe foco.
- Foco por teclado é visível, drawer pode ser fechado e diálogos possuem nomes acessíveis.
- Feedback de sucesso, erro, carregamento e vazio é textual.
- Cancelamentos usam confirmação dentro da interface, não `alert()`.
- Botões assíncronos são desabilitados durante submissão.
- Desktop, tablet e mobile não têm rolagem horizontal indevida.

## Fora do escopo

- autenticação real, JWT, SSO, backend e banco;
- telas ou botões de aprovação do Supervisor;
- gestão administrativa de pessoas, squads, projetos ou calendário;
- relatórios corporativos, auditoria administrativa e área do Diretor;
- fonte oficial completa de feriados;
- merge na `main` ou criação de pull request.

## Critérios de aceite

- Todas as rotas protegidas funcionam com sessão corporativa.
- Formulário, histórico, ações, calendário, saldos, folgas e perfil obedecem às regras descritas.
- Migração `v2` → `v3` é segura, idempotente e testada.
- Testes obrigatórios de domínio, persistência e interface passam.
- Lint, TypeScript, build e `git diff --check` passam.
- Revisão manual não encontra erro no console, quebra responsiva ou espaço vazio indevido.
- Commits são lógicos, a árvore termina limpa e a branch é enviada somente para `origin/refactor/frontend-colaborador`.
