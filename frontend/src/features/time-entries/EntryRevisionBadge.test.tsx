import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EntryRevisionBadge, EntryRevisionDetails } from './EntryRevisionBadge'

describe('indicador de revisão do apontamento', () => {
  it('não mostra badge para a versão inicial', () => {
    const markup = renderToStaticMarkup(<><EntryRevisionBadge version={1} /><EntryRevisionDetails version={1} updatedAt="2026-07-20T23:51:00.000Z" /></>)
    expect(markup).toBe('')
  })

  it('mostra badge, data, horário e versão a partir da versão 2', () => {
    const markup = renderToStaticMarkup(<><EntryRevisionBadge version={2} /><EntryRevisionDetails version={2} updatedAt="2026-07-20T23:51:00.000Z" /></>)
    expect(markup).toContain('Editado')
    expect(markup).toContain('data-status-tone="info"')
    expect(markup).toContain('Editado em 20/07/2026 às 20:51 · Versão 2')
  })

  it('não inventa data quando o registro legado não possui updatedAt válido', () => {
    const markup = renderToStaticMarkup(<><EntryRevisionBadge version={3} /><EntryRevisionDetails version={3} /></>)
    expect(markup).toContain('Editado')
    expect(markup).toContain('Versão 3')
    expect(markup).not.toContain('Invalid')
    expect(markup).not.toContain('01/01/1970')
  })
})
