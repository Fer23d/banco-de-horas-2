# Assinatura Digital no RDO

## Objetivo

Permitir que o colaborador desenhe uma assinatura no Meu Perfil, persista a imagem em Base64 e reutilize essa assinatura nos RDOs exportados em PDF e Word.

## Arquitetura

- Adicionar `react-signature-canvas` ao frontend.
- Estender `CollaboratorProfile` com `signatureBase64?: string`.
- Estender o contrato de `profileService` com uma operação específica para salvar a assinatura.
- Persistir a assinatura no mesmo registro local do perfil, mantendo compatibilidade com perfis antigos sem assinatura.
- Disparar o `PROFILE_UPDATED_EVENT` após salvar para que o `DemoSessionProvider` e consumidores do perfil recarreguem os dados.
- Reutilizar o `profile` atualizado no `CreateRdoButton`.

## Documentos

- PDF: usar a imagem PNG Base64 com `jsPDF.addImage`, posicionada acima do nome e com fallback para a linha atual quando não houver assinatura.
- Word: converter a parte Base64 em bytes e usar `ImageRun`, com o mesmo fallback textual e as mesmas dimensões aproximadas.
- A assinatura será incluída no modelo comum `RdoData`, junto do nome do profissional.

## Interface

- Criar a seção “Padrão de Assinatura” na página de Perfil.
- Exibir canvas responsivo, botão “Limpar” e botão “Salvar Assinatura”.
- Mostrar feedback de sucesso/erro sem bloquear a edição de outros dados do perfil.

## Segurança e limites

- Aceitar apenas data URLs de imagem PNG/JPEG e limitar o tamanho salvo para evitar crescimento excessivo do localStorage.
- A assinatura é opcional; documentos continuam válidos sem ela.
- Não alterar o Banco de Horas 1.

## Verificação

- Testar captura e persistência do Base64 no serviço de perfil.
- Testar atualização do perfil após o evento global.
- Testar que `buildRdoData` carrega a assinatura e que PDF/Word usam a imagem ou o fallback.
- Rodar typecheck, lint, suíte completa e build antes do commit funcional.
