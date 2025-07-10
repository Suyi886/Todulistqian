import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { ElMessage } from 'element-plus'
import { useAuthStore } from './auth'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref([])
  const loading = ref(false)
  const pagination = ref({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  })
  const filters = ref({
    status: '',
    priority: '',
    category_id: '',
    search: '',
    due_date_after: '',
    due_date_before: ''
  })
  
  const authStore = useAuthStore()

  // 计算属性
  const pendingTasks = computed(() => 
    (tasks.value || []).filter(task => task.status === 'pending')
  )
  
  const inProgressTasks = computed(() => 
    (tasks.value || []).filter(task => task.status === 'in_progress')
  )
  
  const completedTasks = computed(() => 
    (tasks.value || []).filter(task => task.status === 'completed')
  )

  // 获取任务列表
  const fetchTasks = async (page = 1) => {
    loading.value = true
    try {
      const params = {
        page,
        limit: pagination.value.limit,
        ...filters.value
      }
      
      // 移除空值参数
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key]
        }
      })
      
      const response = await api.get('/api/tasks', { params })
      tasks.value = response.data.data || []
      pagination.value = response.data.pagination
    } catch (error) {
      ElMessage.error('获取任务列表失败')
      // 确保在错误情况下 tasks.value 也是数组
      if (!tasks.value) {
        tasks.value = []
      }
    } finally {
      loading.value = false
    }
  }

  // 获取单个任务详情
  const fetchTask = async (taskId) => {
    try {
      const response = await api.get(`/api/tasks/${taskId}`)
      return response.data
    } catch (error) {
      ElMessage.error('获取任务详情失败')
      throw error
    }
  }

  // 创建任务
  const createTask = async (taskData) => {
    try {
      const response = await api.post('/api/tasks', taskData)
      ElMessage.success('任务创建成功')
      await fetchTasks() // ✅ 创建成功后刷新任务列表
      return response.data
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message || '创建任务失败'
      ElMessage.error(message)
      throw error
    }
  }

  // 更新任务
  const updateTask = async (taskId, taskData) => {
    try {
      await api.put(`/api/tasks/${taskId}`, taskData)
      // 更新成功后，重新获取当前页的任务列表以确保数据同步
      await fetchTasks(pagination.value.page)
      ElMessage.success('任务更新成功')
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message || '更新任务失败'
      ElMessage.error(message)
      throw error
    }
  }

  // 删除任务
  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/api/tasks/${taskId}`)
      // 删除成功后，重新获取当前页的任务列表以确保数据同步
      await fetchTasks(pagination.value.page)
      ElMessage.success('任务删除成功')
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message || '删除任务失败'
      ElMessage.error(message)
      throw error
    }
  }

  // 更新任务状态
  const updateTaskStatus = async (taskId, status) => {
    try {
      await updateTask(taskId, { status })
    } catch (error) {
      throw error
    }
  }

  // 设置筛选条件
  const setFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  // 重置筛选条件
  const resetFilters = () => {
    filters.value = {
      status: '',
      priority: '',
      category_id: '',
      search: '',
      due_date_after: '',
      due_date_before: ''
    }
  }

  return {
    tasks,
    loading,
    pagination,
    filters,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    setFilters,
    resetFilters
  }
})