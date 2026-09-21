// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CriarAviso } from './CriarAviso'
import { ANNOUNCEMENTS_STORAGE_KEY, parseStoredAnnouncements } from './types'
import { SessionContext } from '../session/sessionContext'
import type { SessionContextValue } from '../session/sessionContext'

const session: SessionContextValue['session'] = {
  id: 'director-001',
  name: 'Diretoria',
  role: 'DIRECTOR_ADMIN',
  createdAt: '2026-09-21T10:00:00.000Z',
  explicitLoginAt: '2026-09-21T10:00:00.000Z',
  isDemo: true,
  version: 2,
}

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  localStorage.clear()
  act(() => root.render(
    <SessionContext.Provider value={{ session, profile: null, isLoading: false, signIn: vi.fn(), signOut: vi.fn() }}>
      <CriarAviso />
    </SessionContext.Provider>,
  ))
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  localStorage.clear()
  vi.unstubAllGlobals()
})

function setField(selector: string, value: string) {
  const field = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)
  expect(field).not.toBeNull()
  act(() => {
    const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(field, value)
    field!.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('CriarAviso', () => {
  it('salva um aviso completo para a Diretoria sem quebrar a tela', () => {
    setField('input', 'Fechamento do ciclo')
    setField('textarea', 'Regularize os apontamentos pendentes.')

    act(() => container.querySelector('form')!.requestSubmit())

    const saved = parseStoredAnnouncements(JSON.parse(localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY) ?? '[]'))
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({
      titulo: 'Fechamento do ciclo',
      mensagem: 'Regularize os apontamentos pendentes.',
      autor: 'Diretoria',
      tipo: 'info',
      dataPublicacao: expect.any(String),
    })
    expect(container.textContent).toContain('Aviso enviado com sucesso.')
  })

  it('normaliza registros incompletos antes da renderização', () => {
    expect(parseStoredAnnouncements([{ id: 'partial', titulo: null, tipo: 'desconhecido' }])).toEqual([
      expect.objectContaining({ id: 'partial', titulo: 'Aviso sem título', tipo: 'info' }),
    ])
  })
})
