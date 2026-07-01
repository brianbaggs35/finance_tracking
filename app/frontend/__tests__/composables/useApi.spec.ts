import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api, updateCsrfToken } from '@/composables/useApi'

beforeEach(() => {
  document.head.innerHTML = '<meta name="csrf-token" content="test-csrf">'
})

describe('api', () => {
  it('GET sends Accept and CSRF headers', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    })

    await api.get('/test')

    expect(fetch).toHaveBeenCalledWith('/test', expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({ 'X-CSRF-Token': 'test-csrf' }),
    }))
  })

  it('POST serializes the body as JSON', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    })

    await api.post('/test', { name: 'value' })

    expect(fetch).toHaveBeenCalledWith('/test', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'value' }),
    }))
  })

  it('throws with status and data on non-ok responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable',
      json: () => Promise.resolve({ error: 'Bad input' }),
    })

    const error = await api.get('/bad').catch((e) => e)

    expect(error).toBeInstanceOf(Error)
    expect((error as { status: number }).status).toBe(422)
    expect((error as { data: { error: string } }).data.error).toBe('Bad input')
  })
})

describe('updateCsrfToken', () => {
  it('updates the csrf-token meta tag content', () => {
    updateCsrfToken('new-token-value')
    const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
    expect(meta?.content).toBe('new-token-value')
  })
})
