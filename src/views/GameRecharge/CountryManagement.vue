<template>
  <div class="country-management">
    <div class="page-header">
      <h2>国家管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加国家
        </el-button>
        <el-button @click="refreshCountries" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filters" inline>
        <el-form-item label="国家代码">
          <el-input v-model="filters.code" placeholder="请输入国家代码" clearable />
        </el-form-item>
        <el-form-item label="国家名称">
          <el-input v-model="filters.name" placeholder="请输入国家名称" clearable />
        </el-form-item>
        <el-form-item label="货币">
          <el-input v-model="filters.currency" placeholder="请输入货币代码" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchCountries">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 国家列表 -->
    <el-card class="table-card" shadow="never">
      <el-table 
        :data="countries" 
        :loading="loading" 
        stripe 
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="id" label="ID" width="80" sortable="custom" />
        <el-table-column prop="code" label="国家代码" width="120" />
        <el-table-column prop="name" label="国家名称" width="200" />
        <el-table-column prop="currency" label="货币代码" width="120" />
        <el-table-column prop="currency_symbol" label="货币符号" width="100" />
        <el-table-column prop="exchange_rate" label="汇率" width="120" sortable="custom">
          <template #default="{ row }">
            {{ row.exchange_rate || '1.0000' }}
          </template>
        </el-table-column>
        <el-table-column prop="min_amount" label="最小金额" width="120">
          <template #default="{ row }">
            {{ row.min_amount || '0' }} {{ row.currency }}
          </template>
        </el-table-column>
        <el-table-column prop="max_amount" label="最大金额" width="120">
          <template #default="{ row }">
            {{ row.max_amount || '无限制' }} {{ row.max_amount ? row.currency : '' }}
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
            <el-button size="small" @click="editCountry(row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="row.status === 1 ? 'warning' : 'success'" 
              @click="toggleCountryStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteCountry(row)"
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
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑国家对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑国家' : '添加国家'" 
      width="600px"
      @close="resetForm"
    >
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        label-width="120px"
      >
        <el-form-item label="国家代码" prop="code">
          <el-input 
            v-model="form.code" 
            placeholder="请输入国家代码（如：CN、US）" 
            :disabled="isEdit"
            style="text-transform: uppercase;"
          />
        </el-form-item>
        <el-form-item label="国家名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入国家名称" />
        </el-form-item>
        <el-form-item label="货币代码" prop="currency">
          <el-input 
            v-model="form.currency" 
            placeholder="请输入货币代码（如：CNY、USD）" 
            style="text-transform: uppercase;"
          />
        </el-form-item>
        <el-form-item label="货币符号" prop="currency_symbol">
          <el-input v-model="form.currency_symbol" placeholder="请输入货币符号（如：¥、$）" />
        </el-form-item>
        <el-form-item label="汇率" prop="exchange_rate">
          <el-input-number 
            v-model="form.exchange_rate" 
            :precision="4" 
            :step="0.0001" 
            :min="0.0001" 
            placeholder="相对于基础货币的汇率"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="最小金额" prop="min_amount">
          <el-input-number 
            v-model="form.min_amount" 
            :precision="2" 
            :step="1" 
            :min="0" 
            placeholder="最小充值金额"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="最大金额" prop="max_amount">
          <el-input-number 
            v-model="form.max_amount" 
            :precision="2" 
            :step="100" 
            :min="0" 
            placeholder="最大充值金额（0表示无限制）"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number 
            v-model="form.sort_order" 
            :min="0" 
            placeholder="排序权重（数字越小越靠前）"
            style="width: 100%;"
          />
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
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import api from '@/services/api'
import dayjs from 'dayjs'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const countries = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

// 筛选条件
const filters = reactive({
  code: '',
  name: '',
  currency: '',
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
  prop: 'sort_order',
  order: 'ascending'
})

// 表单数据
const form = reactive({
  id: null,
  code: '',
  name: '',
  currency: '',
  currency_symbol: '',
  exchange_rate: 1.0000,
  min_amount: 0,
  max_amount: 0,
  status: 1,
  sort_order: 0,
  remark: ''
})

// 表单验证规则
const rules = {
  code: [
    { required: true, message: '请输入国家代码', trigger: 'blur' },
    { pattern: /^[A-Z]{2}$/, message: '国家代码必须是2位大写字母', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入国家名称', trigger: 'blur' },
    { min: 2, max: 50, message: '国家名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  currency: [
    { required: true, message: '请输入货币代码', trigger: 'blur' },
    { pattern: /^[A-Z]{3}$/, message: '货币代码必须是3位大写字母', trigger: 'blur' }
  ],
  currency_symbol: [
    { required: true, message: '请输入货币符号', trigger: 'blur' }
  ],
  exchange_rate: [
    { required: true, message: '请输入汇率', trigger: 'blur' },
    { type: 'number', min: 0.0001, message: '汇率必须大于0', trigger: 'blur' }
  ],
  min_amount: [
    { required: true, message: '请输入最小金额', trigger: 'blur' },
    { type: 'number', min: 0, message: '最小金额不能小于0', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 获取国家列表
const fetchCountries = async () => {
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
    
    const response = await api.get('/api/game-recharge/countries', { params })
    countries.value = response.data.data
    pagination.total = response.data.total
  } catch (error) {
    ElMessage.error('获取国家列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索国家
const searchCountries = () => {
  pagination.page = 1
  fetchCountries()
}

// 重置筛选条件
const resetFilters = () => {
  Object.keys(filters).forEach(key => {
    filters[key] = key === 'status' ? null : ''
  })
  pagination.page = 1
  fetchCountries()
}

// 刷新国家列表
const refreshCountries = () => {
  fetchCountries()
}

// 显示添加对话框
const showAddDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑国家
const editCountry = (country) => {
  isEdit.value = true
  Object.keys(form).forEach(key => {
    form[key] = country[key]
  })
  dialogVisible.value = true
}

// 切换国家状态
const toggleCountryStatus = async (country) => {
  try {
    const action = country.status === 1 ? '禁用' : '启用'
    await ElMessageBox.confirm(`确认${action}该国家？`, '确认操作', {
      type: 'warning'
    })
    
    await api.put(`/api/game-recharge/countries/${country.id}/status`, {
      status: country.status === 1 ? 0 : 1
    })
    
    ElMessage.success(`国家${action}成功`)
    fetchCountries()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 删除国家
const deleteCountry = async (country) => {
  try {
    await ElMessageBox.confirm('确认删除该国家？删除后不可恢复！', '确认删除', {
      type: 'warning'
    })
    
    await api.delete(`/api/game-recharge/countries/${country.id}`)
    
    ElMessage.success('国家删除成功')
    fetchCountries()
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
    
    // 转换大写
    form.code = form.code.toUpperCase()
    form.currency = form.currency.toUpperCase()
    
    if (isEdit.value) {
      await api.put(`/api/game-recharge/countries/${form.id}`, form)
      ElMessage.success('国家更新成功')
    } else {
      await api.post('/api/game-recharge/countries', form)
      ElMessage.success('国家添加成功')
    }
    
    dialogVisible.value = false
    fetchCountries()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.keys(form).forEach(key => {
    if (key === 'status') {
      form[key] = 1
    } else if (key === 'exchange_rate') {
      form[key] = 1.0000
    } else if (key === 'min_amount' || key === 'max_amount' || key === 'sort_order') {
      form[key] = 0
    } else if (key === 'id') {
      form[key] = null
    } else {
      form[key] = ''
    }
  })
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

// 处理排序变化
const handleSortChange = ({ prop, order }) => {
  sort.prop = prop
  sort.order = order
  fetchCountries()
}

// 处理页面大小变化
const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  fetchCountries()
}

// 处理当前页变化
const handleCurrentChange = (page) => {
  pagination.page = page
  fetchCountries()
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 组件挂载时获取数据
onMounted(() => {
  fetchCountries()
})
</script>

<style scoped>
.country-management {
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

.dialog-footer {
  text-align: right;
}
</style>