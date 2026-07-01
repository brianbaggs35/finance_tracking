<template>
  <div class="login-page">
    <Card class="login-card">
      <template #header>
        <div class="login-card__header">
          <h1 class="login-card__title">Template App</h1>
          <p class="login-card__subtitle">Sign in to your account</p>
        </div>
      </template>

      <template #content>
        <Message v-if="errorMessage" severity="error" :closable="false" class="login-card__error">
          {{ errorMessage }}
        </Message>

        <form class="login-form" @submit.prevent="handleSubmit">
          <div class="login-form__field">
            <label for="email" class="login-form__label">Email</label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="you@example.com"
              autocomplete="email"
              :invalid="!!errors.email"
              class="login-form__input"
            />
            <small v-if="errors.email" class="login-form__error-text">{{ errors.email }}</small>
          </div>

          <div class="login-form__field">
            <label for="password" class="login-form__label">Password</label>
            <Password
              input-id="password"
              v-model="password"
              :feedback="false"
              toggle-mask
              autocomplete="current-password"
              :invalid="!!errors.password"
              class="login-form__input"
            />
            <small v-if="errors.password" class="login-form__error-text">{{ errors.password }}</small>
          </div>

          <Button
            type="submit"
            label="Sign In"
            :loading="loading"
            icon="pi pi-sign-in"
            class="login-form__submit"
          />
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const errors = reactive({ email: '', password: '' })

function validate(): boolean {
  errors.email = ''
  errors.password = ''
  let valid = true

  if (!email.value.trim()) {
    errors.email = 'Email is required'
    valid = false
  }

  if (!password.value) {
    errors.password = 'Password is required'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  errorMessage.value = ''
  if (!validate()) return

  loading.value = true
  try {
    await authStore.login(email.value.trim(), password.value)
    router.push({ name: 'dashboard' })
  } catch (err) {
    const e = err as { data?: { errors?: { base?: string[] } } }
    errorMessage.value = e.data?.errors?.base?.[0] ?? 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--p-surface-ground);
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 420px;
}

.login-card__header {
  padding: 2rem 2rem 0;
  text-align: center;
}

.login-card__title {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--p-text-color);
}

.login-card__subtitle {
  margin: 0;
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
}

.login-card__error {
  margin-bottom: 1rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.login-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.login-form__label {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--p-text-color);
}

.login-form__input {
  width: 100%;
}

.login-form__error-text {
  color: var(--p-red-500);
  font-size: 0.8rem;
}

.login-form__submit {
  width: 100%;
  margin-top: 0.5rem;
}
</style>
