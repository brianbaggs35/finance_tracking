<template>
  <div class="setup-page">
    <div class="setup-header">
      <svg
        class="setup-logo"
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
      <h1 class="setup-title">
        Finance Tracker
      </h1>
      <p class="setup-subtitle">
        Initial Setup
      </p>
    </div>

    <Card class="setup-card">
      <template #content>
        <Stepper
          v-model:value="activeStep"
          linear
        >
          <StepList>
            <Step value="1">
              Account
            </Step>
            <Step value="2">
              Security
            </Step>
            <Step value="3">
              Complete
            </Step>
          </StepList>

          <StepPanels>
            <StepPanel value="1">
              <div class="step-content">
                <h2 class="step-heading">
                  Create your account
                </h2>
                <p class="step-description">
                  This will be the only account for this app.
                </p>

                <Message
                  v-if="accountError"
                  severity="error"
                  :closable="false"
                  class="step-message"
                >
                  {{ accountError }}
                </Message>

                <form
                  class="step-form"
                  @submit.prevent="handleCreateAccount"
                >
                  <div class="form-field">
                    <IftaLabel>
                      <InputText
                        id="email"
                        v-model="email"
                        type="email"
                        autocomplete="email"
                        :invalid="!!fieldErrors.email"
                        fluid
                      />
                      <label for="email">Email</label>
                    </IftaLabel>
                    <small
                      v-if="fieldErrors.email"
                      class="field-error"
                    >{{ fieldErrors.email }}</small>
                  </div>

                  <div class="form-field">
                    <IftaLabel>
                      <IconField>
                        <InputText
                          id="password"
                          v-model="password"
                          :type="showPassword ? 'text' : 'password'"
                          autocomplete="new-password"
                          :invalid="!!fieldErrors.password"
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
                      v-if="fieldErrors.password"
                      class="field-error"
                    >{{ fieldErrors.password }}</small>
                  </div>

                  <div class="form-field">
                    <IftaLabel>
                      <IconField>
                        <InputText
                          id="password-confirm"
                          v-model="passwordConfirmation"
                          :type="showConfirmPassword ? 'text' : 'password'"
                          autocomplete="new-password"
                          :invalid="!!fieldErrors.passwordConfirmation"
                          fluid
                        />
                        <InputIcon
                          :class="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
                          @click="showConfirmPassword = !showConfirmPassword"
                        />
                      </IconField>
                      <label for="password-confirm">Confirm Password</label>
                    </IftaLabel>
                    <small
                      v-if="fieldErrors.passwordConfirmation"
                      class="field-error"
                    >{{ fieldErrors.passwordConfirmation }}</small>
                  </div>

                  <Button
                    type="submit"
                    label="Create Account"
                    icon="pi pi-user-plus"
                    :loading="accountLoading"
                    class="step-submit"
                  />
                </form>
              </div>
            </StepPanel>

            <StepPanel value="2">
              <div class="step-content">
                <h2 class="step-heading">
                  Configure HTTPS
                </h2>
                <p class="step-description">
                  Secure your app with SSL. You can skip this and configure it later.
                </p>

                <Message
                  v-if="sslError"
                  severity="error"
                  :closable="false"
                  class="step-message"
                >
                  {{ sslError }}
                </Message>

                <div class="ssl-options">
                  <div
                    class="ssl-option"
                    :class="{ 'ssl-option--active': sslType === 'selfsigned' }"
                    @click="sslType = 'selfsigned'"
                  >
                    <i class="pi pi-lock" />
                    <div>
                      <strong>Self-signed certificate</strong>
                      <p>No domain needed. Browser will show a warning you can permanently dismiss.</p>
                    </div>
                  </div>

                  <div
                    class="ssl-option"
                    :class="{ 'ssl-option--active': sslType === 'letsencrypt' }"
                    @click="sslType = 'letsencrypt'"
                  >
                    <i class="pi pi-shield" />
                    <div>
                      <strong>Let's Encrypt</strong>
                      <p>Free, trusted certificate. Requires a domain name and DNS provider API key.</p>
                    </div>
                  </div>
                </div>

                <div
                  v-if="sslType === 'letsencrypt'"
                  class="letsencrypt-fields"
                >
                  <div class="form-field">
                    <IftaLabel>
                      <InputText
                        id="domain"
                        v-model="domain"
                        placeholder="example.com"
                        fluid
                      />
                      <label for="domain">Domain</label>
                    </IftaLabel>
                  </div>

                  <div class="form-field">
                    <IftaLabel>
                      <Select
                        id="dns-provider"
                        v-model="provider"
                        :options="providers"
                        option-label="label"
                        option-value="value"
                        placeholder="Select DNS provider"
                        fluid
                      />
                      <label for="dns-provider">DNS Provider</label>
                    </IftaLabel>
                  </div>

                  <template v-if="provider === 'cloudflare' || provider === 'digitalocean'">
                    <div class="form-field">
                      <IftaLabel>
                        <InputText
                          id="api-token"
                          v-model="credentials.api_token"
                          fluid
                        />
                        <label for="api-token">API Token</label>
                      </IftaLabel>
                    </div>
                  </template>

                  <template v-if="provider === 'ionos'">
                    <div class="form-field">
                      <IftaLabel>
                        <InputText
                          id="ionos-public-prefix"
                          v-model="credentials.public_prefix"
                          fluid
                        />
                        <label for="ionos-public-prefix">Public Prefix</label>
                      </IftaLabel>
                    </div>
                    <div class="form-field">
                      <IftaLabel>
                        <InputText
                          id="ionos-api-key"
                          v-model="credentials.api_key"
                          fluid
                        />
                        <label for="ionos-api-key">API Key</label>
                      </IftaLabel>
                    </div>
                  </template>

                  <template v-if="provider === 'godaddy'">
                    <div class="form-field">
                      <IftaLabel>
                        <InputText
                          id="godaddy-api-key"
                          v-model="credentials.api_key"
                          fluid
                        />
                        <label for="godaddy-api-key">API Key</label>
                      </IftaLabel>
                    </div>
                    <div class="form-field">
                      <IftaLabel>
                        <InputText
                          id="godaddy-api-secret"
                          v-model="credentials.api_secret"
                          fluid
                        />
                        <label for="godaddy-api-secret">API Secret</label>
                      </IftaLabel>
                    </div>
                  </template>

                  <Message
                    v-if="provider === 'route53'"
                    severity="info"
                    :closable="false"
                  >
                    Route 53 uses your AWS credentials from environment variables. No API key needed here.
                  </Message>
                </div>

                <div class="step-actions">
                  <Button
                    label="Generate Certificate"
                    icon="pi pi-shield"
                    :loading="sslLoading"
                    :disabled="!sslType"
                    @click="handleConfigureSsl"
                  />
                  <Button
                    label="Skip for now"
                    severity="secondary"
                    :disabled="sslLoading"
                    @click="activeStep = '3'"
                  />
                </div>
              </div>
            </StepPanel>

            <StepPanel value="3">
              <div class="step-content step-content--centered">
                <i class="pi pi-check-circle setup-complete-icon" />
                <h2 class="step-heading">
                  You're all set!
                </h2>
                <p class="step-description">
                  Your Finance Tracker is ready to use.
                </p>
                <Button
                  label="Go to Login"
                  icon="pi pi-sign-in"
                  @click="router.push({ name: 'login' })"
                />
              </div>
            </StepPanel>
          </StepPanels>
        </Stepper>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Stepper from 'primevue/stepper'
import StepList from 'primevue/steplist'
import Step from 'primevue/step'
import StepPanels from 'primevue/steppanels'
import StepPanel from 'primevue/steppanel'
import InputText from 'primevue/inputtext'
import IftaLabel from 'primevue/iftalabel'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Select from 'primevue/select'
import { api, updateCsrfToken } from '@/composables/useApi'
import { useSetupStore } from '@/stores/setup'

const router = useRouter()
const setupStore = useSetupStore()

const activeStep = ref('1')

const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const accountLoading = ref(false)
const accountError = ref('')
const fieldErrors = reactive({ email: '', password: '', passwordConfirmation: '' })

const sslType = ref('')
const domain = ref('')
const provider = ref('')
const credentials = reactive({
  api_token: '',
  public_prefix: '',
  api_key: '',
  api_secret: '',
})
const sslLoading = ref(false)
const sslError = ref('')

const providers = [
  { label: 'Cloudflare',             value: 'cloudflare' },
  { label: 'Ionos',                  value: 'ionos' },
  { label: 'DigitalOcean',           value: 'digitalocean' },
  { label: 'GoDaddy',                value: 'godaddy' },
  { label: 'Route 53 (AWS)',         value: 'route53' },
  { label: 'Other (HTTP challenge)', value: 'other' },
]

async function handleCreateAccount() {
  accountError.value = ''
  fieldErrors.email = ''
  fieldErrors.password = ''
  fieldErrors.passwordConfirmation = ''
  accountLoading.value = true

  try {
    const data = await api.post<{ user: { id: number; email: string }; csrf_token: string }>(
      '/api/v1/setup/account',
      { user: { email: email.value, password: password.value, password_confirmation: passwordConfirmation.value } }
    )
    updateCsrfToken(data.csrf_token)
    setupStore.markComplete()
    activeStep.value = '2'
  } catch (err) {
    const e = err as { data?: { errors?: Record<string, string[]> } }
    const errors = e.data?.errors ?? {}
    fieldErrors.email = errors.email?.[0] ?? ''
    fieldErrors.password = errors.password?.[0] ?? ''
    fieldErrors.passwordConfirmation = errors.password_confirmation?.[0] ?? ''
    if (!fieldErrors.email && !fieldErrors.password && !fieldErrors.passwordConfirmation) {
      accountError.value = 'Something went wrong. Please try again.'
    }
  } finally {
    accountLoading.value = false
  }
}

async function handleConfigureSsl() {
  sslError.value = ''
  sslLoading.value = true

  try {
    await api.post('/api/v1/setup/ssl', {
      ssl: {
        type: sslType.value,
        domain: domain.value || 'localhost',
        provider: provider.value,
        credentials,
      },
    })
    activeStep.value = '3'
  } catch {
    sslError.value = 'Certificate generation failed. Check your domain and credentials.'
  } finally {
    sslLoading.value = false
  }
}
</script>

<style scoped>
.setup-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #1a2744;
  padding: 1rem;
  gap: 1.5rem;
}

.setup-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.setup-logo {
  filter: drop-shadow(0 4px 12px rgba(59, 124, 244, 0.4));
}

.setup-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  letter-spacing: -0.02em;
}

.setup-subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.setup-card {
  width: 100%;
  max-width: 560px;
}

.step-content {
  padding: 1.5rem 0 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.step-content--centered {
  align-items: center;
  text-align: center;
  padding: 2rem 0;
}

.step-heading {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--p-text-color);
}

.step-description {
  margin: 0;
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
}

.step-message {
  margin: 0;
}

.step-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-field :deep(.p-iconfield) {
  width: 100%;
  position: relative;
}

.form-field :deep(.p-iconfield .p-inputicon) {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 0.75rem;
  cursor: pointer;
}

.field-error {
  color: var(--p-red-500);
  font-size: 0.8rem;
}

.step-submit {
  width: 100%;
  margin-top: 0.5rem;
}

.ssl-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ssl-option {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid var(--p-surface-border);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.ssl-option:hover {
  border-color: var(--p-primary-color);
}

.ssl-option--active {
  border-color: var(--p-primary-color);
  background: var(--p-primary-50);
}

.ssl-option i {
  font-size: 1.5rem;
  color: var(--p-primary-color);
  margin-top: 0.1rem;
}

.ssl-option p {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--p-text-muted-color);
}

.letsencrypt-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step-actions {
  display: flex;
  gap: 0.75rem;
}

.step-actions .p-button:first-child {
  flex: 1;
}

.setup-complete-icon {
  font-size: 4rem;
  color: var(--p-green-500);
}
</style>
