<template>
  <div class="categories">
    <div class="categories-header">
      <h2>分类管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建分类
      </el-button>
    </div>
    
    <div class="categories-grid" v-loading="categoriesStore.loading">
      <el-row :gutter="20">
        <el-col :span="6" v-for="category in categoriesStore.categories" :key="category.id">
          <div class="category-card">
            <div class="category-header">
              <div class="category-color" :style="{ backgroundColor: category.color }"></div>
              <div class="category-name">{{ category.name }}</div>
              <el-dropdown @command="(command) => handleCategoryAction(command, category)">
                <el-icon class="category-menu"><MoreFilled /></el-icon>
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
            
            <div class="category-stats">
              <div class="stat-item">
                <span class="stat-label">任务数量</span>
                <span class="stat-value">{{ getCategoryTaskCount(category.id) }}</span>
              </div>
            </div>
          </div>
        </el-col>
        
        <el-col :span="24" v-if="categoriesStore.categories.length === 0 && !categoriesStore.loading">
          <el-empty description="暂无分类" />
        </el-col>
      </el-row>
    </div>
    
    <!-- 创建/编辑分类对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="isEdit ? '编辑分类' : '新建分类'"
      width="400px"
      @close="handleDialogClose"
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryRules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="categoryForm.name"
            placeholder="请输入分类名称"
          />
        </el-form-item>
        
        <el-form-item label="颜色" prop="color">
          <div class="color-picker-container">
            <el-color-picker
              v-model="categoryForm.color"
              :predefine="predefineColors"
            />
            <span class="color-preview" :style="{ backgroundColor: categoryForm.color }">
              {{ categoryForm.color }}
            </span>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleSave"
          >
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCategoriesStore } from '@/stores/categories'
import { useTasksStore } from '@/stores/tasks'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const categoriesStore = useCategoriesStore()
const tasksStore = useTasksStore()

const showCreateDialog = ref(false)
const editingCategory = ref(null)
const categoryFormRef = ref()
const loading = ref(false)

const isEdit = computed(() => !!editingCategory.value)

const categoryForm = reactive({
  name: '',
  color: '#409eff'
})

const categoryRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 20, message: '分类名称长度在1到20个字符', trigger: 'blur' }
  ],
  color: [
    { required: true, message: '请选择分类颜色', trigger: 'change' }
  ]
}

// 预定义颜色
const predefineColors = [
  '#409eff',
  '#67c23a',
  '#e6a23c',
  '#f56c6c',
  '#909399',
  '#3498db',
  '#2ecc71',
  '#9b59b6',
  '#e74c3c',
  '#f39c12',
  '#1abc9c',
  '#34495e'
]

// 获取分类任务数量
const getCategoryTaskCount = (categoryId) => {
  const tasks = tasksStore.tasks || []
  return tasks.filter(task => {
    if (!task.categories) return false
    return task.categories.some(cat => {
      if (typeof cat === 'object') {
        return cat.id === categoryId
      }
      return cat === categoryId
    })
  }).length
}

// 处理分类操作
const handleCategoryAction = async (command, category) => {
  switch (command) {
    case 'edit':
      editingCategory.value = category
      categoryForm.name = category.name
      categoryForm.color = category.color
      showCreateDialog.value = true
      break
    case 'delete':
      await ElMessageBox.confirm(
        '确定要删除这个分类吗？删除后相关任务的分类信息将被移除。',
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      await categoriesStore.deleteCategory(category.id)
      // 重新加载任务列表以更新分类信息
      tasksStore.fetchTasks()
      break
  }
}

// 处理保存
const handleSave = async () => {
  if (!categoryFormRef.value) return
  
  await categoryFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        if (isEdit.value) {
          await categoriesStore.updateCategory(editingCategory.value.id, categoryForm)
        } else {
          await categoriesStore.createCategory(categoryForm)
        }
        
        handleDialogClose()
        // 重新加载任务列表以更新分类信息
        tasksStore.fetchTasks()
      } catch (error) {
        console.error('保存分类失败:', error)
      } finally {
        loading.value = false
      }
    }
  })
}

// 处理对话框关闭
const handleDialogClose = () => {
  showCreateDialog.value = false
  editingCategory.value = null
  categoryForm.name = ''
  categoryForm.color = '#409eff'
  if (categoryFormRef.value) {
    categoryFormRef.value.resetFields()
  }
}

// 监听路由变化，重新获取数据
watch(
  () => route.path,
  () => {
    if (route.path === '/categories') {
      categoriesStore.fetchCategories()
      tasksStore.fetchTasks()
    }
  },
  { immediate: false }
)

onMounted(() => {
  categoriesStore.fetchCategories()
  tasksStore.fetchTasks()
})
</script>

<style scoped>
.categories {
  padding: 0;
  position: relative;
  z-index: 1;
}

.categories-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding: 25px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.categories-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.categories-grid {
  min-height: 200px;
}

.category-card {
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

.category-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--category-color, #3498db);
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.category-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.category-color {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.category-name {
  flex: 1;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.category-menu {
  cursor: pointer;
  color: #95a5a6;
  font-size: 18px;
  transition: all 0.3s ease;
  padding: 8px;
  border-radius: 50%;
}

.category-menu:hover {
  color: #3498db;
  background: rgba(52, 152, 219, 0.1);
  transform: scale(1.1);
}

.category-stats {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding-top: 20px;
  background: rgba(255, 255, 255, 0.5);
  margin: 0 -25px -25px;
  padding: 20px 25px 25px;
  border-radius: 0 0 16px 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.stat-label {
  color: #7f8c8d;
  font-size: 14px;
  font-weight: 500;
}

.stat-value {
  color: #2c3e50;
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--category-color, #3498db), var(--category-color-dark, #2980b9));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.color-preview {
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  min-width: 100px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
</style>