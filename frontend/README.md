# SM&A — Frontend

Frontend corporativo da SM&A com perfis de Colaborador, Supervisor e Diretor/Administração, construído com React, TypeScript, Vite, Tailwind CSS e React Router.

## Escopo disponível

- seleção de perfil corporativo entre três perfis;
- dashboard com saldos reais consolidados por dia, mês, intervalo e total, sempre limitados ao dia atual;
- calendário mensal com feriados e eventos corporativos;
- criação, edição, duplicação e cancelamento lógico de apontamentos;
- histórico individual paginado, filtros e eventos do período;
- solicitações de folga e de alteração de carga horária;
- áreas funcionais para Colaborador, Supervisor e Diretoria/Administração;
- tema claro/escuro e layout responsivo.

## Perfis e rotas

| Perfil | Rota inicial | Conteúdo |
|---|---|---|
| Sem sessão | `/login` | seleção do perfil corporativo |
| Colaborador | `/colaborador` | apontamentos, saldos, histórico, folgas e perfil |
| Supervisor | `/supervisor` | gestão da equipe, solicitações, histórico e perfil |
| Diretor/Administração | `/administracao` | painel macro e gerenciamento de equipes |

O fluxo de entrada não usa senha. Não há backend, banco de dados ou autenticação real nesta fase.

## Execução local

```bash
npm ci
npm run dev
```

O Vite exibirá no terminal o endereço local da aplicação.

## Persistência local

Os repositórios locais escondem o acesso ao `localStorage`, de modo que possam ser substituídos por uma API. A sessão atual usa `sma:demo-session:v2`. Na primeira execução sem uma sessão `v2` válida, a sessão legada `v1` é invalidada de forma idempotente e a aplicação volta a `/login`; essa migração não apaga apontamentos, perfil, folgas, cargas, aprovações ou tema.

Apontamentos usam `sma:time-entries:v3`; na primeira leitura necessária, a aplicação migra de forma encadeada `v1 → v2 → v3`, grava, relê e valida cada etapa e preserva `v1`/`v2` como backups. Depois de validar `v3`, consultas normais não combinam versões. Perfil, cargas, folgas, aprovações, notificações e auditoria usam chaves versionadas próprias.

Feriados e eventos profissionais vêm de fontes locais determinísticas. Eles não representam uma fonte oficial completa. A interface do Colaborador não apresenta projeção futura; datas futuras não geram déficit no saldo real.

## Validação

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

O build é gerado em `dist/`, que permanece ignorado pelo Git. `node_modules/` também não é versionado.
