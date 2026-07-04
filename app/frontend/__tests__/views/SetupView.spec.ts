import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import SetupView from '@/views/SetupView.vue'
import { useSetupStore } from '@/stores/setup'

function mockFetch(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  })
}

function makeRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/setup', name: 'setup', component: SetupView },
      { path: '/login', name: 'login', component: { template: '<div />' } },
    ],
  })
}

async function mountSetup() {
  const router = makeRouter()
  await router.push('/setup')
  await router.isReady()
  const wrapper = mount(SetupView, { global: { plugins: [router] } })
  return { wrapper, router }
}

async function completeStep1(wrapper: VueWrapper) {
  globalThis.fetch = mockFetch({
    user: { id: 1, email: 'test@example.com' },
    csrf_token: 'new-token',
  })
  await wrapper.find('#email').setValue('test@example.com')
  await wrapper.find('#password').setValue('password123')
  await wrapper.find('#password-confirm').setValue('password123')
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

beforeEach(() => {
  document.head.innerHTML = '<meta name="csrf-token" content="test-token">'
})

describe('SetupView', () => {
  describe('step 1 — account creation', () => {
    it('renders email, password, and confirm password fields', async () => {
      const { wrapper } = await mountSetup()

      expect(wrapper.find('#email').exists()).toBe(true)
      expect(wrapper.find('#password').exists()).toBe(true)
      expect(wrapper.find('#password-confirm').exists()).toBe(true)
    })

    it('renders the Create Account submit button', async () => {
      const { wrapper } = await mountSetup()

      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    it('toggles password visibility when the eye icon is clicked', async () => {
      const { wrapper } = await mountSetup()

      expect(wrapper.find('#password').attributes('type')).toBe('password')

      await wrapper.findAll('.p-inputicon')[0].trigger('click')

      expect(wrapper.find('#password').attributes('type')).toBe('text')
    })

    it('toggles confirm password visibility when the second eye icon is clicked', async () => {
      const { wrapper } = await mountSetup()

      expect(wrapper.find('#password-confirm').attributes('type')).toBe('password')

      await wrapper.findAll('.p-inputicon')[1].trigger('click')

      expect(wrapper.find('#password-confirm').attributes('type')).toBe('text')
    })

    it('shows an email field error returned by the API', async () => {
      globalThis.fetch = mockFetch({ errors: { email: ['has already been taken'] } }, false, 422)
      const { wrapper } = await mountSetup()
      await wrapper.find('#email').setValue('taken@example.com')
      await wrapper.find('#password').setValue('password123')
      await wrapper.find('#password-confirm').setValue('password123')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.text()).toContain('has already been taken')
    })

    it('shows a password field error returned by the API', async () => {
      globalThis.fetch = mockFetch(
        { errors: { password: ['is too short (minimum is 8 characters)'] } },
        false,
        422,
      )
      const { wrapper } = await mountSetup()
      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('abc')
      await wrapper.find('#password-confirm').setValue('abc')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.text()).toContain('is too short (minimum is 8 characters)')
    })

    it('shows a password_confirmation error returned by the API', async () => {
      globalThis.fetch = mockFetch(
        { errors: { password_confirmation: ["doesn't match Password"] } },
        false,
        422,
      )
      const { wrapper } = await mountSetup()
      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('password123')
      await wrapper.find('#password-confirm').setValue('different')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.text()).toContain("doesn't match Password")
    })

    it('shows a generic error when the API returns no field errors', async () => {
      globalThis.fetch = mockFetch({ error: 'Server Error' }, false, 500)
      const { wrapper } = await mountSetup()
      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('password123')
      await wrapper.find('#password-confirm').setValue('password123')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.text()).toContain('Something went wrong')
    })

    it('sends the correct payload to the API on submit', async () => {
      globalThis.fetch = mockFetch({ user: { id: 1, email: 'test@example.com' }, csrf_token: 'tok' })
      const { wrapper } = await mountSetup()
      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('password123')
      await wrapper.find('#password-confirm').setValue('password123')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/v1/setup/account',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            user: {
              email: 'test@example.com',
              password: 'password123',
              password_confirmation: 'password123',
            },
          }),
        }),
      )
    })

    it('marks setup as complete in the store after success', async () => {
      const { wrapper } = await mountSetup()
      const setupStore = useSetupStore()
      setupStore.markComplete = vi.fn()
      globalThis.fetch = mockFetch({ user: { id: 1, email: 'test@example.com' }, csrf_token: 'tok' })
      await wrapper.find('#email').setValue('test@example.com')
      await wrapper.find('#password').setValue('password123')
      await wrapper.find('#password-confirm').setValue('password123')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(setupStore.markComplete).toHaveBeenCalled()
    })

    it('advances to step 2 after successful account creation', async () => {
      const { wrapper } = await mountSetup()
      await completeStep1(wrapper)

      expect(wrapper.text()).toContain('Configure HTTPS')
    })
  })

  describe('step 2 — SSL configuration', () => {
    it('shows the self-signed and Let\'s Encrypt SSL options', async () => {
      const { wrapper } = await mountSetup()
      await completeStep1(wrapper)

      expect(wrapper.text()).toContain('Self-signed certificate')
      expect(wrapper.text()).toContain("Let's Encrypt")
    })

    it("shows domain and DNS provider fields when Let's Encrypt is selected", async () => {
      const { wrapper } = await mountSetup()
      await completeStep1(wrapper)

      await wrapper.findAll('.ssl-option')[1].trigger('click')

      expect(wrapper.find('#domain').exists()).toBe(true)
      expect(wrapper.find('#dns-provider').exists()).toBe(true)
      await wrapper.find('#domain').setValue('example.com')
    })

    it('shows the API token field when Cloudflare is selected as DNS provider', async () => {
      const { wrapper } = await mountSetup()
      await completeStep1(wrapper)

      await wrapper.findAll('.ssl-option')[1].trigger('click')
      await wrapper.findComponent({ name: 'Select' }).vm.$emit('update:modelValue', 'cloudflare')
      await flushPromises()

      expect(wrapper.find('#api-token').exists()).toBe(true)
      await wrapper.find('#api-token').setValue('cf-token')
    })

    it('shows IONOS credential fields when IONOS is selected as DNS provider', async () => {
      const { wrapper } = await mountSetup()
      await completeStep1(wrapper)

      await wrapper.findAll('.ssl-option')[1].trigger('click')
      await wrapper.findComponent({ name: 'Select' }).vm.$emit('update:modelValue', 'ionos')
      await flushPromises()

      expect(wrapper.find('#ionos-public-prefix').exists()).toBe(true)
      expect(wrapper.find('#ionos-api-key').exists()).toBe(true)
      await wrapper.find('#ionos-public-prefix').setValue('abc123')
      await wrapper.find('#ionos-api-key').setValue('apikey')
    })

    it('shows GoDaddy credential fields when GoDaddy is selected as DNS provider', async () => {
      const { wrapper } = await mountSetup()
      await completeStep1(wrapper)

      await wrapper.findAll('.ssl-option')[1].trigger('click')
      await wrapper.findComponent({ name: 'Select' }).vm.$emit('update:modelValue', 'godaddy')
      await flushPromises()

      expect(wrapper.find('#godaddy-api-key').exists()).toBe(true)
      expect(wrapper.find('#godaddy-api-secret').exists()).toBe(true)
      await wrapper.find('#godaddy-api-key').setValue('apikey')
      await wrapper.find('#godaddy-api-secret').setValue('apisecret')
    })

    it('shows the Route 53 info message when Route 53 is selected as DNS provider', async () => {
      const { wrapper } = await mountSetup()
      await completeStep1(wrapper)

      await wrapper.findAll('.ssl-option')[1].trigger('click')
      await wrapper.findComponent({ name: 'Select' }).vm.$emit('update:modelValue', 'route53')
      await flushPromises()

      expect(wrapper.text()).toContain('Route 53 uses your AWS credentials')
    })

    it('advances to step 3 when "Skip for now" is clicked', async () => {
      const { wrapper } = await mountSetup()
      await completeStep1(wrapper)

      const skipButton = wrapper.findAll('button').find(b => b.text().includes('Skip'))!
      await skipButton.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain("You're all set!")
    })

    it('advances to step 3 after successful certificate generation', async () => {
      const { wrapper } = await mountSetup()
      await completeStep1(wrapper)

      await wrapper.findAll('.ssl-option')[0].trigger('click')
      globalThis.fetch = mockFetch({ success: true })
      const generateButton = wrapper.findAll('button').find(b => b.text().includes('Generate'))!
      await generateButton.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain("You're all set!")
    })

    it('shows an error when certificate generation fails', async () => {
      const { wrapper } = await mountSetup()
      await completeStep1(wrapper)

      await wrapper.findAll('.ssl-option')[0].trigger('click')
      globalThis.fetch = mockFetch({ errors: { base: ['Failed'] } }, false, 422)
      const generateButton = wrapper.findAll('button').find(b => b.text().includes('Generate'))!
      await generateButton.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Certificate generation failed')
    })
  })

  describe('step 3 — complete', () => {
    it('navigates to the login page when "Go to Login" is clicked', async () => {
      const { wrapper, router } = await mountSetup()
      await completeStep1(wrapper)

      const skipButton = wrapper.findAll('button').find(b => b.text().includes('Skip'))!
      await skipButton.trigger('click')
      await flushPromises()

      const loginButton = wrapper.findAll('button').find(b => b.text().includes('Go to Login'))!
      await loginButton.trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.name).toBe('login')
    })
  })
})
