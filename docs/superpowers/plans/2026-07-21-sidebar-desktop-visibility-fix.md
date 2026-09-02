# Correção da visibilidade da sidebar desktop

## Causa raiz confirmada

O `AppLayout` reservava uma coluna de 18rem no desktop, mas renderizava apenas uma instância de `Sidebar`. Essa instância também era o drawer móvel: recebia `invisible` e `-translate-x-full` quando o estado `isSidebarOpen` estava fechado e dependia de variantes `lg:` para voltar a ficar visível e estática.

Antes da correção, a inspeção encontrou zero elementos `data-desktop-sidebar` e um único `aside` marcado como `data-drawer-panel`. Em navegadores nos quais as variantes responsivas prevaleciam, esse drawer aparecia em desktop; quando não prevaleciam, o grid mantinha a coluna enquanto o único menu permanecia oculto, produzindo exatamente o espaço lateral vazio relatado.

## Correção aplicada

1. O conteúdo de perfil, navegação e saída permanece em uma implementação compartilhada.
2. A `DesktopSidebar` é independente, não recebe estado, aparece somente a partir de 1024px e possui largura estável de 256px.
3. O `MobileDrawer` é independente, controlado pelo botão do header e removido do layout desktop.
4. O conteúdo principal é irmão da sidebar dentro de um grid de `256px minmax(0, 1fr)`.
5. O drawer continua fechando por Escape, clique externo e navegação, com retorno de foco ao botão.

## Verificação executada

- O teste estrutural comprovou as duas regiões independentes e falhou no código anterior.
- O navegador comprovou estilos computados, dimensões e não sobreposição em 1920px, 1440px e 1024px.
- Em 390px, a sidebar desktop ficou oculta, o drawer abriu e fechou sem reservar espaço e sem overflow horizontal.
- As cinco rotas protegidas conservaram largura, posição e item ativo.
