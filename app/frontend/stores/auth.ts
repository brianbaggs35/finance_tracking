import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, updateCsrfToken } from '@/composables/useApi'

export interface AuthUser {
  id: number
  email: string
}

interface SignInResponse {
  user: AuthUser
  csrf_token: string
}

interface MeResponse {
  user: AuthUser | null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const initialized = ref(false)

  const isAuthenticated = computed(() => user.value !== null)

  async function fetchCurrentUser(): Promise<void> {
    try {
      const data = await api.get<MeResponse>('/api/v1/auth/me')
      user.value = data.user
    } catch {
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  async function login(email: string, password: string): Promise<AuthUser> {
    const data = await api.post<SignInResponse>('/api/v1/auth/sign_in', {
      user: { email, password },
    })
    user.value = data.user
    updateCsrfToken(data.csrf_token)
    return data.user
  }

  async function logout(): Promise<void> {
    await api.delete('/api/v1/auth/sign_out')
    user.value = null
  }

  return { user, initialized, isAuthenticated, fetchCurrentUser, login, logout }
})
