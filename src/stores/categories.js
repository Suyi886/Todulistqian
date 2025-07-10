import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import { ElMessage } from 'element-plus'
import { useAuthStore } from './auth'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref([])
  const loading = ref(false)
  const authStore = useAuthStore()

  // 获取分类列表
  const fetchCategories = async () => {
    loading.value = true
    try {
      const response = await api.get('/api/categories')
      categories.value = response.data
    } catch (error) {
      ElMessage.error('获取分类列表失败')
    } finally {
      loading.value = false
    }
  }

  // 创建分类
  const createCategory = async (categoryData) => {
    loading.value = true
    try {
      const response = await api.post('/api/categories', categoryData)
      categories.value.push(response.data)
      ElMessage.success('分类创建成功')
      return response.data
    } catch (error) {
      const message = error.response?.data?.error?.message || '创建分类失败'
      ElMessage.error(message)
      return null
    } finally {
      loading.value = false
    }
  }

  // 更新分类
  const updateCategory = async (categoryId, categoryData) => {
    loading.value = true
    try {
      const response = await api.put(`/api/categories/${categoryId}`, categoryData)
      const index = categories.value.findIndex(cat => cat.id === categoryId)
      if (index !== -1) {
        categories.value[index] = response.data
      }
      ElMessage.success('分类更新成功')
      return response.data
    } catch (error) {
      const message = error.response?.data?.error?.message || '更新分类失败'
      ElMessage.error(message)
      return null
    } finally {
      loading.value = false
    }
  }

  // 删除分类
  const deleteCategory = async (categoryId) => {
    loading.value = true
    try {
      await api.delete(`/api/categories/${categoryId}`)
      categories.value = categories.value.filter(cat => cat.id !== categoryId)
      ElMessage.success('分类删除成功')
      return true
    } catch (error) {
      const message = error.response?.data?.error?.message || '删除分类失败'
      ElMessage.error(message)
      return false
    } finally {
      loading.value = false
    }
  }

  // 根据ID获取分类
  const getCategoryById = (categoryId) => {
    return categories.value.find(cat => cat.id === categoryId)
  }

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById
  }
})