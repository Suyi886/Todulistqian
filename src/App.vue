<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'

const authStore = useAuthStore()
const route = useRoute()
const appLoaded = ref(false)
const showDebug = ref(true)

onMounted(async () => {
  console.log('App.vue mounted')
  appLoaded.value = true
  
  // 应用启动时检查本地存储的token
  try {
    await authStore.checkAuth()
    console.log('checkAuth completed', { 
      isAuthenticated: authStore.isAuthenticated, 
      token: authStore.token
    })
  } catch (error) {
    console.error('checkAuth failed:', error)
  }
})
</script>

<style scoped>
#app {
  min-height: 100vh;
}
</style>