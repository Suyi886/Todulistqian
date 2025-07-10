import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('access_token') || '')
  const user = ref(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  // 设置token
  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('access_token', newToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  // 清除token
  const clearToken = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('access_token')
    delete api.defaults.headers.common['Authorization']
  }

  // 检查认证状态
  const checkAuth = async () => {
    if (token.value) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      try {
        await fetchUser()
      } catch (error) {
        clearToken()
      }
    }
  }

  // 获取用户信息
  const fetchUser = async () => {
    try {
      const response = await api.get('/api/users/me')
      user.value = response.data
    } catch (error) {
      throw error
    }
  }

  // 登录
  const login = async (credentials) => {
    loading.value = true
    try {
      const response = await api.post('/api/auth/login', credentials)
      const { access_token } = response.data
      setToken(access_token)
      await fetchUser()
      ElMessage.success('登录成功')
      return true
    } catch (error) {
      const message = error.response?.data?.error?.message || '登录失败'
      ElMessage.error(message)
      return false
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (userData) => {
    loading.value = true
    try {
      await api.post('/api/auth/register', userData)
      ElMessage.success('注册成功，请登录')
      return true
    } catch (error) {
      const message = error.response?.data?.error?.message || '注册失败'
      ElMessage.error(message)
      return false
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = () => {
    clearToken()
    ElMessage.success('已退出登录')
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
    fetchUser
  }
})