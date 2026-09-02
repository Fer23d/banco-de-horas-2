# Especificação de design — Identidade SM&A e login corporativo

## Objetivo e linha de base

Esta rodada aplica a identidade oficial da SM&A, remove os três atalhos redundantes da Visão geral e introduz uma sessão corporativa explícita para Colaborador, Supervisor e Diretor/Administração. As regras funcionais já aprovadas do Colaborador permanecem inalteradas.

Linha de base confirmada em 21 de julho de 2026:

- branch `refactor/frontend-colaborador`, sincronizada com `origin` no commit `53b77ecf610117125294a45ff9c40071731f123f`;
- 27 arquivos de teste e 155 testes aprovados;
- lint, TypeScript e build aprovados;
- HTML legado com SHA-256 `5CBA2AE824DA4349C818888F8CFB2B17A74CCD7B5EBF1489E92DCF2182A1182F`;
- `frontend/package.json` com SHA-256 `DDB00A2F935CACB1AC091C0F1359B7CF5D3A295C59F30249B5A9448201A69488`;
- `frontend/package-lock.json` com SHA-256 `BED446CC08E314BA495A0BF5E835B755F3F4870495F75837E755968267AD5BD0`.

## Arquivo oficial da marca

Fonte recebida: `codex-clipboard-efd3f1d8-e64b-4b62-b6b2-2f337ca89715.jpg`.

- formato: JPEG RGB, 24 bits, sem canal alfa;
- dimensões: 243 × 92 px;
- tamanho: 8.275 bytes;
- destino exato: `frontend/src/assets/brand/sma-logo.jpg`;
- preservação: cópia binária exata, sem recorte, filtro, recoloração, reamostragem ou compressão.

O arquivo contém fundo claro e será exibido em contêiner claro discreto nos dois temas. A proporção original `243 / 92` será preservada com `object-fit: contain`.

## Método de extração de cores

A análise considerou os 22.356 pixels da imagem. O fundo foi descartado por limiar de luminosidade e baixa variação entre canais. Pixels de antialiasing e artefatos JPEG foram reduzidos por máscara cromática, mediana RGB e retenção do núcleo a até 20 unidades euclidianas do centro.

| Família | Valor representativo | Amostra candidata | Núcleo retido |
|---|---:|---:|---:|
| Fundo do arquivo | `#F7F7F7` | 15.717 px | 15.717 px |
| Azul-petróleo | `#0F455F` | 3.789 px | 3.572 px |
| Verde-sálvia | `#75AC96` | 681 px | 396 px |

O JPEG possui 4.405 valores RGB literais por compressão e antialiasing. Por isso, os modos isolados não foram usados como paleta: o azul literal mais frequente da tinta tinha apenas 32 pixels e o verde, 9 pixels.

## Escala institucional

Somente os níveis consumidos serão criados:

| Token | Valor | Uso |
|---|---:|---|
| `brand-primary-950` | `#092E42` | sidebar e ação pressionada |
| `brand-primary-800` | `#0F455F` | valor extraído, títulos e ação principal clara |
| `brand-primary-600` | `#1D617B` | hover, links e apoio |
| `brand-primary-100` | `#E6F2F4` | superfícies selecionadas |
| `brand-primary-50` | `#F7FBFC` | fundo institucional muito claro |
| `brand-secondary-700` | `#3A6F5B` | texto secundário acessível |
| `brand-secondary-500` | `#75AC96` | valor extraído e detalhes de marca |
| `brand-secondary-100` | `#E9F2EC` | superfície secundária |

O verde extraído não será usado diretamente para texto pequeno sobre branco; `#3A6F5B` é a variação ajustada para contraste. A logo original permanece inalterada.

## Tokens semânticos estruturais

O sistema existente de variáveis em `styles/index.css` será substituído por uma única camada coerente. Componentes consomem significado, não hexadecimais:

- superfícies: `--color-background`, `--color-surface`, `--color-surface-raised`, `--color-surface-subtle`, `--color-header`, `--color-sidebar`;
- conteúdo: `--color-text`, `--color-text-muted`, `--color-text-subtle`;
- contornos: `--color-border`, `--color-border-strong`, `--color-focus-ring`, `--color-shadow`;
- ações: `--color-primary`, `--color-primary-hover`, `--color-primary-active`, `--color-primary-contrast`, `--color-secondary`, `--color-secondary-hover`;
- formulários e navegação: `--color-input-background`, `--color-input-border`, `--color-input-placeholder`, `--color-navigation-active`, `--color-navigation-hover`, `--color-overlay`.

Pares críticos definidos:

| Par | Tema claro | Contraste | Tema escuro | Contraste |
|---|---|---:|---|---:|
| Texto principal / canvas | `#17212B` / `#F7F7F7` | 15,21:1 | `#F2F7FA` / `#0E1720` | 16,75:1 |
| Texto secundário / canvas | `#4B5B67` / `#F7F7F7` | 6,55:1 | `#B9C7D1` / `#0E1720` | 10,46:1 |
| Texto de ação / ação | `#FFFFFF` / `#0F455F` | 10,31:1 | `#0E1720` / `#90C6D7` | 9,68:1 |
| Borda / superfície | `#758798` / `#FFFFFF` | 3,70:1 | `#607787` / `#15232D` | 3,42:1 |

O tema escuro usa canvas `#0E1720` e superfícies `#15232D`, ambos derivados do azul institucional, sem preto puro.

## Estados semânticos do calendário

As categorias não usam a paleta institucional como substituta. Cada uma mantém texto, símbolo e cor próprios. Dias, legenda, badge e detalhe do dia reutilizam o mesmo identificador semântico e as mesmas variáveis.

Cada célula abaixo registra `fundo / texto / borda`. O primeiro contraste é texto:fundo; o segundo é borda:canvas.

| Estado | Tema claro | Tema escuro |
|---|---|---|
| Sem jornada prevista | `#F1F5F9 / #334155 / #64748B` — 9,45:1; 4,44:1 | `#263545 / #E8EEF5 / #91A4B8` — 10,72:1; 7,06:1 |
| Sem apontamento | `#FFF7E6 / #6B4F13 / #A16207` — 7,16:1; 4,60:1 | `#44371E / #FFE9B0 / #D5A23A` — 9,68:1; 7,79:1 |
| Jornada incompleta | `#FFF1E8 / #8A3F17 / #C2410C` — 6,78:1; 4,83:1 | `#4A2A1B / #FFD9C4 / #D27A44` — 9,75:1; 5,69:1 |
| Jornada atingida | `#EEF7EF / #275B39 / #4D7C0F` — 7,26:1; 4,66:1 | `#253C2A / #DDEFD8 / #80A76B` — 9,90:1; 6,59:1 |
| Jornada excedida | `#FDF0F4 / #7A2E45 / #A23E5A` — 8,22:1; 5,81:1 | `#452532 / #FFD9E4 / #D0809A` — 10,42:1; 6,23:1 |
| Férias | `#F5F0FB / #5B3C88 / #7E5BA6` — 7,66:1; 4,98:1 | `#352944 / #E9DDFF / #A98AD0` — 10,47:1; 6,22:1 |
| Folga | `#EDF8FC / #225E7A / #2C7DA0` — 6,59:1; 4,31:1 | `#203A48 / #D9F2FF / #6FB7D1` — 10,28:1; 8,06:1 |
| Afastamento | `#FAF0F8 / #633A61 / #8A5A83` — 8,18:1; 5,06:1 | `#42283F / #F5DDF0 / #C28AB8` — 10,26:1; 6,56:1 |
| Feriado | `#FFF0F0 / #7C2D32 / #B23A48` — 8,33:1; 5,46:1 | `#49282A / #FFE0E0 / #D68787` — 10,49:1; 6,60:1 |

Símbolos preservados: `○`, `!`, `◷`, `✓`, `+`, `▣`, `↺`, `✚`, `◆`. O texto permanece visível na legenda e nos detalhes; nos dias estreitos, o símbolo fica visível e o rótulo continua disponível para leitor de tela, título e nome acessível.

## Badges funcionais de status

Status de aprovação, apontamento, folga e carga reutilizam um único `StatusBadge` e um catálogo tipado. Os sete tons abaixo são independentes das categorias do calendário; cada badge mantém seu texto e usa `fundo / texto / borda` próprios nos dois temas.

| Tom | Tema claro | Tema escuro | Usos atuais |
|---|---|---|---|
| Neutro | `#F1F5F7 / #3F4F5B / #758798` | `#263545 / #E8EEF5 / #91A4B8` | sem envio, ativo |
| Informação | `#EDF8FC / #225E7A / #2C7DA0` | `#203A48 / #D9F2FF / #6FB7D1` | em andamento, reaberto, editado |
| Pendente | `#FFF7E6 / #6B4F13 / #A16207` | `#44371E / #FFE9B0 / #D5A23A` | disponível ou pendente de aprovação |
| Atenção | `#FFF1E8 / #8A3F17 / #C2410C` | `#4A2A1B / #FFD9C4 / #D27A44` | correção solicitada |
| Sucesso | `#EEF7EF / #275B39 / #4D7C0F` | `#253C2A / #DDEFD8 / #80A76B` | aprovado |
| Perigo | `#FFF0F0 / #7C2D32 / #B23A48` | `#49282A / #FFE0E0 / #D68787` | rejeitado |
| Cancelado | `#F3F1F4 / #55485E / #7C6F85` | `#302B36 / #EEE8F2 / #9F91AA` | apontamento ou solicitação cancelada |

Os pares texto:fundo permanecem acima de `4,5:1` e borda:canvas acima de `3:1`. Rejeição e cancelamento não compartilham o mesmo tom, e nenhuma regra ou valor de status armazenado é alterado.

## BrandMark e integração

`BrandMark` usa o asset oficial por padrão e aceita `compact` ou `full`. A variante compacta exibe a imagem completa em tamanho menor, sem recorte. `src=""` e erro de carregamento ativam fallback textual `SM&A`. O texto alternativo padrão é `SM&A — Sistemas Elétricos e Automação`.

- header: logo completa e legível no canto superior esquerdo, inclusive em 390 px;
- login: logo maior e centralizada uma única vez;
- sidebar: não repete a logo no cartão da squad;
- tema escuro: contêiner claro discreto, sem filtro ou inversão.

## Sessão corporativa por perfil

Tipos explícitos:

```ts
export type DemoRole = 'COLLABORATOR' | 'SUPERVISOR' | 'DIRECTOR_ADMIN'

export type DemoSession = {
  id: string
  name: string
  role: DemoRole
  createdAt: string
  explicitLoginAt: string
  isDemo: true
  version: 2
}
```

O contexto fornece `session`, `profile`, `isLoading`, `signIn(role)` e `signOut()`. `profile` existe somente para a sessão Colaborador e continua apontando para o colaborador corporativo atual; nenhum hook funcional do Colaborador muda de dono.

Persistência:

- nova chave: `sma:demo-session:v2`;
- chave antiga: `sma:demo-session:v1`;
- marcador idempotente: `sma:demo-session:migration:v2`;
- uma `v2` válida é restaurada sem consultar `v1`;
- sem `v2`, a presença de `v1` causa sua invalidação e gravação do marcador, mas nunca cria sessão nova;
- a primeira execução após a mudança mostra `/login`;
- logout remove somente a sessão `v2`;
- nenhuma chave de apontamentos, perfil, folgas, cargas, aprovações ou tema é removida.

Não há senha, token, segredo, credencial Microsoft ou alegação de autenticação real.

## Rotas e acesso

| Perfil | Rota inicial | Conteúdo nesta rodada |
|---|---|---|
| Sem sessão | `/login` | seleção corporativa |
| Colaborador | `/colaborador` | área funcional atual preservada |
| Supervisor | `/supervisor` | placeholder honesto |
| Diretor/Administração | `/administracao` | placeholder honesto |

`ProtectedRoute` recebe perfis permitidos. Uma tentativa de acessar a área de outro perfil redireciona para a rota inicial da sessão. `/login` com sessão válida também redireciona. O estado `from` inclui caminho, query e hash, mas só é reutilizado quando pertence ao perfil escolhido.

## Login e placeholders

O login apresenta uma única logo, título, texto “Ambiente de produ??o”, explicação sem senha e três cards:

1. Colaborador — apontamentos, saldos, histórico, folgas e perfil;
2. Supervisor — equipes, aprovações e solicitações;
3. Diretor/Administração — visão administrativa e gerencial.

Supervisor e Diretor/Administração recebem páginas simples “em desenvolvimento”, identificação do perfil e botão “Sair da produ??o”. Nenhuma funcionalidade fictícia é apresentada.

## Visão geral e shell

Os links “Novo apontamento”, “Consultar histórico” e “Minhas folgas” são removidos somente da faixa de atalhos da Visão geral. A hierarquia passa diretamente da saudação ao filtro de período. Os links continuam na sidebar desktop e no drawer móvel.

A arquitetura aprovada em `53b77ec` permanece:

- `DesktopSidebar` independente, largura de 256 px, ativa a partir de 1024 px;
- `MobileDrawer` independente, abaixo de 1024 px;
- fechamento por Escape, backdrop e navegação, com retorno de foco;
- conteúdo principal iniciado em `x = 256` no desktop e sem overflow horizontal.

## Auditoria inicial de cores

Foram encontradas aproximadamente 767 ocorrências de utilitários cromáticos em `frontend/src`: 397 `slate`, 101 brancos, 81 institucionais `sma-*` e o restante semântico. Há 14 linhas de literais hex/rgb, todas em `styles/index.css`.

Estratégia:

- substituir tokens `sma-*` por tokens `brand-*` extraídos;
- centralizar neutros estruturais na escala `ui-*` e nos tokens semânticos;
- mover as 27 combinações do calendário para tokens próprios;
- preservar vermelho, âmbar, verde, azul e demais cores quando representam erro, alerta, sucesso, informação ou status;
- documentar no relatório qualquer utilitário semântico que permaneça porque seu significado não pertence à marca.

## Testes e evidências

- TDD para asset/BrandMark, contraste/tokens, calendário, sessão/migração, políticas de rota, login, placeholders e remoção dos atalhos;
- suíte completa, lint, TypeScript, build e `git diff --check` em cada checkpoint coerente;
- contraste calculado por função local de teste, sem dependência nova;
- capturas temporárias fora do repositório para os 15 cenários solicitados;
- navegador em 1920, 1440, 1024 e 390 px, claro/escuro, console e overflow.

## Critérios de aceite

- asset copiado sem alteração binária e exibido sem distorção;
- identidade clara e escura baseada nos valores extraídos;
- nove estados visivelmente diferentes, com tokens claro/escuro e comunicação por símbolo e texto;
- login com três perfis e sessão `v2` explícita;
- migração antiga idempotente e dados funcionais preservados;
- placeholders honestos, logout seguro e rotas isoladas por perfil;
- atalhos removidos, sidebar/drawer preservados;
- sem dependências ou arquivos protegidos modificados;
- verificações completas e push somente da branch requerida.

## Fora do escopo

Autenticação real, Microsoft Entra ID, senha, backend, banco, regras definitivas de autorização, áreas funcionais de Supervisor ou Diretor/Administração, separação definitiva entre Diretor e Administração, nova tipografia, novas regras de horas, fonte oficial de feriados, relatórios, importações, exportações, merge, pull request e alteração da `main` permanecem fora desta rodada.
