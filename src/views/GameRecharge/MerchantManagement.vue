<template>
  <div class="merchant-management">
    <div class="page-header">
      <h2>商户管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加商户
        </el-button>
        <el-button @click="refreshMerchants" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filters" inline>
        <el-form-item label="商户ID">
          <el-input v-model="filters.merchant_id" placeholder="请输入商户ID" clearable />
        </el-form-item>
        <el-form-item label="API密钥">
          <el-input v-model="filters.api_key" placeholder="请输入API密钥" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchMerchants">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 商户列表 -->
    <el-card class="table-card" shadow="never">
      <el-table 
        :data="merchants" 
        :loading="loading" 
        stripe 
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="id" label="ID" width="80" sortable="custom" />
        <el-table-column prop="merchant_id" label="商户ID" width="200" />
        <el-table-column prop="api_key" label="API密钥" width="300">
          <template #default="{ row }">
            <div class="api-key-cell">
              <span v-if="!row.showApiKey">{{ maskApiKey(row.api_key) }}</span>
              <span v-else>{{ row.api_key }}</span>
              <el-button 
                size="small" 
                text 
                @click="toggleApiKeyVisibility(row)"
                style="margin-left: 8px;"
              >
                <el-icon><View v-if="!row.showApiKey" /><Hide v-else /></el-icon>
              </el-button>
              <el-button 
                size="small" 
                text 
                @click="copyApiKey(row.api_key)"
                style="margin-left: 4px;"
              >
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="secret_key" label="密钥" width="300">
          <template #default="{ row }">
            <div class="secret-key-cell">
              <span v-if="!row.showSecretKey">{{ maskApiKey(row.secret_key) }}</span>
              <span v-else>{{ row.secret_key }}</span>
              <el-button 
                size="small" 
                text 
                @click="toggleSecretKeyVisibility(row)"
                style="margin-left: 8px;"
              >
                <el-icon><View v-if="!row.showSecretKey" /><Hide v-else /></el-icon>
              </el-button>
              <el-button 
                size="small" 
                text 
                @click="copyApiKey(row.secret_key)"
                style="margin-left: 4px;"
              >
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" sortable="custom">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editMerchant(row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="row.status === 1 ? 'warning' : 'success'" 
              @click="toggleMerchantStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteMerchant(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <!-- 添加/编辑商户对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑商户' : '添加商户'" 
      width="600px"
      @close="resetForm"
    >
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        label-width="100px"
      >
        <el-form-item label="商户ID" prop="merchant_id">
          <el-input 
            v-model="form.merchant_id" 
            placeholder="请输入商户ID" 
            :disabled="isEdit"
          />
        </el-form-item>
        <el-form-item label="API密钥" prop="api_key">
          <div class="key-input-group">
            <el-input v-model="form.api_key" placeholder="请输入API密钥" />
            <el-button @click="generateApiKey" style="margin-left: 8px;">生成</el-button>
          </div>
        </el-form-item>
        <el-form-item label="密钥" prop="secret_key">
          <div class="key-input-group">
            <el-input v-model="form.secret_key" placeholder="请输入密钥" />
            <el-button @click="generateSecretKey" style="margin-left: 8px;">生成</el-button>
          </div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input 
            v-model="form.remark" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            {{ isEdit ? '更新' : '添加' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, View, Hide, CopyDocument } from '@element-plus/icons-vue'
import api from '@/services/api'
import { merchantApi } from '@/services/gameRechargeApi'
import dayjs from 'dayjs'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const merchants = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

// 筛选条件
const filters = reactive({
  merchant_id: '',
  api_key: '',
  status: null
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 排序
const sort = reactive({
  prop: 'created_at',
  order: 'descending'
})

// 表单数据
const form = reactive({
  id: null,
  merchant_id: '',
  api_key: '',
  secret_key: '',
  status: 1,
  remark: ''
})

// 表单验证规则
const rules = {
  merchant_id: [
    { required: true, message: '请输入商户ID', trigger: 'blur' },
    { min: 3, max: 50, message: '商户ID长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  api_key: [
    { required: true, message: '请输入API密钥', trigger: 'blur' },
    { min: 16, max: 64, message: 'API密钥长度在 16 到 64 个字符', trigger: 'blur' }
  ],
  secret_key: [
    { required: true, message: '请输入密钥', trigger: 'blur' },
    { min: 16, max: 64, message: '密钥长度在 16 到 64 个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 获取商户列表
const fetchMerchants = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters,
      sort_by: sort.prop,
      sort_order: sort.order === 'ascending' ? 'asc' : 'desc'
    }
    
    // 移除空值
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })
    
    const response = await api.get('/api/game-recharge/merchants', { params })
    console.log('获取商户列表响应:', response)
    console.log('商户列表数据:', response.data.data)
    merchants.value = response.data.data ? response.data.data.map(merchant => {
      console.log('处理商户数据:', merchant)
      return {
        ...merchant,
        showApiKey: false,
        showSecretKey: false
      }
    }) : []
    pagination.total = response.data.total || 0
  } catch (error) {
    ElMessage.error('获取商户列表失败')
    merchants.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 搜索商户
const searchMerchants = () => {
  pagination.page = 1
  fetchMerchants()
}

// 重置筛选条件
const resetFilters = () => {
  Object.keys(filters).forEach(key => {
    filters[key] = key === 'status' ? null : ''
  })
  pagination.page = 1
  fetchMerchants()
}

// 刷新商户列表
const refreshMerchants = () => {
  fetchMerchants()
}

// 显示添加对话框
const showAddDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑商户
const editMerchant = (merchant) => {
  isEdit.value = true
  Object.keys(form).forEach(key => {
    form[key] = merchant[key]
  })
  dialogVisible.value = true
}

// 切换商户状态
const toggleMerchantStatus = async (merchant) => {
  try {
    const action = merchant.status === 1 ? '禁用' : '启用'
    await ElMessageBox.confirm(`确认${action}该商户？`, '确认操作', {
      type: 'warning'
    })
    
    await api.put(`/api/game-recharge/merchants/${merchant.id}/status`, {
      status: merchant.status === 1 ? 0 : 1
    })
    
    ElMessage.success(`商户${action}成功`)
    fetchMerchants()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 删除商户
const deleteMerchant = async (merchant) => {
  try {
    await ElMessageBox.confirm('确认删除该商户？删除后不可恢复！', '确认删除', {
      type: 'warning'
    })
    
    await api.delete(`/api/game-recharge/merchants/${merchant.id}`)
    
    ElMessage.success('商户删除成功')
    fetchMerchants()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      console.log('提交更新数据:', form)
      const response = await api.put(`/api/game-recharge/merchants/${form.id}`, form)
      console.log('商户更新响应:', response)
      ElMessage.success('商户更新成功')
    } else {
      console.log('提交新增数据:', form)
      const response = await api.post('/api/game-recharge/merchants', form)
      console.log('商户新增响应:', response)
      ElMessage.success('商户添加成功')
    }
    
    dialogVisible.value = false
    fetchMerchants()
  } catch (error) {
    console.error('提交表单失败:', error)
    const errorMessage = error.response?.data?.msg || error.message || (isEdit.value ? '更新失败' : '添加失败')
    ElMessage.error(errorMessage)
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.keys(form).forEach(key => {
    form[key] = key === 'status' ? 1 : (key === 'id' ? null : '')
  })
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

// 生成API密钥
const generateApiKey = async () => {
  if (isEdit.value && form.id) {
    // 编辑模式下调用后端接口重新生成
    try {
      const response = await merchantApi.regenerateApiKey(form.id)
      console.log('API密钥重新生成响应:', response)
      if (response.data && response.data.status === 'success' && response.data.data && response.data.data.api_key) {
        form.api_key = response.data.data.api_key
        ElMessage.success('API密钥重新生成成功')
      } else {
        console.error('API密钥重新生成失败 - 响应格式错误:', response)
        ElMessage.error('API密钥重新生成失败')
      }
    } catch (error) {
      console.error('API密钥重新生成失败 - 请求错误:', error)
      ElMessage.error('API密钥重新生成失败')
    }
  } else {
    // 新增模式下本地生成
    form.api_key = generateRandomString(32)
  }
}

// 生成密钥
const generateSecretKey = async () => {
  if (isEdit.value && form.id) {
    // 编辑模式下调用后端接口重新生成
    try {
      const response = await merchantApi.regenerateSecretKey(form.id)
      console.log('密钥重新生成响应:', response)
      if (response.data && response.data.status === 'success' && response.data.data && response.data.data.secret_key) {
        form.secret_key = response.data.data.secret_key
        ElMessage.success('密钥重新生成成功')
      } else {
        console.error('密钥重新生成失败 - 响应格式错误:', response)
        ElMessage.error('密钥重新生成失败')
      }
    } catch (error) {
      console.error('密钥重新生成失败 - 请求错误:', error)
      ElMessage.error('密钥重新生成失败')
    }
  } else {
    // 新增模式下本地生成
    form.secret_key = generateRandomString(32)
  }
}

// 生成随机字符串
const generateRandomString = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 切换API密钥可见性
const toggleApiKeyVisibility = (merchant) => {
  merchant.showApiKey = !merchant.showApiKey
}

// 切换密钥可见性
const toggleSecretKeyVisibility = (merchant) => {
  merchant.showSecretKey = !merchant.showSecretKey
}

// 掩码API密钥
const maskApiKey = (key) => {
  if (!key) return ''
  if (key.length <= 16) {
    // 如果密钥长度小于等于16，只显示前4位和后4位
    return key.substring(0, 4) + '*'.repeat(Math.max(0, key.length - 8)) + key.substring(Math.max(4, key.length - 4))
  }
  // 如果密钥长度大于16，显示前8位和后8位
  return key.substring(0, 8) + '*'.repeat(key.length - 16) + key.substring(key.length - 8)
}

// 复制API密钥
const copyApiKey = async (key) => {
  try {
    await navigator.clipboard.writeText(key)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 处理排序变化
const handleSortChange = ({ prop, order }) => {
  sort.prop = prop
  sort.order = order
  fetchMerchants()
}

// 监听分页变化
watch(() => pagination.page, () => {
  fetchMerchants()
})

watch(() => pagination.limit, () => {
  pagination.page = 1
  fetchMerchants()
})

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 组件挂载时获取数据
onMounted(() => {
  fetchMerchants()
})
</script>

<style scoped>
.merchant-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.api-key-cell,
.secret-key-cell {
  display: flex;
  align-items: center;
}

.key-input-group {
  display: flex;
  align-items: center;
  width: 100%;
}

.key-input-group .el-input {
  flex: 1;
}

.dialog-footer {
  text-align: right;
}
</style>