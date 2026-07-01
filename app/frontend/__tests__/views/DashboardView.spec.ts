import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import { useAuthStore } from '@/stores/auth'

function makeRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: DashboardView },
      { path: '/login', name: 'login', component: { template: '<div>login</div>' } },
    ],
  })
}

async function mountDashboard() {
  const router = makeRouter()
  await router.push('/')
  await router.isReady()
  return mount(DashboardView, { global: { plugins: [router] } })
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('DashboardView', () => {
  it('shows a loading spinner initially', async () => {
    globalThis.fetch = vi.fn().mockImplementation(() => new Promise(() => {}))
    const wrapper = await mountDashboard()
    expect(wrapper.findComponent({ name: 'ProgressSpinner' }).exists()).toBe(true)
  })

  it('renders dashboard content after loading', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        user: { id: 1, email: 'user@example.com' },
        stats: { message: 'Welcome to your dashboard' },
      }),
    })
    const authStore = useAuthStore()
    authStore.user = { id: 1, email: 'user@example.com' }

    const wrapper = await mountDashboard()
    await flushPromises()

    expect(wrapper.text()).toContain('Dashboard')
    expect(wrapper.text()).toContain('Welcome to your dashboard')
  })

  it('shows the authenticated user email', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        user: { id: 1, email: 'hello@example.com' },
        stats: { message: 'Ready' },
      }),
    })
    const authStore = useAuthStore()
    authStore.user = { id: 1, email: 'hello@example.com' }

    const wrapper = await mountDashboard()
    await flushPromises()

    expect(wrapper.text()).toContain('hello@example.com')
  })
})
