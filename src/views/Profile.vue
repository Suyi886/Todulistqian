<template>
  <div class="profile">
    <div class="profile-header">
      <h2>个人资料</h2>
    </div>
    
    <div class="profile-content">
      <el-row :gutter="20">
        <!-- 用户信息卡片 -->
        <el-col :span="12">
          <div class="info-card">
            <div class="card-header">
              <h3>基本信息</h3>
            </div>
            
            <div class="user-avatar">
              <el-avatar :size="80" :icon="UserFilled" />
            </div>
            
            <div class="user-info" v-if="authStore.user">
              <div class="info-item">
                <span class="info-label">用户名:</span>
                <span class="info-value">{{ authStore.user.username }}</span>
              </div>
              
              <div class="info-item">
                <span class="info-label">邮箱:</span>
                <span class="info-value">{{ authStore.user.email }}</span>
              </div>
              
              <div class="info-item">
                <span class="info-label">注册时间:</span>
                <span class="info-value">{{ formatDate(authStore.user.created_at) }}</span>
              </div>
              
              <div class="info-item" v-if="authStore.user.last_login">
                <span class="info-label">最后登录:</span>
                <span class="info-value">{{ formatDate(authStore.user.last_login) }}</span>
              </div>
            </div>
          </div>
        </el-col>
        
        <!-- 统计信息卡片 -->
        <el-col :span="12">
          <div class="stats-card">
            <div class="card-header">
              <h3>任务统计</h3>
            </div>
            
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-icon pending">
                  <el-icon><Clock /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ taskStats.pending }}</div>
                  <div class="stat-label">待处理</div>
                </div>
              </div>
              
              <div class="stat-item">
                <div class="stat-icon in-progress">
                  <el-icon><Loading /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ taskStats.inProgress }}</div>
                  <div class="stat-label">进行中</div>
                </div>
              </div>
              
              <div class="stat-item">
                <div class="stat-icon completed">
                  <el-icon><Check /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ taskStats.completed }}</div>
                  <div class="stat-label">已完成</div>
                </div>
              </div>
              
              <div class="stat-item">
                <div class="stat-icon total">
                  <el-icon><List /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ taskStats.total }}</div>
                  <div class="stat-label">总任务</div>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
      
      <!-- 分类统计 -->
      <div class="categories-stats">
        <div class="card-header">
          <h3>分类统计</h3>
        </div>
        
        <div class="categories-chart" v-if="categoriesStore.categories.length > 0">
          <div
            v-for="category in categoriesWithStats"
            :key="category.id"
            class="category-stat"
          >
            <div class="category-info">
              <div class="category-color" :style="{ backgroundColor: category.color }"></div>
              <span class="category-name">{{ category.name }}</span>
            </div>
            <div class="category-count">{{ category.taskCount }}</div>
            <div class="category-progress">
              <el-progress
                :percentage="category.percentage"
                :color="category.color"
                :show-text="false"
              />
            </div>
          </div>
        </div>
        
        <el-empty v-else description="暂无分类数据" />
      </div>
      
      <!-- 最近任务 -->
      <div class="recent-tasks">
        <div class="card-header">
          <h3>最近任务</h3>
          <router-link to="/" class="view-all-link">查看全部</router-link>
        </div>
        
        <div class="tasks-list" v-if="recentTasks.length > 0">
          <div
            v-for="task in recentTasks"
            :key="task.id"
            class="task-item"
            :class="`priority-${task.priority}`"
          >
            <div class="task-content">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-meta">
                <el-tag
                  :type="getStatusType(task.status)"
                  size="small"
                >
                  {{ getStatusText(task.status) }}
                </el-tag>
                <span class="task-date" v-if="task.due_date">
                  {{ formatDate(task.due_date) }}
                </span>
              </div>
            </div>
            
            <div class="task-priority">
              <el-tag
                :type="getPriorityType(task.priority)"
                size="small"
              >
                {{ getPriorityText(task.priority) }}
              </el-tag>
            </div>
          </div>
        </div>
        
        <el-empty v-else description="暂无最近任务" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTasksStore } from '@/stores/tasks'
import { useCategoriesStore } from '@/stores/categories'
import { UserFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const route = useRoute()
const authStore = useAuthStore()
const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()

// 任务统计
const taskStats = computed(() => {
  const tasks = tasksStore.tasks || []
  return {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  }
})

// 分类统计
const categoriesWithStats = computed(() => {
  const categories = categoriesStore.categories || []
  const tasks = tasksStore.tasks || []
  const totalTasks = tasks.length
  
  return categories.map(category => {
    const taskCount = tasks.filter(task => {
      if (!task.categories) return false
      return task.categories.some(cat => {
        if (typeof cat === 'object') {
          return cat.id === category.id
        }
        return cat === category.id
      })
    }).length
    
    return {
      ...category,
      taskCount,
      percentage: totalTasks > 0 ? Math.round((taskCount / totalTasks) * 100) : 0
    }
  }).sort((a, b) => b.taskCount - a.taskCount)
})

// 最近任务（按更新时间排序，取前5个）
const recentTasks = computed(() => {
  const tasks = tasksStore.tasks || []
  return [...tasks]
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 5)
})

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    pending: 'info',
    in_progress: 'primary',
    completed: 'success',
    archived: 'info'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    archived: '已归档'
  }
  return textMap[status] || status
}

// 获取优先级类型
const getPriorityType = (priority) => {
  const typeMap = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  }
  return typeMap[priority] || ''
}

// 获取优先级文本
const getPriorityText = (priority) => {
  const textMap = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return textMap[priority] || priority
}

// 监听路由变化，重新获取数据
watch(
  () => route.path,
  () => {
    if (route.path === '/profile') {
      // 获取用户信息
      if (!authStore.user) {
        authStore.fetchUser()
      }
      
      // 获取任务和分类数据
      tasksStore.fetchTasks()
      categoriesStore.fetchCategories()
    }
  },
  { immediate: false }
)

onMounted(() => {
  // 获取用户信息
  if (!authStore.user) {
    authStore.fetchUser()
  }
  
  // 获取任务和分类数据
  tasksStore.fetchTasks()
  categoriesStore.fetchCategories()
})
</script>

<style scoped>
.profile {
  padding: 0;
  position: relative;
  z-index: 1;
}

.profile-header {
  margin-bottom: 25px;
  padding: 25px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.profile-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.info-card,
.stats-card,
.categories-stats,
.recent-tasks {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.info-card:hover,
.stats-card:hover,
.categories-stats:hover,
.recent-tasks:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.card-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.view-all-link {
  color: #3498db;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(52, 152, 219, 0.1);
  transition: all 0.3s ease;
}

.view-all-link:hover {
  background: rgba(52, 152, 219, 0.2);
  transform: translateY(-1px);
  text-decoration: none;
}

.user-avatar {
  text-align: center;
  margin-bottom: 25px;
}

.user-avatar .el-avatar {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 4px solid rgba(255, 255, 255, 0.8);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #7f8c8d;
  font-size: 14px;
  font-weight: 500;
}

.info-value {
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.7);
  padding: 4px 12px;
  border-radius: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #f39c12, #e67e22);
}

.stat-icon.in-progress {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
}

.stat-icon.total {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 13px;
  color: #7f8c8d;
  font-weight: 500;
}

.categories-chart {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.category-stat {
  display: grid;
  grid-template-columns: 1fr auto 200px;
  align-items: center;
  gap: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.category-stat:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.category-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.category-name {
  font-size: 15px;
  color: #2c3e50;
  font-weight: 500;
}

.category-count {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  background: rgba(255, 255, 255, 0.7);
  padding: 4px 12px;
  border-radius: 12px;
  min-width: 40px;
  text-align: center;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-radius: 12px;
  border-left: 4px solid var(--priority-color, #bdc3c7);
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.task-item.priority-high {
  --priority-color: #e74c3c;
}

.task-item.priority-medium {
  --priority-color: #f39c12;
}

.task-item.priority-low {
  --priority-color: #2ecc71;
}

.task-content {
  flex: 1;
}

.task-title {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 6px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-date {
  font-size: 12px;
  color: #7f8c8d;
  background: rgba(255, 255, 255, 0.7);
  padding: 2px 8px;
  border-radius: 8px;
}
</style>