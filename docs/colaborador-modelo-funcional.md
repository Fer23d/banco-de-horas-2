# Modelo funcional — Área do Colaborador

## 1. Objetivo

Definir o comportamento esperado da área do Colaborador e registrar as decisões da primeira fatia, sem backend, banco de dados, autenticação real ou homologação. O modelo separa apontamento, distribuição diária das horas, status do registro e cálculo de jornada/saldo.

## 2. Princípios

1. O usuário da sessão é sempre o dono do apontamento; não existe seletor de colega.
2. O Colaborador acessa apenas seus dados individuais.
3. Tempo é armazenado e calculado em **minutos inteiros**; `HH:MM` é apenas apresentação.
4. Jornada vem do perfil profissional vigente na data, nunca do nome no código.
5. Saldo é derivado e somente leitura; o Colaborador não o digita nem o altera.
6. Distribuição normal/extra/faltante é derivada em `DailySummary`, nunca persistida como classificação definitiva do apontamento.
7. Feriados, férias e afastamentos pertencem a `CalendarEvent`; folgas pertencem a `TimeOffRequest`. Ambas as entidades são separadas de `TimeEntry`.
8. Edição preserva identidade, criação, versões e histórico.
9. Exclusão é cancelamento lógico por padrão.
10. Cálculos centrais ficarão fora dos componentes e serão futuramente confirmados pelo backend.

## 3. Fluxo do Colaborador

1. Entrar por uma sessão corporativa escolhendo um dos três perfis disponíveis; somente o perfil Colaborador possui área funcional completa nesta branch.
2. Consultar o perfil profissional, a squad vigente e a carga horária versionada; alterações locais continuam corporativas e sem valor corporativo oficial.
3. Abrir o dashboard individual para ver período, jornada prevista, total apontado e saldo calculado.
4. Selecionar uma data pelo calendário ou pela rota de novo apontamento.
5. Escolher o cliente, digitar exatamente o número do projeto atual e escolher a atividade.
6. Preencher somente os campos aplicáveis à atividade; o cliente não filtra projetos nesta fase.
7. Informar duração em horas/minutos; a aplicação converte para minutos.
8. Visualizar uma prévia do total diário e da situação da jornada.
9. Registrar o apontamento como `ACTIVE`; rascunho persistido não existe nesta fatia.
10. Consultar histórico paginado e filtrado.
11. Editar com motivo, duplicar ou cancelar logicamente, respeitando versão e regras da competência.
12. Futuramente, exportar apenas os próprios dados do período/filtros escolhidos.

## 4. Modelo do apontamento

### 4.1 Contrato atual

| Campo | Tipo conceitual | Classificação | Regra |
|---|---|---|---|
| `id` | UUID/string opaca | **Automático, somente leitura** | Gerado uma vez e preservado em edições. |
| `collaboratorId` | identificador do perfil | **Automático, somente leitura** | Sempre obtido da sessão; nunca aceito de um seletor. |
| `entryDate` | data ISO `YYYY-MM-DD` | **Obrigatório** | Data civil do trabalho; datas futuras e datas bloqueadas não aceitam mutação. |
| `clientId` | identificador de cliente | **Obrigatório** | Deve apontar para um cliente ativo do catálogo corporativo. |
| `projectCode` | texto, máximo provisório de 80 caracteres | **Obrigatório** | Informado pelo Colaborador. Aplicar somente `trim()` externo antes de validar/persistir; preservar capitalização, zeros, pontos, barras, hífens e espaços internos. |
| `activityId` | identificador da atividade | **Obrigatório** | Atividade tipada define categoria e aplicabilidade dos demais campos. |
| `disciplineCode` | enum `— | A | E` | **Obrigatório** | `—` representa “não aplicável” no contrato atual; não é ausência de valor. |
| `documentTypeCode` | enum do catálogo mínimo | **Obrigatório** | `—` representa “não aplicável”; os demais códigos identificam o tipo documental selecionado. |
| `durationMinutes` | inteiro entre 1 e 1.440 | **Obrigatório** | Armazenamento canônico em minutos inteiros. |
| `details` | texto | **Obrigatório** | Recebe `trim()` externo e não aceita conteúdo vazio. |
| `assignmentSnapshot` | snapshot de squad/supervisor ou `null` | **Automático, somente leitura** | Preserva a atribuição resolvida no lançamento; `null` é aceito para compatibilidade legada. |
| `status` | enum | **Automático, somente leitura** | `ACTIVE` na criação; muda para `CANCELLED` no cancelamento lógico. |
| `createdAt` | timestamp | **Automático, somente leitura** | Mantido por toda a vida do registro. |
| `updatedAt` | timestamp | **Automático, somente leitura** | Atualizado em cada mudança. |
| `lastEditReason` | texto | **Condicional** | Obrigatório em cada edição confirmada. |
| `version` | inteiro | **Automático, somente leitura** | Inicia em 1 e incrementa em mudanças persistidas. |
| `cancelReason` | texto | **Condicional** | Obrigatório no cancelamento lógico. |
| `cancelledAt` | timestamp | **Automático, somente leitura, condicional** | Preenchido no cancelamento lógico. |
| `sourceEntryId` | identificador | **Automático, somente leitura** | Rastreia a origem de um apontamento duplicado. |

Nomes de cliente e atividade são resolvidos pelos catálogos e não são armazenados em `TimeEntry`. O contrato atual também não possui colaborador por nome, documento da LD, percentual de avanço ou observação separada.

`TimeEntry` não possui `projectId` nem `projectName` nesta fase, porque não existe catálogo oficial ou identificador estável. Quando catálogo e backend existirem, poderá receber uma referência estável `projectId`, e o nome será obtido pelo relacionamento. Um eventual snapshot histórico do nome só deverá ser criado após necessidade explícita e regra de atualização definidas. Documento da LD, avanço e observação separada também exigem decisão funcional explícita antes de ampliar o contrato.

### 4.2 Aplicabilidade por cenário

| Cenário | Cliente/projeto | Disciplina | Tipo documental | Detalhamento | Entidade/efeito atual |
|---|---|---|---|---|---|
| Trabalho em projeto de cliente com entregável | Obrigatórios | Código aplicável | Código aplicável | Obrigatório | `TimeEntry`; minutos entram no `DailySummary`. |
| Trabalho em projeto sem documento | Obrigatórios | Código aplicável ou `—` | `—` | Obrigatório | `TimeEntry`; minutos entram no `DailySummary`. |
| Projeto interno SM&A | Cliente interno do catálogo e projeto obrigatórios | Código aplicável ou `—` | Código aplicável ou `—` | Obrigatório | `TimeEntry`; minutos entram no `DailySummary`. |
| Atividade administrativa | Cliente e projeto continuam obrigatórios no contrato uniforme atual | `—` quando não aplicável | `—` quando não aplicável | Obrigatório | `TimeEntry`; flexibilização futura depende de decisão de produto. |
| Folga de compensação | Não aplicáveis | Não aplicável | Não aplicável | Motivo próprio da solicitação | `TimeOffRequest`; não é `TimeEntry`. |
| Férias | Não aplicáveis | Não aplicável | Não aplicável | Não exigido no apontamento | `CalendarEvent`; não é `TimeEntry`. |
| Afastamento médico | Não aplicáveis | Não aplicável | Não aplicável | Sem dado médico sensível desnecessário | `CalendarEvent`; não é `TimeEntry`. |
| Feriado | Não aplicáveis | Não aplicável | Não aplicável | Não exigido | `CalendarEvent`; trabalho no feriado, quando permitido, é `TimeEntry` separado. |

Para disciplina e tipo documental, o contrato atual usa explicitamente o código `—` para “não aplicável”. Demais dados que pertencem a outras entidades não devem ser simulados dentro de `TimeEntry`.

## 5. Distribuição diária das horas

`TimeEntry` não possui classificação definitiva normal/extra. Ele registra apenas a duração dedicada à atividade. `DailySummary` deriva:

- `regularMinutes = min(workedMinutes, expectedMinutes)`;
- `extraMinutes = max(workedMinutes - expectedMinutes, 0)`;
- `missingMinutes = max(expectedMinutes - workedMinutes, 0)`;
- `balanceMinutes = workedMinutes - expectedMinutes`.

Um apontamento que cruza o limite diário continua sendo uma unidade. O resultado é provisório e será futuramente confirmado pelo backend; não representa banco homologado nem hora extra aprovada.

## 6. Status do registro

`status` representa apenas se o registro participa dos cálculos:

| Status | Significado | Ações do Colaborador nesta fase |
|---|---|---|
| `ACTIVE` | Apontamento ativo. | Entra nos totais e resumos. |
| `CANCELLED` | Apontamento cancelado logicamente. | Não entra nos totais, mas permanece preservado e consultável no histórico. |

`Editado` é evento/característica histórica, não status. A edição usa `version`, `updatedAt` e `lastEditReason`; duplicação cria novo registro com `sourceEntryId`. Rascunho persistido e homologação corporativa permanecem posteriores e separados desse status.

### 6.1 Aprovação diária corporativa

A implementação atual mantém a aprovação separada de `TimeEntry`, consolidada por colaborador e data em `DayApproval`. Os estados são `IN_PROGRESS`, `AVAILABLE_FOR_APPROVAL`, `CORRECTION_REQUESTED`, `APPROVED`, `REOPENED` e `NO_SUBMISSION`. O dashboard e o histórico apresentam esse eixo; o calendário continua comunicando somente a situação da jornada.

Datas futuras, dias sem jornada e sem trabalho e datas com evento integral não geram conjunto aprovável. Ações de Supervisor verificam o responsável preservado no snapshot, a transição permitida e a versão esperada. A UI funcional de Supervisor e a homologação corporativa permanecem fora do escopo.

### 6.2 Separação das entidades

- `TimeEntry`: tempo trabalhado em cliente, projeto e atividade; implementado nesta fatia.
- `DailySummary`: valores derivados de jornada e apontamentos ativos; implementado nesta fatia.
- `CalendarEvent`: férias, afastamentos e feriados corporativos; folgas usam solicitação própria e alimentam os resumos quando aprovadas.

## 7. Jornada e saldo

### 7.1 Perfil de jornada

O perfil profissional deverá oferecer, para uma data:

- fuso/localidade;
- carga prevista por dia da semana em minutos (permitindo 4h, 6h, 8h e outras configurações);
- início e fim da vigência;
- calendário de feriados aplicável;
- escala ou exceções individuais autorizadas;
- períodos de férias, afastamentos e folgas relevantes.

Mudanças de jornada não devem recalcular períodos anteriores usando a configuração atual.

### 7.2 Valores derivados por dia

Para uma data `d`:

- `baseScheduledMinutes(d)`: jornada do perfil vigente e dia da semana;
- `holidayReductionMinutes(d)`: redução por feriado aplicável;
- `leaveReductionMinutes(d)`: redução coberta por férias/afastamento;
- `compTimeReductionMinutes(d)`: redução por folga de compensação conforme política;
- `expectedMinutes(d) = max(0, baseScheduled - reduções válidas)`;
- `workedMinutes(d)`: soma de minutos de trabalho ativos, excluindo cancelados e ausências;
- `normalMinutes(d) = min(workedMinutes, expectedMinutes)`;
- `extraMinutes(d) = max(0, workedMinutes - expectedMinutes)`, sujeito à política;
- `missingMinutes(d) = max(0, expectedMinutes - workedMinutes)`;
- `dailyBalanceMinutes(d)`: fórmula aprovada de crédito/débito, considerando compensações e eventos.

O frontend pode calcular uma **prévia** com funções puras, mas deve distinguir resultado provisório de resultado confirmado.

### 7.3 Regras por situação

- Dia útil comum: previsão vem da jornada do perfil.
- Final de semana: previsão normalmente zero, salvo escala vigente.
- Feriado: previsão reduzida conforme calendário/localidade; trabalho não é automaticamente extra sem política explícita.
- Férias integrais: previsão disponível deve ser zero no período coberto.
- Férias parciais, se admitidas: reduzir apenas minutos cobertos.
- Afastamento: reduzir a previsão conforme período e cobertura; não somar afastamento como trabalho.
- Folga de compensação: registrar evento e impacto de saldo separado de horas trabalhadas.
- Horas extras: calculadas, nunca digitadas como saldo; podem exigir autorização futura, fora desta fase.
- Registros cancelados: não entram em totais ativos, mas permanecem no histórico.

### 7.4 Saldo mensal

Para o período, agregar valores diários já calculados, não percorrer todo o histórico corporativo:

- jornada prevista no período;
- horas normais;
- horas extras;
- minutos ausentes justificados;
- minutos faltantes não justificados;
- compensações;
- saldo líquido conforme política.

Situação visual sugerida:

- **Positivo**: saldo acima de zero;
- **Regular**: saldo igual a zero ou dentro de tolerância formalmente definida;
- **Negativo**: saldo abaixo de zero.

Não assumir tolerância sem decisão de negócio. Não permitir edição direta do saldo.

## 8. Dashboard individual

O dashboard deverá trabalhar com um período limitado e mostrar:

- identificação e jornada vigente do usuário;
- jornada prevista no período;
- total apontado;
- horas normais e extras;
- ausências e compensações;
- horas faltantes;
- saldo calculado e indicador de provisório/confirmado;
- dias incompletos que requerem atenção;
- acesso rápido ao novo apontamento, calendário e histórico.

Nenhum card deve revelar nomes, saldos ou histórico de colegas.

## 9. Calendário individual

### 9.1 Informação por dia

- data e dia da semana;
- previsto versus apontado em minutos/`HH:MM`;
- situação: sem jornada, sem apontamento, incompleto, regular, excedente;
- feriado e seu nome;
- férias, afastamento ou folga;
- número de apontamentos ativos;
- indicação de dados provisórios, se aplicável.

Selecionar um dia deve abrir/atualizar o contexto daquela data sem apagar silenciosamente um rascunho. Se houver alterações não salvas, a UI deverá pedir decisão antes da troca.

### 9.2 Legenda acessível

| Situação | Texto | Ícone sugerido | Tratamento visual |
|---|---|---|---|
| Sem apontamento em dia previsto | “Sem apontamento” | alerta | Vermelho com contraste adequado. |
| Parcial | “Incompleto — faltam HH:MM” | relógio | Amarelo/âmbar com texto escuro. |
| Regular | “Jornada atingida” | check | Verde. |
| Excedente | “Excedente de HH:MM” | seta/mais | Azul. |
| Férias | “Férias” | mala | Cor secundária + padrão/ícone. |
| Afastamento | “Afastamento” | saúde | Cor neutra forte + ícone. |
| Folga | “Folga de compensação” | compensação | Cinza/azul + ícone. |
| Feriado | Nome do feriado | calendário | Roxo + texto. |
| Final de semana | “Sem jornada prevista” | calendário | Fundo neutro. |

Cada célula deve fornecer texto acessível, foco por teclado e descrição/tooltip. Estados simultâneos devem ser exibidos em conjunto.

## 10. Histórico individual

### 10.1 Colunas

- data;
- cliente;
- número do projeto (`projectCode`); futuramente, nome resolvido pelo catálogo oficial;
- atividade;
- disciplina;
- tipo de documento;
- documento;
- avanço;
- detalhamento;
- duração em `HH:MM`;
- distribuição diária normal/extra derivada do resumo, quando aplicável ao período;
- status do registro;
- última alteração;
- ações disponíveis.

Colunas podem ser responsivas, mas todos os dados devem permanecer acessíveis por detalhe expandido.

### 10.2 Filtros

- período (obrigatoriamente limitado);
- cliente;
- projeto;
- atividade;
- disciplina;
- documento;
- classificação;
- status.

Filtros devem compor uma consulta, refletir-se na URL quando adequado e poder ser limpos. A exportação individual deve declarar se usa todos os resultados filtrados ou somente a página.

### 10.3 Paginação

O contrato do service aceita `pageSize` e cursor, retornando `items`, `nextCursor` e total. A implementação local é corporativa; a API futura deverá processar filtros e paginação sem carregar todo o histórico no navegador.

## 11. Edição, duplicação e cancelamento

### 11.1 Edição

- carregar o registro mantendo seu `id` e `createdAt`;
- exigir `editReason` quando já registrado;
- validar propriedade pelo usuário da sessão;
- incrementar `version`;
- atualizar `updatedAt`;
- preservar snapshot/alterações anteriores;
- recalcular totais afetados sem apagar e recriar o registro;
- rejeitar conflito de versão por concorrência otimista.

### 11.2 Duplicação

- criar novo `id`, `createdAt`, `updatedAt` e `version = 1`;
- iniciar com `version = 1` e status ativo; rascunho permanece fora do escopo;
- copiar apenas campos úteis;
- permitir ajustar data, duração, projeto e detalhes antes de registrar;
- preencher `sourceEntryId` para rastreabilidade;
- nunca duplicar status, cancelamento ou futura homologação.

### 11.3 Cancelamento

- substituir exclusão definitiva;
- exigir motivo;
- mudar `status` para `CANCELLED`;
- preservar dados, criação e versões;
- excluir o registro apenas dos totais ativos;
- mostrar o cancelamento no histórico quando o filtro permitir.

## 12. Persistência temporária no frontend

Enquanto não houver backend:

- usar service assíncrono por interface, com adaptador local/mocks;
- isolar chaves por `collaboratorId` corporativo;
- versionar o schema persistido;
- guardar somente dados não sensíveis necessários ao protótipo;
- validar e migrar dados lidos do armazenamento;
- oferecer reset apenas dos dados corporativos do próprio usuário;
- não tratar `localStorage` como segurança ou fonte definitiva;
- manter cálculos derivados fora do armazenamento sempre que puderem ser reproduzidos.

### 12.1 Estado persistido atual

- chave atual `sma:time-entries:v3`;
- migração encadeada e idempotente `v1 → v2 → v3`, executada somente quando a versão seguinte ainda não existe validamente;
- conversão de `projectId` antigo pelo mapa temporário de compatibilidade; quando desconhecido, o próprio valor antigo é preservado como `projectCode`;
- cada etapa só conclui após gravar, reler e validar integralmente o conteúdo persistido; falhas retornam coleção vazia controlada;
- `v1` e `v2` permanecem como backups inalterados, enquanto consultas normais usam exclusivamente a `v3` validada;
- registros agrupados e consultados por `collaboratorId`;
- sessão corporativa restaurada localmente e separada do service de apontamentos;
- leitura defensiva: JSON inválido gera erro de desenvolvimento e coleção vazia segura;
- carga horária corporativa versionada, inicialmente de 480 minutos de segunda a sexta e zero no fim de semana;
- duração máxima provisória de 1.440 minutos;
- feriados, férias, afastamentos e folgas usam fontes/coleções corporativas próprias;
- edição, duplicação, cancelamento lógico, histórico paginado e calendário mensal estão implementados; rascunho, documentos da LD, avanço, exportação, agregado de squad e homologação corporativa permanecem fora do escopo.

## 13. Privacidade e visão agregada da squad

- A UI do Colaborador não aceita `collaboratorId` arbitrário em rotas, filtros ou comandos.
- Services recebem o contexto da sessão e futuramente a API aplicará autorização novamente.
- Exportação contém somente os próprios registros.
- Erros e logs não devem expor nomes, dados médicos ou conteúdo de colegas.
- A visão de squad, se disponibilizada ao Colaborador, deve conter apenas métricas agregadas (por exemplo, capacidade total ou percentual de cobertura), sem lista de pessoas, drill-down ou combinação de filtros que permita reidentificação.
- Definir limiar mínimo de participantes e ocultar grupos pequenos; a regra exata permanece pendente.

## 14. Decisões funcionais pendentes

1. Vigência e variação semanal da jornada profissional.
2. Tolerância para situação “Regular”.
3. Política de extra em fim de semana, feriado e escala.
4. Política de compensação e origem do saldo consumido.
5. Fonte e abrangência dos feriados.
6. Regras para férias/afastamentos parciais e sobrepostos.
7. Semântica e granularidade do percentual de avanço.
8. Matriz de obrigatoriedade por atividade e tipo de projeto.
9. Limites de duração, granularidade e datas retroativas/futuras.
10. Campos e formato da exportação individual.
11. Janela de edição/cancelamento antes da futura homologação.
12. Limiar de anonimização da visão agregada da squad.

## 15. Regras consolidadas na rodada corretiva de 20/07/2026

Para a interface atual do Colaborador, ficam resolvidas e substituem trechos anteriores em conflito:

- o saldo é real e limitado ao dia atual; datas futuras não geram jornada faltante e não existe card ou resumo de projeção futura;
- o catálogo possui vinte atividades de trabalho fixas. Eventos administrativos são somente leitura e não podem ser escolhidos como atividade;
- férias, feriado e afastamento integral zeram a jornada ajustada e o saldo. Registro histórico conflitante é preservado, sinalizado e não gera horas normais/extras;
- afastamento parcial reduz somente a parcela justificada e permite apontar o restante;
- uma data com evento integral bloqueia criação/duplicação/edição conflitante com mensagem específica;
- calendário mensal usa placeholders inertes e expõe somente datas reais do mês;
- situação de histórico é `ACTIVE`, `CANCELLED` ou consulta `ALL`, com ativos como padrão;
- `Editado` é indicador derivado de `version > 1`, acompanhado de `updatedAt` válido, e continua separado do status de aprovação.

Autenticação real, fonte oficial de feriados e resolução administrativa de conflitos permanecem futuras.
