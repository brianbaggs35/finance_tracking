import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

function mockFetch(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  document.head.innerHTML = '<meta name="csrf-token" content="test-token">'
})

describe('useAuthStore', () => {
  describe('fetchCurrentUser', () => {
    it('sets user when API returns a user', async () => {
      globalThis.fetch = mockFetch({ user: { id: 1, email: 'test@example.com' } })
      const store = useAuthStore()

      await store.fetchCurrentUser()

      expect(store.user).toEqual({ id: 1, email: 'test@example.com' })
      expect(store.initialized).toBe(true)
      expect(store.isAuthenticated).toBe(true)
    })

    it('sets user to null when API returns 401', async () => {
      globalThis.fetch = mockFetch({ error: 'Unauthorized' }, false, 401)
      const store = useAuthStore()

      await store.fetchCurrentUser()

      expect(store.user).toBeNull()
      expect(store.initialized).toBe(true)
      expect(store.isAuthenticated).toBe(false)
    })

    it('sets user to null on network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      const store = useAuthStore()

      await store.fetchCurrentUser()

      expect(store.user).toBeNull()
      expect(store.initialized).toBe(true)
    })
  })

  describe('login', () => {
    it('sets user and updates csrf token on success', async () => {
      const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')!
      globalThis.fetch = mockFetch({
        user: { id: 2, email: 'user@example.com' },
        csrf_token: 'new-token',
      })
      const store = useAuthStore()

      const user = await store.login('user@example.com', 'password')

      expect(user).toEqual({ id: 2, email: 'user@example.com' })
      expect(store.isAuthenticated).toBe(true)
      expect(meta.content).toBe('new-token')
    })

    it('throws on failed login', async () => {
      globalThis.fetch = mockFetch(
        { errors: { base: ['Invalid email or password'] } },
        false,
        422,
      )
      const store = useAuthStore()

      await expect(store.login('bad@example.com', 'wrong')).rejects.toThrow()
      expect(store.user).toBeNull()
    })
  })

  describe('logout', () => {
    it('clears the user', async () => {
      globalThis.fetch = mockFetch({})
      const store = useAuthStore()
      store.user = { id: 1, email: 'test@example.com' }

      await store.logout()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })
})
