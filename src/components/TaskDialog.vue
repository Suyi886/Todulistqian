<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑任务' : '新建任务'"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="taskFormRef"
      :model="taskForm"
      :rules="taskRules"
      label-width="80px"
    >
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="taskForm.title"
          placeholder="请输入任务标题"
        />
      </el-form-item>
      
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="taskForm.description"
          type="textarea"
          :rows="3"
          placeholder="请输入任务描述"
        />
      </el-form-item>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="优先级" prop="priority">
            <el-select v-model="taskForm.priority" placeholder="选择优先级">
              <el-option label="高" value="high" />
              <el-option label="中" value="medium" />
              <el-option label="低" value="low" />
            </el-select>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="taskForm.status" placeholder="选择状态">
              <el-option label="待处理" value="pending" />
              <el-option label="进行中" value="in_progress" />
              <el-option label="已完成" value="completed" />
              <el-option label="已归档" value="archived" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-form-item label="截止时间" prop="due_date">
        <el-date-picker
          v-model="taskForm.due_date"
          type="datetime"
          placeholder="选择截止时间"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DDTHH:mm:ss[Z]"
          style="width: 100%"
        />
      </el-form-item>
      
      <el-form-item label="分类" prop="category_ids">
        <el-select
          v-model="taskForm.category_ids"
          multiple
          placeholder="选择分类"
          style="width: 100%"
        >
          <el-option
            v-for="category in categoriesStore.categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          >
            <span :style="{ color: category.color }">{{ category.name }}</span>
          </el-option>
        </el-select>
      </el-form-item>
      
      <!-- 提醒设置 -->
      <el-form-item label="提醒时间">
        <div class="reminders-section">
          <div
            v-for="(reminder, index) in taskForm.reminders"
            :key="index"
            class="reminder-item"
          >
            <el-date-picker
              v-model="reminder.remind_time"
              type="datetime"
              placeholder="选择提醒时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss[Z]"
              style="flex: 1; margin-right: 10px"
            />
            <el-button
              type="danger"
              size="small"
              @click="removeReminder(index)"
            >
              删除
            </el-button>
          </div>
          
          <el-button
            type="primary"
            size="small"
            @click="addReminder"
          >
            添加提醒
          </el-button>
        </div>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
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
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useCategoriesStore } from '@/stores/categories'
import dayjs from 'dayjs'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  task: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()

const taskFormRef = ref()
const loading = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.task)

const taskForm = reactive({
  title: '',
  description: '',
  priority: 'medium',
  status: 'pending',
  due_date: '',
  category_ids: [],
  reminders: []
})

const taskRules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 监听任务变化，填充表单
watch(() => props.task, (newTask) => {
  if (newTask) {
    Object.assign(taskForm, {
      title: newTask.title || '',
      description: newTask.description || '',
      priority: newTask.priority || 'medium',
      status: newTask.status || 'pending',
      due_date: newTask.due_date || '',
      category_ids: newTask.categories?.map(cat => 
        typeof cat === 'object' ? cat.id : cat
      ) || [],
      reminders: newTask.reminders?.map(reminder => ({
        id: reminder.id,
        remind_time: reminder.remind_time
      })) || []
    })
  } else {
    // 重置表单
    Object.assign(taskForm, {
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      due_date: '',
      category_ids: [],
      reminders: []
    })
  }
}, { immediate: true })

// 添加提醒
const addReminder = () => {
  taskForm.reminders.push({
    remind_time: ''
  })
}

// 删除提醒
const removeReminder = (index) => {
  taskForm.reminders.splice(index, 1)
}

// 处理保存
const handleSave = async () => {
  if (!taskFormRef.value) return
  
  await taskFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const taskData = {
          title: taskForm.title,
          description: taskForm.description,
          priority: taskForm.priority,
          status: taskForm.status,
          due_date: taskForm.due_date,
          category_ids: taskForm.category_ids
        }
        
        if (isEdit.value) {
          await tasksStore.updateTask(props.task.id, taskData)
        } else {
          await tasksStore.createTask(taskData)
        }
        
        // 处理提醒（这里简化处理，实际应该调用提醒相关API）
        // TODO: 实现提醒的创建、更新、删除
        
        // 关闭对话框并触发保存事件
        dialogVisible.value = false
        emit('saved')
      } catch (error) {
        console.error('保存任务失败:', error)
      } finally {
        loading.value = false
      }
    }
  })
}

// 处理关闭
const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style scoped>
.reminders-section {
  width: 100%;
}

.reminder-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.reminder-item:last-of-type {
  margin-bottom: 15px;
}
</style>