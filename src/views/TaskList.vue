<template>
  <div class="task-list">
    <!-- 筛选和搜索栏 -->
    <div class="filter-bar">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchQuery"
            placeholder="搜索任务..."
            prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        
        <el-col :span="4">
          <el-select
            v-model="filters.status"
            placeholder="状态"
            clearable
            @change="handleFilterChange"
          >
            <el-option label="待处理" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-col>
        
        <el-col :span="4">
          <el-select
            v-model="filters.priority"
            placeholder="优先级"
            clearable
            @change="handleFilterChange"
          >
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-col>
        
        <el-col :span="4">
          <el-select
            v-model="filters.category_id"
            placeholder="分类"
            clearable
            @change="handleFilterChange"
          >
            <el-option
              v-for="category in (categoriesStore.categories || [])"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-col>
        
        <el-col :span="6">
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新建任务
          </el-button>
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-col>
      </el-row>
    </div>
    
    <!-- 任务统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card pending">
            <div class="stat-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ tasksStore.pendingTasks.length }}</div>
              <div class="stat-label">待处理</div>
            </div>
          </div>
        </el-col>
        
        <el-col :span="6">
          <div class="stat-card in-progress">
            <div class="stat-icon">
              <el-icon><Loading /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ tasksStore.inProgressTasks.length }}</div>
              <div class="stat-label">进行中</div>
            </div>
          </div>
        </el-col>
        
        <el-col :span="6">
          <div class="stat-card completed">
            <div class="stat-icon">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ tasksStore.completedTasks.length }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </el-col>
        
        <el-col :span="6">
          <div class="stat-card total">
            <div class="stat-icon">
              <el-icon><List /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ (tasksStore.tasks || []).length }}</div>
              <div class="stat-label">总任务</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
    
    <!-- 任务列表 -->
    <div class="task-cards">
      <el-row :gutter="20" v-loading="tasksStore.loading">
        <el-col :span="24" v-if="(tasksStore.tasks || []).length === 0 && !tasksStore.loading">
          <el-empty description="暂无任务" />
        </el-col>
        
        <el-col :span="8" v-for="task in (tasksStore.tasks || [])" :key="task.id">
          <div class="task-card" :class="`priority-${task.priority}`">
            <div class="task-header">
              <div class="task-title">{{ task.title }}</div>
              <el-dropdown @command="(command) => handleTaskAction(command, task)">
                <el-icon class="task-menu"><MoreFilled /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            
            <div class="task-description" v-if="task.description">
              {{ task.description }}
            </div>
            
            <div class="task-meta">
              <div class="task-categories" v-if="task.categories && task.categories.length">
                <el-tag
                  v-for="category in task.categories"
                  :key="category.id || category"
                  size="small"
                  :color="getCategoryColor(category)"
                >
                  {{ getCategoryName(category) }}
                </el-tag>
              </div>
              
              <div class="task-due-date" v-if="task.due_date">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(task.due_date) }}
              </div>
            </div>
            
            <div class="task-footer">
              <div class="task-status">
                <el-select
                  v-model="task.status"
                  size="small"
                  @change="(value) => updateTaskStatus(task.id, value)"
                >
                  <el-option label="待处理" value="pending" />
                  <el-option label="进行中" value="in_progress" />
                  <el-option label="已完成" value="completed" />
                  <el-option label="已归档" value="archived" />
                </el-select>
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
        </el-col>
      </el-row>
    </div>
    
    <!-- 分页 -->
    <div class="pagination" v-if="tasksStore.pagination.total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="tasksStore.pagination.limit"
        :total="tasksStore.pagination.total"
        layout="total, prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </div>
    
    <!-- 创建/编辑任务对话框 -->
    <TaskDialog
      v-model="showCreateDialog"
      :task="editingTask"
      @saved="handleTaskSaved"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTasksStore } from '@/stores/tasks'
import { useCategoriesStore } from '@/stores/categories'
import { useAuthStore } from '@/stores/auth'
import { ElMessageBox, ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import TaskDialog from '@/components/TaskDialog.vue'

const route = useRoute()
const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()

const showCreateDialog = ref(false)
const editingTask = ref(null)
const searchQuery = ref('')
const currentPage = ref(1)

const filters = reactive({
  status: '',
  priority: '',
  category_id: ''
})

// 搜索处理
const handleSearch = () => {
  tasksStore.setFilters({ search: searchQuery.value })
  currentPage.value = 1
  tasksStore.fetchTasks(1)
}

// 筛选变化处理
const handleFilterChange = () => {
  tasksStore.setFilters(filters)
  currentPage.value = 1
  tasksStore.fetchTasks(1)
}

// 重置筛选
const resetFilters = () => {
  Object.assign(filters, {
    status: '',
    priority: '',
    category_id: ''
  })
  searchQuery.value = ''
  tasksStore.resetFilters()
  currentPage.value = 1
  tasksStore.fetchTasks(1)
}

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page
  tasksStore.fetchTasks(page)
}

// 任务操作处理
const handleTaskAction = async (command, task) => {
  switch (command) {
    case 'edit':
      editingTask.value = task
      showCreateDialog.value = true
      break
    case 'delete':
      await ElMessageBox.confirm(
        '确定要删除这个任务吗？',
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      await tasksStore.deleteTask(task.id)
      break
  }
}

// 更新任务状态
const updateTaskStatus = async (taskId, status) => {
  await tasksStore.updateTaskStatus(taskId, status)
}

// 任务保存处理
const handleTaskSaved = () => {
  showCreateDialog.value = false
  editingTask.value = null
  // 任务保存后，无论是创建还是编辑，都刷新列表以确保数据同步
  tasksStore.fetchTasks(currentPage.value)
}

// 获取分类颜色
const getCategoryColor = (category) => {
  if (typeof category === 'object' && category.color) {
    return category.color
  }
  const cat = categoriesStore.getCategoryById(category.id || category)
  return cat?.color || '#409eff'
}

// 获取分类名称
const getCategoryName = (category) => {
  if (typeof category === 'string') {
    return category
  }
  if (typeof category === 'object' && category.name) {
    return category.name
  }
  const cat = categoriesStore.getCategoryById(category.id || category)
  return cat?.name || '未知分类'
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
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
    if (route.path === '/') {
      tasksStore.fetchTasks()
      categoriesStore.fetchCategories()
    }
  },
  { immediate: false }
)

onMounted(() => {
  tasksStore.fetchTasks()
  categoriesStore.fetchCategories()
})
</script>

<style scoped>
.task-list {
  padding: 0;
  position: relative;
  z-index: 1;
}

.filter-bar {
  margin-bottom: 25px;
  padding: 25px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stats-cards {
  margin-bottom: 25px;
}

.stat-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  padding: 25px;
  display: flex;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, var(--card-color), var(--card-color-dark));
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.stat-card.pending {
  --card-color: #f39c12;
  --card-color-dark: #e67e22;
}

.stat-card.in-progress {
  --card-color: #3498db;
  --card-color-dark: #2980b9;
}

.stat-card.completed {
  --card-color: #2ecc71;
  --card-color-dark: #27ae60;
}

.stat-card.total {
  --card-color: #9b59b6;
  --card-color-dark: #8e44ad;
}

.stat-icon {
  font-size: 28px;
  margin-right: 20px;
  color: var(--card-color);
  background: linear-gradient(135deg, var(--card-color), var(--card-color-dark));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 4px;
  font-weight: 500;
}

.task-cards {
  margin-bottom: 25px;
}

.task-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.task-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, var(--priority-color), var(--priority-color-dark));
}

.task-card.priority-high {
  --priority-color: #e74c3c;
  --priority-color-dark: #c0392b;
}

.task-card.priority-medium {
  --priority-color: #f39c12;
  --priority-color-dark: #e67e22;
}

.task-card.priority-low {
  --priority-color: #2ecc71;
  --priority-color-dark: #27ae60;
}

.task-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.task-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.task-menu {
  cursor: pointer;
  color: #95a5a6;
  font-size: 18px;
  transition: all 0.3s ease;
  padding: 5px;
  border-radius: 50%;
}

.task-menu:hover {
  color: #3498db;
  background: rgba(52, 152, 219, 0.1);
  transform: scale(1.1);
}

.task-description {
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.6;
  background: rgba(255, 255, 255, 0.5);
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid var(--priority-color, #bdc3c7);
}

.task-meta {
  margin-bottom: 20px;
}

.task-categories {
  margin-bottom: 12px;
}

.task-categories .el-tag {
  margin-right: 8px;
  color: white;
  border-radius: 20px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.task-due-date {
  display: flex;
  align-items: center;
  color: #95a5a6;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.7);
  padding: 6px 12px;
  border-radius: 20px;
  width: fit-content;
}

.task-due-date .el-icon {
  margin-right: 6px;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 25px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>