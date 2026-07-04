<template>
  <div class="login-page">
    <div class="login-header">
      <svg
        class="login-logo"
        width="72"
        height="72"
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="36"
          cy="36"
          r="36"
          fill="#3b7cf4"
        />
        <polyline
          points="14,50 26,38 36,43 52,24"
          stroke="white"
          stroke-width="3.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
        />
        <circle
          cx="52"
          cy="24"
          r="4.5"
          fill="white"
        />
        <line
          x1="14"
          y1="56"
          x2="58"
          y2="56"
          stroke="rgba(255,255,255,0.3)"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
      <h1 class="login-title">
        Finance Tracker
      </h1>
    </div>

    <Card class="login-card">
      <template #content>
        <p class="login-subtitle">
          Sign in to your account
        </p>

        <Message
          v-if="errorMessage"
          severity="error"
          :closable="false"
          class="login-card__error"
        >
          {{ errorMessage }}
        </Message>

        <form
          class="login-form"
          @submit.prevent="handleSubmit"
        >
          <div class="login-form__field">
            <IftaLabel>
              <InputText
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                :invalid="!!errors.email"
                fluid
              />
              <label for="email">Email</label>
            </IftaLabel>
            <small
              v-if="errors.email"
              class="login-form__error-text"
            >{{ errors.email }}</small>
          </div>

          <div class="login-form__field">
            <IftaLabel>
              <IconField>
                <InputText
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  :invalid="!!errors.password"
                  fluid
                />
                <InputIcon
                  :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
                  @click="showPassword = !showPassword"
                />
              </IconField>
              <label for="password">Password</label>
            </IftaLabel>
            <small
              v-if="errors.password"
              class="login-form__error-text"
            >{{ errors.password }}</small>
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
import IftaLabel from 'primevue/iftalabel'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #1a2744;
  padding: 1rem;
  gap: 1.5rem;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.login-logo {
  filter: drop-shadow(0 4px 12px rgba(59, 124, 244, 0.4));
}

.login-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  letter-spacing: -0.02em;
}

.login-card {
  width: 100%;
  max-width: 420px;
}

.login-subtitle {
  margin: 0 0 1.5rem;
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
  text-align: center;
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

.login-form__field :deep(.p-iconfield) {
  width: 100%;
  position: relative;
}

.login-form__field :deep(.p-iconfield .p-inputicon) {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 0.75rem;
  cursor: pointer;
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
