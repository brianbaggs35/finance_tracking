import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSetupStore = defineStore('setup', () => {
  const setupRequired = ref<boolean | null>(null)

  async function checkStatus(): Promise<boolean> {
    if (setupRequired.value !== null) return setupRequired.value

    const response = await fetch('/api/v1/setup/status')
    const data = await response.json()
    setupRequired.value = data.setup_required as boolean
    return setupRequired.value
  }

  function markComplete(): void {
    setupRequired.value = false
  }

  return { setupRequired, checkStatus, markComplete }
})
