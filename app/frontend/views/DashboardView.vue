<template>
  <div class="dashboard">
    <AppNav />

    <main class="dashboard__main">
      <div class="dashboard__content">
        <div class="dashboard__heading">
          <h2 class="dashboard__title">Dashboard</h2>
          <p class="dashboard__subtitle">Welcome back, {{ authStore.user?.email }}</p>
        </div>

        <div v-if="loading" class="dashboard__loading">
          <ProgressSpinner />
        </div>

        <div v-else class="dashboard__grid">
          <Card class="stat-card">
            <template #content>
              <div class="stat-card__body">
                <div class="stat-card__icon stat-card__icon--primary">
                  <i class="pi pi-users" />
                </div>
                <div class="stat-card__info">
                  <span class="stat-card__label">Status</span>
                  <span class="stat-card__value">Active</span>
                </div>
              </div>
            </template>
          </Card>

          <Card class="stat-card">
            <template #content>
              <div class="stat-card__body">
                <div class="stat-card__icon stat-card__icon--success">
                  <i class="pi pi-check-circle" />
                </div>
                <div class="stat-card__info">
                  <span class="stat-card__label">Session</span>
                  <span class="stat-card__value">Authenticated</span>
                </div>
              </div>
            </template>
          </Card>

          <Card class="dashboard__welcome-card">
            <template #title>Getting Started</template>
            <template #content>
              <p>{{ stats?.message }}</p>
              <Divider />
              <p class="dashboard__help-text">
                This is your template app. Fork it and start building.
              </p>
            </template>
          </Card>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'
import AppNav from '@/components/AppNav.vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/composables/useApi'

interface DashboardData {
  user: { id: number; email: string }
  stats: { message: string }
}

const authStore = useAuthStore()
const loading = ref(true)
const stats = ref<DashboardData['stats'] | null>(null)

onMounted(async () => {
  try {
    const data = await api.get<DashboardData>('/api/v1/dashboard')
    stats.value = data.stats
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--p-surface-ground);
}

.dashboard__main {
  padding: 2rem 1rem;
}

.dashboard__content {
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard__heading {
  margin-bottom: 1.5rem;
}

.dashboard__title {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.dashboard__subtitle {
  margin: 0;
  color: var(--p-text-muted-color);
}

.dashboard__loading {
  display: flex;
  justify-content: center;
  padding: 3rem;
}

.dashboard__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.dashboard__welcome-card {
  grid-column: 1 / -1;
}

.dashboard__help-text {
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
}

.stat-card__body {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-card__icon {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.stat-card__icon--primary {
  background: var(--p-primary-100);
  color: var(--p-primary-600);
}

.stat-card__icon--success {
  background: var(--p-green-100);
  color: var(--p-green-600);
}

.stat-card__info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-card__label {
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-card__value {
  font-weight: 600;
  font-size: 1.1rem;
}
</style>
