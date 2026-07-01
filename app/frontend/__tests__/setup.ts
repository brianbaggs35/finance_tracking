import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Aura from '@primeuix/themes/aura'
import { beforeEach, vi } from 'vitest'

config.global.plugins = [
  [PrimeVue, { theme: { preset: Aura } }],
  ToastService,
]

beforeEach(() => {
  setActivePinia(createPinia())
})

// Stub fetch globally so tests don't hit the network
globalThis.fetch = vi.fn()

// jsdom doesn't implement matchMedia (used by PrimeVue Menubar)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
