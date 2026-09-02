# Análise do segundo protótipo — Colaborador

## 1. Escopo e fontes

Esta análise cobre exclusivamente a experiência do perfil **Colaborador**. O código anexado é referência funcional; não deve ser copiado integralmente nem substituir a arquitetura existente em `frontend/`.

Fontes analisadas integralmente:

- `apontamento_de_horas.tsx` — 67.591 bytes, 1.329 linhas, SHA-256 `26D6510DDFC939245E2A3951B31A87949FCB4B340986A3F3428E0523B2029907`;
- `codigo.txt` — 68.919 bytes, 1.329 linhas, SHA-256 `A9ECBB556C9A00A6505B8577365302A5E04AB14AEB8240027AFDB88DFCDED7D4`.

Os dois arquivos são UTF-8 válidos, possuem início e encerramento completos do mesmo componente e não estão truncados. Eles não são idênticos em bytes porque usam espaçamento e indentação diferentes. A comparação ignorando whitespace não encontrou diferenças, e o SHA-256 do conteúdo normalizado sem whitespace é o mesmo nos dois arquivos: `C7ECC88E712136AF4ADD0D0AE769B367FB0B88927D31B2F48967B2AD49DA96B6`. Logo, **não existem diferenças funcionais relevantes** entre os anexos.

## 2. Resumo executivo

Foram identificadas **27 capacidades funcionais relacionadas ao Colaborador** no protótipo. Elas apresentam lançamento, classificação básica, calendário, histórico, edição, exclusão e exportação, mas misturam experiência individual, operações administrativas e acesso global a dados.

Conclusões principais:

- a ideia de apontar horas por data, projeto e atividade deve ser reaproveitada;
- jornada, saldo, classificação de horas e eventos especiais precisam ser redesenhados como regras de domínio centralizadas;
- seleção livre de colaborador, dados públicos e listeners globais são incompatíveis com a nova aplicação;
- edição por exclusão e recriação e exclusão definitiva devem ser descartadas;
- cliente, perfil profissional, duplicação, status explícito, histórico de alterações e paginação não existem no protótipo e precisam ser especificados;
- funções de importação de LD, exclusão de projeto e relatório geral são **Fora do escopo da fase do Colaborador**.

## 3. Capacidades do Colaborador identificadas

### 3.1 Identidade, sessão e contexto

| # | Capacidade | Funcionamento no protótipo | Campos/estado e regras | Dependências | Decisão |
|---|---|---|---|---|---|
| 1 | Sessão corporativa | Inicializa Firebase e usa token do Canvas ou autenticação anônima. Exibe estado “Conectado à Nuvem”. | `user`, `loading`; variáveis `__firebase_config`, `__initial_auth_token` e `__app_id`. | Firebase Auth e ambiente Gemini Canvas. | **Adaptar** para sessão corporativa local nesta fase; autenticação real fica futura. |
| 2 | Seleção de colaborador | Um seletor global permite escolher qualquer pessoa da lista hardcoded. | `colaborador`, `COLABORADORES`; altera consultas, jornada, calendário, tabela e exportação. | Todas as visões individuais. | **Descartar** a seleção livre; o dono virá automaticamente da sessão. |
| 3 | Jornada individual | Define 8h por padrão, 6h para quatro nomes e 4h para um nome específico. | `minutosDiariosAlvo`; comparação por nome em `COLABORADORES_6H` e `GUILHERME AUGUSTO`. | Cálculo diário, calendário e divisão normal/extra. | **Adaptar** para perfil profissional versionado e vigente por período. |

O protótipo não oferece página de perfil profissional. Jornada, identificação e demais atributos do Colaborador deverão vir de um perfil simulado, e futuramente de uma fonte confiável.

### 3.2 Catálogos e campos do apontamento

| # | Capacidade | Funcionamento no protótipo | Campos/estado e regras | Dependências | Decisão |
|---|---|---|---|---|---|
| 4 | Seleção de data | Usa `<input type="date">`, inicia na data atual e converte entre ISO e `DD/MM/AAAA`. | `data`; ao mudar, limpa duração e filtro diário. | Jornada, calendário, histórico e gravação. | **Reaproveitar como requisito**, mantendo data canônica `YYYY-MM-DD`. |
| 5 | Seleção de projeto | Lista dois projetos fixos e projetos lidos do Firestore. Os demais campos ficam bloqueados sem projeto. | `projetoSelecionadoId`, `listaProjetos`; constantes `PROJETO_SMA_FIXO` e `PROJETO_INTERNACIONAL_FIXO`. | Documento, tipo, avanço, atividade e gravação. | **Adaptar em duas etapas**: na primeira fatia, receber somente a numeração informada como `projectCode`; futuramente, trocar por referência estável de um catálogo oficial. |
| 6 | Projetos fixos | Projetos internos usam documento, tipo e avanço como `-`. | Dois nomes hardcoded; documentos `['-']`. | Regras condicionais do formulário. | **Adaptar** para atributo configurável do projeto (`usaDocumentos`, por exemplo), nunca por nome. |
| 7 | Seleção de atividade | Lista 23 atividades de projeto, administrativas e ausências. | `atividade`, `ATIVIDADES_LIST`; padrão “APOIO A COLABORADOR”. | Condicionais, calendário, saldo e exportação. | **Adaptar** para catálogo tipado com categoria e regras de aplicabilidade. |
| 8 | Detalhamento | Campo de texto livre para descrever o trabalho. | `detalhamento`; opcional no protótipo e limpo após salvar. | Histórico, exportação e rastreabilidade. | **Reaproveitar como requisito**, com limites e obrigatoriedade definidos por atividade. |
| 9 | Disciplina | Permite “E - ELÉTRICA” ou “A - AUTOMAÇÃO”. | `disciplina`; valor padrão elétrica. | Registro, histórico e exportação. | **Adaptar** para catálogo e tornar condicional conforme projeto/atividade. |
| 10 | Tipo de documento | Lista 17 tipos; vira `-` em projeto fixo ou folga. | `tipoDocumento`, `TIPO_DOCUMENTO_LIST`. | Documento, histórico e exportação. | **Adaptar**; obrigatório apenas quando o apontamento se relacionar a entregável. |
| 11 | Documento da LD | Opções vêm do projeto; descrições aparecem como `title`. Inclui `N/A` e `-`. | `documento`, `opcoesDocumento`, `documentosDetalhes`. | Projeto, tipo de documento, histórico e exportação. | **Adaptar** para serviço de documentos com identificador estável e opção explícita “não se aplica”. |
| 12 | Percentual de avanço | Oferece 10%, 30%, 50%, 80% e 100%; vira `-` em projeto fixo ou folga. | `avanco`; valor padrão 10%. | Registro e exportação. | **Adaptar**; validar 0–100 e definir se representa avanço do documento ou contribuição do apontamento. |
| 13 | Duração | Seletores de horas `00–24` e minutos em intervalos de 10, preservando minutos antigos em edição. | `quantidadeHoras` no formato `HH:MM`; `currentHours`, `currentMinutes`. | Totais, classificação, calendário e saldo. | **Adaptar** para armazenamento inteiro em minutos e limites coerentes; apresentação em `HH:MM`. |

Não há seleção de **cliente**, código e nome separados do projeto, observação distinta do detalhamento nem identificadores tipados. Nesta primeira fatia, a ausência de catálogo oficial impede criar um `projectId` real; por isso, somente `projectCode` é registrado.

### 3.3 Registro e cálculos

| # | Capacidade | Funcionamento no protótipo | Campos/estado e regras | Dependências | Decisão |
|---|---|---|---|---|---|
| 14 | Inserção de apontamento | Valida colaborador, data, duração e projeto; grava no Firestore. | Campos do formulário, `isSubmitting`, `createdAt`, `updatedAt`. | Sessão, catálogos e persistência. | **Adaptar** para comandos tipados e persistência temporária local nesta fase. |
| 15 | Total diário | Soma registros do dia, exceto folga de compensação. Também considera provisoriamente o valor digitado. | `minutosRegistradosDia`, `minutosInserindo`. | Mensagem de horas faltantes e classificação. | **Adaptar** para seletor de domínio memoizado, sem cálculo disperso em renderização. |
| 16 | Horas faltantes | Calcula `jornada - (registrado + digitado)`. Resultado negativo é exibido como “Banco de Horas Extras”. | `minutosFaltantes`. | Jornada e total diário. | **Adaptar**; separar previsão, apontado, ausência justificada e saldo, sem chamar excedente diário de banco consolidado. |
| 17 | Divisão normal/extra | Classifica o registro inteiro como normal/extra ou o divide em dois documentos quando cruza a jornada. | `tipo`: `Normais`/`Extras`; cria duas gravações com timestamps distintos. | Jornada, ordem de registros e persistência. | **Descartar a classificação persistida**; manter um apontamento e calcular `regularMinutes`/`extraMinutes` apenas no resumo diário. |
| 18 | Total mensal | Soma todas as durações do mês, excluindo folga, e o chama de “Saldo Total Mês”. | `minutosRegistradosMes`. | Calendário e resumo mensal. | **Descartar o cálculo como saldo**; reaproveitar apenas “total apontado”. Saldo mensal exige jornada prevista e eventos. |
| 19 | Totais filtrados | Soma horas normais da tabela filtrada e mostra folgas separadas como negativas. | `totalMinutosTabelaNormal`, `totalMinutosTabelaFolga`. | Filtros e tabela. | **Adaptar** para resumos coerentes por classificação e período. |

### 3.4 Atividades especiais

| # | Capacidade | Funcionamento no protótipo | Campos/estado e regras | Dependências | Decisão |
|---|---|---|---|---|---|
| 20 | Folga de compensação | Força documento, tipo e avanço para `-`; registra duração como `tipo: Negativo`; não conta como horas apontadas. | Atividade “FOLGA COMPENSAÇÃO DE HORAS”, `qtdHoras`. | Saldo, calendário, histórico e exportação. | **Adiar e remodelar como `CalendarEvent`**, separado de `TimeEntry`. |
| 21 | Férias | É apenas uma atividade comum; colore o dia de magenta. A duração ainda pode participar dos totais porque só folga é excluída. | Atividade “FÉRIAS”. | Calendário e cálculo diário. | **Adiar e remodelar como `CalendarEvent`** que reduz/zera a jornada prevista. |
| 22 | Afastamento médico | É apenas uma atividade comum; colore o dia de preto e pode participar dos totais. | Atividade “AFASTAMENTOS MÉDICOS”. | Calendário e cálculo diário. | **Adiar e remodelar como `CalendarEvent`** com período e jornada afetada. |
| 23 | Feriado/emenda | Feriados nacionais são calculados localmente; “FERIADO / EMENDA” também pode ser lançado como atividade. | `obterFeriado`, atividade especial; calendário usa roxo. | Jornada prevista, calendário e saldo. | **Adiar e remodelar como `CalendarEvent`**; calendário oficial dependerá de localidade e política. |

Não existe tratamento específico para afastamentos parciais, férias em intervalo, feriados municipais/estaduais, múltiplos fusos, compensação positiva ou sobreposição de eventos.

### 3.5 Calendário, histórico e ações

| # | Capacidade | Funcionamento no protótipo | Campos/estado e regras | Dependências | Decisão |
|---|---|---|---|---|---|
| 24 | Calendário mensal | Navega entre meses, mostra cada dia, total em tooltip e situação por cor; clicar seleciona a data. | `data`, registros do mês, feriados e jornada. | Lançamento, jornada e eventos especiais. | **Reaproveitar como requisito**, com acessibilidade e cálculos centralizados. |
| 25 | Histórico individual e filtros | Tabela do mês do colaborador escolhido; filtros por dia, documento, atividade, projeto e tipo. | Cinco estados de filtro; ordenação por data e criação. | Registros carregados integralmente. | **Adaptar** para usuário da sessão, filtros ampliados e paginação futura. |
| 26 | Edição e exclusão | Editar repõe dados no formulário. Salvar exclui o documento antigo e cria outro; excluir apaga definitivamente. | `editRowId`, `editCreatedAt`, `deleteDoc`, `addDoc`. | Persistência e histórico. | **Descartar a mecânica**; substituir por atualização versionada, motivo e cancelamento lógico. |
| 27 | Exportação individual | Gera XML Spreadsheet `.xls` com registros filtrados, totais e folgas negativas. | Usa filtros atuais e nome selecionado; campos de apontamento. | Histórico e geração de arquivo no navegador. | **Adaptar** para dados do usuário da sessão, período explícito e colunas do novo modelo. |

Duplicação, cancelamento lógico, rascunho, status explícito, motivo de edição, versão e histórico de alterações **não existem** no protótipo.

## 4. Pontos a alterar para o usuário autenticado

Todos os pontos abaixo devem deixar de aceitar um colaborador escolhido pela interface:

1. remover o seletor `COLABORADORES` do cabeçalho;
2. substituir `colaborador` por `session.user.id`/perfil corporativo somente leitura;
3. obter jornada do perfil vigente, não de listas de nomes;
4. consultar apenas registros cujo dono seja o usuário da sessão;
5. não carregar a coleção pública completa para depois filtrar no cliente;
6. preencher automaticamente `collaboratorId` ao criar um apontamento e ignorar qualquer valor enviado pela UI;
7. impedir que edição, cancelamento ou duplicação atinjam registro de outro dono;
8. limitar calendário, dashboard, histórico, filtros e exportação aos próprios dados;
9. retirar o nome escolhido do nome da planilha e usar o perfil da sessão;
10. não expor a lista de colegas nem seus saldos;
11. para visão de squad, consumir apenas agregados anonimizados com limiar mínimo de grupo;
12. futuramente, repetir as autorizações no backend; esconder controles no frontend não é segurança.

## 5. Regras e ambiguidades observadas

### 5.1 Jornada e saldo

- Jornada está ligada a nomes, sem vigência, dias da semana ou histórico contratual.
- Finais de semana e feriados recebem jornada zero, mas trabalho nesses dias vira extra automaticamente.
- O cálculo de feriados inclui datas nacionais e móveis, porém Carnaval e Corpus Christi podem depender de política/localidade.
- Não existem feriados estaduais/municipais nem calendário por local de trabalho.
- Férias e afastamentos não reduzem explicitamente a jornada; podem ser somados como se fossem trabalho.
- Folga é registrada como duração negativa, mas é excluída de alguns totais e separada em outros, gerando semântica inconsistente.
- “Saldo Total Mês” mostra somente horas apontadas, não `apontado - previsto`.
- O saldo diário é afetado pelo valor ainda não salvo, útil como prévia, mas não deve ser confundido com dado consolidado.
- Dividir um único apontamento em dois registros destrói sua unidade e complica edição, auditoria e duplicação.
- A ordem de criação influencia normal/extra; editar um registro pode alterar a classificação sem recalcular os demais de modo consistente.
- Não há prevenção de duração zero, inválida, superior ao dia ou sobreposição de eventos.

### 5.2 Campos

- Projeto mistura identificador, código e nome em uma string.
- Cliente não existe.
- Atividade mistura trabalho produtivo, administrativo e eventos de ausência.
- `-` e `N/A` são valores sentinela em campos de domínio, dificultando validação e relatórios.
- Avanço usa opções discretas sem definir sua semântica.
- Disciplina tem apenas duas opções hardcoded.
- Observação e detalhamento não são distinguidos.
- Não há status, versão, motivo de edição ou autor/timestamp de cada alteração.

## 6. Calendário analisado

Por dia, o protótipo considera: número do dia, total apontado, jornada-alvo, fim de semana, feriado calculado e presença de atividade especial. Clicar no dia seleciona a data no formulário, limpa o filtro diário e a duração em edição. O tooltip informa feriado e total lançado.

| Cor atual | Significado atual | Problema | Diretriz futura |
|---|---|---|---|
| Vermelho | Dia útil sem apontamento | Depende só de cor | Ícone de alerta + “Sem apontamento” + total/previsto. |
| Amarelo | Abaixo da jornada | Contraste do branco pode ser insuficiente | Ícone de relógio + “Incompleto” + minutos faltantes. |
| Verde | Jornada exatamente atingida | Igualdade exata é rígida | Ícone de check + “Regular”. |
| Azul | Horas extras ou trabalho em dia sem jornada | Combina duas causas | Texto específico: “Excedente” ou “Trabalho em dia não útil”. |
| Magenta | Férias | Cor muito intensa e isolada | Ícone de mala + “Férias”, com período. |
| Cinza | Folga | Pode parecer desabilitado | Ícone de compensação + “Folga”. |
| Preto | Afastamento | Sem distinção de tipo/período | Ícone de saúde + “Afastamento”. |
| Roxo | Feriado/emenda | Agrupa conceitos diferentes | Ícone de calendário + nome do feriado ou “Emenda”. |

A legenda futura deve oferecer texto persistente, ícone, tooltip/descrição, foco por teclado, `aria-label`, contraste WCAG e alternativa para daltonismo. Estados combinados (por exemplo, feriado com horas) precisam mostrar mais de um indicador, não escolher apenas uma cor por precedência.

## 7. Funcionalidades por decisão

### 7.1 Reaproveitar como requisito

- seleção de data;
- lançamento de duração;
- associação a projeto e atividade;
- detalhamento, disciplina, tipo/documento e avanço quando aplicáveis;
- prévia do total diário e horas faltantes;
- calendário mensal individual;
- histórico individual filtrável;
- exportação individual.

### 7.2 Adaptar

- sessão corporativa e identidade automática;
- perfil e jornada por vigência;
- projetos fixos como configuração, não nomes;
- catálogos de atividade, disciplina e documento;
- tempo em minutos;
- distribuição normal/extra calculada no resumo, sem classificação persistida no apontamento;
- tratamento de férias, afastamentos, folgas e feriados;
- totais diário e mensal;
- filtros paginados;
- edição versionada, duplicação e cancelamento lógico;
- persistência temporária isolada por usuário;
- calendário acessível;
- exportação baseada na sessão.

### 7.3 Descartar

- seleção livre de colaborador;
- jornada ligada ao nome;
- coleção pública global;
- listener em tempo real sobre todos os registros da empresa;
- edição por exclusão e recriação;
- exclusão definitiva de apontamento;
- “Saldo Total Mês” calculado apenas pela soma apontada;
- valores sentinela `-` como substitutos de ausência de dados;
- divisão física automática de um apontamento em dois documentos sem identidade comum.

### 7.4 Fase futura do próprio Colaborador

- autenticação real;
- API e persistência definitiva;
- confirmação autoritativa de saldo e classificação pelo backend;
- paginação e filtros processados pela API;
- exportação gerada de forma escalável;
- status de homologação apenas após definição da fase do Supervisor.

## 8. Fora do escopo da fase do Colaborador

| Funcionalidade encontrada | Perfil futuro provável | Dependência com a área do Colaborador |
|---|---|---|
| Importação administrativa de planilha LD | Administrador de projetos / Supervisor autorizado | Alimenta catálogo de documentos selecionável pelo Colaborador. |
| Exclusão de projeto/LD | Administrador de projetos | Afeta disponibilidade futura, nunca os registros históricos. |
| Relatório geral da equipe | Supervisor / Diretor | Consolida os apontamentos originados pela área do Colaborador. |
| Exportação de toda a empresa | Diretor / gestão corporativa | Consome dados agregados e políticas de acesso. |
| Seleção livre de colaborador | Supervisor, se autorizada e contextual | Não pertence à sessão do Colaborador. |
| Visão individual de colegas | Supervisor, conforme escopo organizacional | Deve ser proibida ao Colaborador. |
| Homologação | Supervisor | O modelo poderá receber estado separado no futuro, sem fluxo nesta fase. |
| Gestão de usuários e squads | Administração / Diretor | Fornece perfil, vínculo e agregações. |
| Cadastro administrativo de projetos | Administração de projetos | Fornece catálogos usados no apontamento. |

## 9. Riscos técnicos para a área do Colaborador

| Risco | Severidade | Evidência e impacto |
|---|---|---|
| Dados e registros em coleções públicas | **Crítico** | Caminho Firestore `public/data`; qualquer sessão pode receber registros globais. Viola isolamento e privacidade. |
| Seleção livre e confiança no colaborador enviado pela UI | **Crítico** | O usuário escolhe o dono do registro. Permite leitura e escrita em nome de terceiros. |
| Listener em tempo real da coleção completa | **Crítico** | `onSnapshot` carrega todos os registros e projetos. Inviável e arriscado para 400 pessoas. |
| Edição por exclusão e recriação | **Alto** | Perde identidade, versão e trilha de auditoria; pode falhar entre delete/add. |
| Exclusão definitiva | **Alto** | Apaga evidência histórica e compromete saldo e rastreabilidade. |
| Jornada ligada a nomes | **Alto** | Regra frágil, sem vigência, impossível de manter com alterações contratuais. |
| Cálculos de saldo incorretos/incompletos | **Alto** | Total apontado é rotulado como saldo; ausências não ajustam previsão de modo consistente. |
| Componente monolítico e muitos estados | **Alto** | Mais de 1.300 linhas; UI, domínio, Firebase, Excel e filtros acoplados. |
| Cálculos e filtros repetidos em renderização | **Alto** | Vários `filter`, `forEach` e agregações percorrem arrays globais a cada render e por célula do calendário. |
| Regras dependentes de strings | **Alto** | Atividades e projetos especiais são reconhecidos por nomes exatos; renomear quebra regras. |
| Ausência de tipos | **Alto** | Apesar da extensão `.tsx`, props, estados e registros são implícitos; erros de formato aparecem em runtime. |
| Autenticação anônima/Canvas | **Alto** | Não representa identidade corporativa nem autorização. |
| Variáveis específicas do Gemini Canvas | **Alto** | `__firebase_config`, `__initial_auth_token`, `__app_id` impedem execução independente. |
| Biblioteca XLSX carregada dinamicamente por CDN | **Médio** | Introduz dependência global, risco de disponibilidade/integridade e ausência de tipagem. |
| Importação e exportação no mesmo componente | **Médio** | Aumenta bundle, responsabilidade e superfície de falha. |
| Formatos de data e duração como strings | **Médio** | Conversões repetidas, risco de locale, datas inválidas e aritmética inconsistente. |
| Ausência de histórico de alterações | **Alto** | Não há motivo, versão, autor nem registro imutável de mudanças. |
| Carregamento integral e filtros locais | **Alto** | Crescimento anual tornará memória e renderização impraticáveis. |
| Uso exclusivo de cores em parte do calendário | **Médio** | Baixa acessibilidade e ambiguidade em estados combinados. |
| Chaves de opção por índice | **Baixo** | Pode causar instabilidade visual em listas reordenadas. |

## 10. Requisitos de escala derivados

Para aproximadamente 400 pessoas e centenas de milhares de registros anuais, a área do Colaborador deverá:

- requisitar somente dados do usuário da sessão e do período visível;
- paginar histórico e nunca carregar anos inteiros de registros;
- enviar filtros à API futuramente;
- receber resumos diários/mensais pré-agregados ou limitados ao período;
- evitar varrer todo o histórico durante renderização;
- indexar consultas futuras por dono, data, status, projeto e filtros relevantes;
- cancelar requisições obsoletas e diferenciar loading inicial de atualização;
- virtualizar tabelas apenas se a paginação ainda produzir páginas grandes;
- persistir cache local por usuário e versão do schema;
- não manter listeners sobre coleções corporativas completas;
- exibir visão da squad somente agregada e anonimizada, sem nomes ou possibilidade de inferência individual.

## 11. Decisões pendentes antes da implementação

1. Qual calendário de feriados se aplica por localidade e contrato?
2. Jornada varia por dia da semana e possui vigência histórica?
3. Como afastamentos e férias parciais reduzem a jornada prevista?
4. Folga de compensação consome saldo já adquirido ou apenas registra ausência planejada?
5. Trabalho em feriado/fim de semana é sempre extra ou depende de escala/política?
6. O percentual de avanço representa o documento completo, a atividade ou o incremento do dia?
7. Quais atividades exigem cliente, projeto, disciplina, documento, detalhamento e observação?
8. Qual duração mínima, granularidade e máximo diário permitido?
9. Apontamentos futuros e retroativos são permitidos? Qual janela de edição?
10. Como tratar registros que atravessam mudança de jornada/perfil?
11. Qual formato e limite da exportação individual?
12. Qual limiar mínimo impede reidentificação na visão agregada de squad?

## 12. Decisões consolidadas e primeira fatia

A primeira fatia funcional corrige os pontos centrais do protótipo sem copiá-lo:

- `TimeEntry` representa somente tempo dedicado a cliente, projeto e atividade;
- `projectCode` é a única informação de projeto no apontamento atual: é obrigatório, recebe somente `trim()` externo e preserva capitalização, zeros, pontos, barras, hífens e espaços internos;
- `projectId` e `projectName` não existem em `TimeEntry` nesta fase. Quando houver catálogo oficial e backend, poderá ser criada uma referência estável `projectId`; o nome será obtido pelo relacionamento. Qualquer snapshot histórico do nome exige decisão explícita anterior;
- o status mínimo é `ACTIVE | CANCELLED`; `Editado` não é status e será representado futuramente por versão, timestamps, motivo e histórico;
- normal, extra e faltante não são gravados no apontamento; são derivados em `DailySummary` como `regularMinutes`, `extraMinutes` e `missingMinutes`;
- férias, afastamentos, feriados, folgas, compensações e exceções de jornada serão `CalendarEvent`, separados de `TimeEntry`;
- nesta fatia existem somente `TimeEntry` e `DailySummary`;
- a sessão possui um perfil fictício, jornada de 480 minutos de segunda a sexta e zero no fim de semana;
- o service local usa `sma:time-entries:v2`, isola registros por colaborador e migra uma única vez a antiga `v1`; IDs antigos conhecidos são convertidos pelo mapa corporativo de compatibilidade e IDs desconhecidos são preservados como código. A `v1` permanece inalterada como cópia de segurança;
- uma futura aprovação será um eixo separado: o Colaborador verá apenas `PENDING` (Pendente de aprovação) e `APPROVED` (Aprovado) no dashboard e histórico; não haverá status no calendário. O encaminhamento virá do setor do perfil, sem escolha de supervisor. Nada desse fluxo é implementado nesta fatia;
- não há feriados, ausências, compensações, calendário mensal, edição, duplicação, cancelamento pela interface, documentos da LD, avanço, exportação, agregado de squad ou homologação.

Essas decisões substituem qualquer interpretação anterior de classificação definitiva no registro ou de atividades de ausência modeladas como apontamentos de trabalho.

## 13. Atualização corretiva de 20/07/2026

As decisões abaixo substituem as limitações de implementação registradas anteriormente, sem alterar a análise histórica do protótipo:

- o catálogo criável passa a conter exatamente vinte atividades de trabalho; Férias, Afastamentos médicos, Feriado/emenda e Folga compensação de horas permanecem fora de `TimeEntry`;
- registros históricos com atividades legadas são preservados, mas essas atividades não voltam ao seletor de criação;
- o Colaborador visualiza somente saldos reais até o dia atual; projeção futura não pertence mais à sua interface;
- feriado, férias e afastamento integral neutralizam jornada e saldo, bloqueiam novo apontamento e preservam conflitos antigos apenas para auditoria;
- o calendário mostra somente datas do mês selecionado; espaços de alinhamento são células vazias sem interação;
- apontamentos com `version > 1` recebem a característica visual “Editado”, sem transformar edição em status de aprovação;
- o histórico inicia em “Somente ativos” e permite consultar separadamente cancelados ou todos.

A especificação detalhada desta atualização está em `docs/superpowers/specs/2026-07-20-rodada-corretiva-colaborador-design.md`.
