# Assinatura Digital no RDO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir desenhar, persistir e reutilizar a assinatura do colaborador nos RDOs PDF e Word do Banco de Horas 2.

**Architecture:** A assinatura opcional será armazenada como `signatureBase64` no perfil local existente. O `PROFILE_UPDATED_EVENT` fará o recarregamento reativo do perfil; o `CreateRdoButton` receberá a assinatura pelo contexto atual e a passará ao modelo comum `RdoData`, evitando caminhos separados para PDF e Word.

**Tech Stack:** React 19, TypeScript, Vite, `react-signature-canvas`, localStorage via `profileService`, jsPDF, docx, file-saver, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-18-assinatura-digital-rdo-design.md`

## Global Constraints

- A assinatura é opcional; sem assinatura, PDF e Word devem manter a linha e o nome atuais.
- Aceitar somente imagens PNG/JPEG em data URL e limitar o tamanho persistido para evitar crescimento excessivo do localStorage.
- Não alterar o Banco de Horas 1.
- Usar o evento existente `PROFILE_UPDATED_EVENT` após salvar o perfil.
- Rodar typecheck, lint, testes e build antes do commit funcional.
- O commit funcional deve usar a mensagem `feat: adiciona captura de assinatura no perfil e injeta nos RDOs`.

---

### Task 1: Contrato e persistência da assinatura

**Files:**
- Modify: `frontend/src/features/profile/types.ts`
- Modify: `frontend/src/services/profileService.ts`
- Test: `frontend/src/services/profileService.test.ts`

**Interfaces:**
- Add `signatureBase64?: string` to `CollaboratorProfile`.
- Add `UpdateSignatureInput = { signatureBase64: string }`.
- Add `saveSignature(collaboratorId: string, signatureBase64: string): Promise<CollaboratorProfile>` to `ProfileService`.
- Preserve profiles without the property as valid legacy profiles.

- [ ] **Step 1: Write the failing persistence tests**

Add tests that call `saveSignature` with a valid PNG data URL, assert the returned profile contains it, create a new `LocalProfileService` over the same storage, and assert `getById` returns the same Base64. Add a second test asserting an invalid non-image data URL is rejected with a clear error.

- [ ] **Step 2: Run the focused tests and verify failure**

Run:

```bash
npm test -- --run src/services/profileService.test.ts
```

Expected: TypeScript/test failure because `saveSignature` and `signatureBase64` do not exist.

- [ ] **Step 3: Implement the profile contract and safe persistence**

Update `isProfile` so the new field is accepted only when absent or a string. Implement `saveSignature` with:

```ts
const signature = signatureBase64.trim()
if (!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(signature)) {
  throw new Error('Envie uma assinatura em PNG ou JPEG.')
}
if (signature.length > 300_000) throw new Error('A assinatura excede o tamanho permitido.')
const updated = { ...current, signatureBase64: signature }
this.storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated))
notifyProfileUpdated()
return updated
```

Do not include the signature in audit payloads. Keep `updateProfile` and legacy fallback behavior unchanged.

- [ ] **Step 4: Run the focused tests and verify success**

Run `npm test -- --run src/services/profileService.test.ts`; all profile service tests must pass.

- [ ] **Step 5: Commit the storage contract checkpoint**

```bash
git add frontend/src/features/profile/types.ts frontend/src/services/profileService.ts frontend/src/services/profileService.test.ts
git commit -m "feat: persiste assinatura digital no perfil"
```

### Task 2: Captura de assinatura na página de Perfil

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `frontend/src/pages/PerfilPage.tsx`
- Test: `frontend/src/features/profile/interface.test.tsx`

**Interfaces:**
- Use `SignatureCanvas` from `react-signature-canvas`.
- Reuse `profileState.data.profile.signatureBase64` and `profileState` reload/update behavior.

- [ ] **Step 1: Install the capture dependency**

Run:

```bash
npm install react-signature-canvas
npm install -D @types/react-signature-canvas
```

- [ ] **Step 2: Write the failing UI test in `frontend/src/features/profile/interface.test.tsx`**

Render the profile page with a profile provider and assert the markup contains `Padrão de Assinatura`, `Limpar`, `Salvar Assinatura`, and a canvas host. The test must also assert an existing profile without a signature still renders normally.

- [ ] **Step 3: Implement the signature section**

Add a `signatureRef`, `signatureStatus`, and `signatureError` to `PerfilPage`. Render a responsive bordered drawing area with `SignatureCanvas`, `clearSignature()`, and `saveSignature()` calling `profileState.saveSignature(signatureRef.current.toDataURL('image/png'))`. On save, reject an empty canvas, display feedback, and rely on `PROFILE_UPDATED_EVENT` to refresh the profile. Use `profileState.data.profile.signatureBase64` as a preview or initial state without changing the existing professional-data editor.

- [ ] **Step 4: Run focused UI tests**

Run the profile interface test file and verify the new labels render without breaking existing profile editing tests.

- [ ] **Step 5: Commit the capture checkpoint**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/pages/PerfilPage.tsx frontend/src/pages/PerfilPage.test.tsx frontend/src/features/profile/interface.test.tsx
git commit -m "feat: adiciona captura de assinatura no perfil"
```

### Task 3: Passar a assinatura ao modelo do RDO

**Files:**
- Modify: `frontend/src/features/rdo/rdo.ts`
- Modify: `frontend/src/features/rdo/CreateRdoButton.tsx`
- Test: `frontend/src/features/rdo/rdo.test.ts`

**Interfaces:**
- Add `signatureBase64?: string` to `RdoFormData` and the returned `RdoData`.
- Keep `signatureName` as the logged-in profile name.

- [ ] **Step 1: Write failing model tests**

Extend `buildRdoData` tests with a Base64 PNG and assert the returned `signatureBase64` equals it. Add a case without Base64 and assert the field is undefined.

- [ ] **Step 2: Run the focused RDO tests and verify failure**

Run `npm test -- --run src/features/rdo/rdo.test.ts`; the new assertion must fail because `buildRdoData` currently drops the signature.

- [ ] **Step 3: Implement the model mapping**

Pass `signatureBase64: profile.signatureBase64` from `CreateRdoButton` into `buildRdoData`. Trim the value in `buildRdoData` and preserve it only when it matches the accepted PNG/JPEG data URL format; otherwise leave it undefined so the generator uses the fallback.

- [ ] **Step 4: Run the focused tests**

Run `npm test -- --run src/features/rdo/rdo.test.ts`; all model tests must pass.

### Task 4: Injetar assinatura no PDF e Word

**Files:**
- Modify: `frontend/src/features/rdo/rdo.ts`
- Test: `frontend/src/features/rdo/rdo.test.ts`

**Interfaces:**
- PDF uses `jsPDF.addImage(signatureBase64, 'PNG', x, y, width, height)`.
- Word uses `ImageRun` with bytes decoded from the Base64 payload.

- [ ] **Step 1: Add generator tests for both paths**

Add a small Base64 PNG fixture and test PDF generation does not throw with a signature. Add a test for the Base64 decoder used by Word, asserting the decoded byte array is non-empty. Keep a no-signature test proving the fallback path remains available.

- [ ] **Step 2: Implement a shared Base64 decoder**

Create a helper in `rdo.ts` that extracts the MIME and payload from `data:image/png;base64,...`, decodes with `atob` in the browser, and returns `Uint8Array`. Return `null` for invalid data and never let malformed optional signatures break document generation.

- [ ] **Step 3: Update PDF signature layout**

On the final page, reserve the existing signature area. If `signatureBase64` is valid, add the image centered above `signatureName` with natural dimensions around 42mm wide and a maximum height of 16mm; otherwise draw `___________________________` as today. Keep the professional name below either path.

- [ ] **Step 4: Update Word signature layout**

Replace the unconditional line paragraph with an `ImageRun` paragraph when decoded signature bytes exist, using approximately 160x60 pixels and centered alignment. Keep the line paragraph for the fallback path and always render the professional name underneath.

- [ ] **Step 5: Run the generator tests**

Run `npm test -- --run src/features/rdo/rdo.test.ts`; PDF, Word byte decoding, signed, and unsigned cases must pass.

### Task 5: Full verification and requested release commit

**Files:**
- Review only: all files changed in Tasks 1-4.

- [ ] **Step 1: Run formatting/diff checks**

```bash
git diff --check
```

- [ ] **Step 2: Run the full validation suite**

```bash
npm run typecheck
npm run lint
npm test -- --run
npm run build
```

Expected: all commands exit successfully; the existing Vite chunk-size warning may remain non-fatal.

- [ ] **Step 3: Confirm only intended files are staged**

Do not stage the pre-existing MSAL worktree changes (`frontend/.gitignore`, `frontend/src/authConfig.ts`, `frontend/src/main.tsx`, `frontend/src/pages/LoginPage.tsx`, `frontend/src/pages/LoginPage.test.tsx`, `frontend/src/pages/NovoApontamentoPage.tsx`, `.env.example`, or `src/config/msalConfig.ts`).

- [ ] **Step 4: Create the requested functional commit and push**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/features/profile/types.ts frontend/src/services/profileService.ts frontend/src/services/profileService.test.ts frontend/src/pages/PerfilPage.tsx frontend/src/features/profile/interface.test.tsx frontend/src/features/rdo/rdo.ts frontend/src/features/rdo/rdo.test.ts frontend/src/features/rdo/CreateRdoButton.tsx
git commit -m "feat: adiciona captura de assinatura no perfil e injeta nos RDOs"
git push origin main
```
