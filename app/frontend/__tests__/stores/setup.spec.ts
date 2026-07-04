import { describe, it, expect, vi } from 'vitest'
import { useSetupStore } from '@/stores/setup'

function mockFetch(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  })
}

describe('useSetupStore', () => {
  describe('initial state', () => {
    it('starts with setupRequired as null', () => {
      const store = useSetupStore()
      expect(store.setupRequired).toBeNull()
    })
  })

  describe('checkStatus', () => {
    it('returns true and caches the value when the API says setup is required', async () => {
      globalThis.fetch = mockFetch({ setup_required: true })
      const store = useSetupStore()

      const result = await store.checkStatus()

      expect(result).toBe(true)
      expect(store.setupRequired).toBe(true)
    })

    it('returns false and caches the value when the API says setup is not required', async () => {
      globalThis.fetch = mockFetch({ setup_required: false })
      const store = useSetupStore()

      const result = await store.checkStatus()

      expect(result).toBe(false)
      expect(store.setupRequired).toBe(false)
    })

    it('returns the cached value on subsequent calls without fetching again', async () => {
      globalThis.fetch = mockFetch({ setup_required: true })
      const store = useSetupStore()

      await store.checkStatus()
      await store.checkStatus()

      expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('markComplete', () => {
    it('sets setupRequired to false', () => {
      const store = useSetupStore()

      store.markComplete()

      expect(store.setupRequired).toBe(false)
    })

    it('overrides a true value that was cached by checkStatus', async () => {
      globalThis.fetch = mockFetch({ setup_required: true })
      const store = useSetupStore()
      await store.checkStatus()

      store.markComplete()

      expect(store.setupRequired).toBe(false)
    })
  })
})
