import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import AppNav from '@/components/AppNav.vue'
import { useAuthStore } from '@/stores/auth'

function makeRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: { template: '<div />' } },
    ],
  })
}

async function mountAppNav() {
  const router = makeRouter()
  await router.push('/')
  await router.isReady()
  return { wrapper: mount(AppNav, { global: { plugins: [router] } }), router }
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('AppNav', () => {
  it('renders the brand name', async () => {
    const { wrapper } = await mountAppNav()
    expect(wrapper.text()).toContain('Template App')
  })

  it('shows the user email when logged in', async () => {
    const auth = useAuthStore()
    auth.user = { id: 1, email: 'nav@example.com' }
    const { wrapper } = await mountAppNav()
    expect(wrapper.text()).toContain('nav@example.com')
  })

  it('shows the first letter of the email as avatar label', async () => {
    const auth = useAuthStore()
    auth.user = { id: 1, email: 'zara@example.com' }
    const { wrapper } = await mountAppNav()
    expect(wrapper.text()).toContain('Z')
  })

  it('calls logout and redirects to login on sign-out', async () => {
    const { wrapper, router } = await mountAppNav()
    const auth = useAuthStore()
    auth.user = { id: 1, email: 'user@example.com' }
    auth.logout = vi.fn().mockResolvedValue(undefined)

    const signOutButton = wrapper.find('button')
    await signOutButton.trigger('click')
    await flushPromises()

    expect(auth.logout).toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('login')
  })
})
