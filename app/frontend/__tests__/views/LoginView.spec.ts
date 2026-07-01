import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import { useAuthStore } from '@/stores/auth'

function makeRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: { template: '<div>dashboard</div>' } },
      { path: '/login', name: 'login', component: LoginView },
    ],
  })
}

async function mountLogin() {
  const router = makeRouter()
  await router.push('/login')
  await router.isReady()
  const wrapper = mount(LoginView, { global: { plugins: [router] } })
  return { wrapper, router }
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('LoginView', () => {
  it('renders email and password fields', async () => {
    const { wrapper } = await mountLogin()
    expect(wrapper.find('#email').exists()).toBe(true)
    expect(wrapper.find('#password').exists()).toBe(true)
  })

  it('renders the sign-in button', async () => {
    const { wrapper } = await mountLogin()
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('shows validation errors when submitting empty form', async () => {
    const { wrapper } = await mountLogin()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Email is required')
    expect(wrapper.text()).toContain('Password is required')
  })

  it('calls authStore.login with trimmed email and password', async () => {
    const { wrapper } = await mountLogin()
    const authStore = useAuthStore()
    authStore.login = vi.fn().mockResolvedValue({ id: 1, email: 'test@example.com' })

    await wrapper.find('#email').setValue('  test@example.com  ')
    await wrapper.find('#password').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(authStore.login).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('redirects to dashboard on successful login', async () => {
    const { wrapper, router } = await mountLogin()
    const authStore = useAuthStore()
    authStore.login = vi.fn().mockResolvedValue({ id: 1, email: 'test@example.com' })

    await wrapper.find('#email').setValue('test@example.com')
    await wrapper.find('#password').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('shows error message on failed login', async () => {
    const { wrapper } = await mountLogin()
    const authStore = useAuthStore()
    authStore.login = vi.fn().mockRejectedValue(
      Object.assign(new Error('Unauthorized'), {
        data: { errors: { base: ['Invalid email or password'] } },
      }),
    )

    await wrapper.find('#email').setValue('bad@example.com')
    await wrapper.find('#password').setValue('wrong')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Invalid email or password')
  })
})
