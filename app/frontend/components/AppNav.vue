<template>
  <Menubar :model="menuItems" class="app-nav">
    <template #start>
      <span class="app-nav__brand">Template App</span>
    </template>

    <template #end>
      <div class="app-nav__user">
        <Avatar
          :label="userInitial"
          shape="circle"
          class="app-nav__avatar"
        />
        <span class="app-nav__email">{{ authStore.user?.email }}</span>
        <Button
          label="Sign Out"
          severity="secondary"
          size="small"
          icon="pi pi-sign-out"
          :loading="signingOut"
          @click="handleSignOut"
        />
      </div>
    </template>
  </Menubar>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Menubar from 'primevue/menubar'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const signingOut = ref(false)

const menuItems = [
  { label: 'Dashboard', icon: 'pi pi-home', command: () => router.push({ name: 'dashboard' }) },
]

const userInitial = computed(() => authStore.user?.email?.[0]?.toUpperCase() ?? '?')

async function handleSignOut() {
  signingOut.value = true
  try {
    await authStore.logout()
    router.push({ name: 'login' })
  } finally {
    signingOut.value = false
  }
}
</script>

<style scoped>
.app-nav {
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: none;
}

.app-nav__brand {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--p-text-color);
  margin-right: 1rem;
}

.app-nav__user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.app-nav__email {
  font-size: 0.875rem;
  color: var(--p-text-muted-color);
}

.app-nav__avatar {
  background: var(--p-primary-color);
  color: var(--p-primary-contrast-color);
  font-weight: 600;
  font-size: 0.875rem;
  width: 2rem;
  height: 2rem;
}
</style>
