<template>
  <div class="order-management">
    <div class="page-header">
      <h2>订单管理</h2>
      <div class="header-actions">
        <el-button @click="refreshOrders" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filters" inline>
        <el-form-item label="订单号">
          <el-input v-model="filters.order_id" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="平台订单号">
          <el-input v-model="filters.platform_order_id" placeholder="请输入平台订单号" clearable />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="filters.status" placeholder="请选择状态" clearable>
            <el-option label="待提交凭证" :value="0" />
            <el-option label="已提交凭证，待审核" :value="1" />
            <el-option label="审核通过，充值成功" :value="2" />
            <el-option label="审核拒绝" :value="3" />
            <el-option label="订单取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="国家">
          <el-select v-model="filters.country_code" placeholder="请选择国家" clearable>
            <el-option 
              v-for="country in countries" 
              :key="country.code" 
              :label="country.name" 
              :value="country.code" 
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchOrders">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单列表 -->
    <el-card class="table-card" shadow="never">
      <el-table 
        :data="orders" 
        :loading="loading" 
        stripe 
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="order_id" label="订单号" width="180" sortable="custom" />
        <el-table-column prop="platform_order_id" label="平台订单号" width="180" />
        <el-table-column prop="amount" label="订单金额" width="120" sortable="custom">
          <template #default="{ row }">
            {{ row.amount }} {{ row.country?.currency || 'CNY' }}
          </template>
        </el-table-column>
        <el-table-column prop="actual_amount" label="实际金额" width="120">
          <template #default="{ row }">
            {{ row.actual_amount || '-' }} {{ row.country?.currency || 'CNY' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="150">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="country.name" label="国家" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180" sortable="custom">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="submitted_at" label="提交时间" width="180">
          <template #default="{ row }">
            {{ row.submitted_at ? formatDate(row.submitted_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewOrder(row)">查看</el-button>
            <el-button 
              v-if="row.status === 1" 
              size="small" 
              type="success" 
              @click="approveOrder(row)"
            >
              通过
            </el-button>
            <el-button 
              v-if="row.status === 1" 
              size="small" 
              type="danger" 
              @click="rejectOrder(row)"
            >
              拒绝
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

    <!-- 订单详情对话框 -->
    <el-dialog v-model="dialogVisible" title="订单详情" width="800px">
      <div v-if="selectedOrder" class="order-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ selectedOrder.order_id }}</el-descriptions-item>
          <el-descriptions-item label="平台订单号">{{ selectedOrder.platform_order_id }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">{{ selectedOrder.amount }} {{ selectedOrder.country?.currency }}</el-descriptions-item>
          <el-descriptions-item label="实际金额">{{ selectedOrder.actual_amount || '-' }} {{ selectedOrder.country?.currency }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedOrder.status)">{{ getStatusText(selectedOrder.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="国家">{{ selectedOrder.country?.name }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(selectedOrder.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ selectedOrder.submitted_at ? formatDate(selectedOrder.submitted_at) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="回调时间">{{ selectedOrder.callback_at ? formatDate(selectedOrder.callback_at) : '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 付款凭证 -->
        <div v-if="selectedOrder.callback_str || selectedOrder.callback_img" class="payment-proof">
          <h4>付款凭证</h4>
          <div v-if="selectedOrder.callback_str" class="proof-text">
            <el-input v-model="selectedOrder.callback_str" type="textarea" readonly />
          </div>
          <div v-if="selectedOrder.callback_img" class="proof-image">
            <el-image :src="selectedOrder.callback_img" style="width: 200px; height: 200px" fit="cover" />
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button 
            v-if="selectedOrder?.status === 1" 
            type="success" 
            @click="approveOrder(selectedOrder)"
          >
            审核通过
          </el-button>
          <el-button 
            v-if="selectedOrder?.status === 1" 
            type="danger" 
            @click="rejectOrder(selectedOrder)"
          >
            审核拒绝
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import api from '@/services/api'
import dayjs from 'dayjs'

// 响应式数据
const loading = ref(false)
const orders = ref([])
const countries = ref([])
const dialogVisible = ref(false)
const selectedOrder = ref(null)

// 筛选条件
const filters = reactive({
  order_id: '',
  platform_order_id: '',
  status: null,
  country_code: ''
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

// 获取订单列表
const fetchOrders = async () => {
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
    
    const response = await api.get('/api/game-recharge/orders', { params })
    orders.value = response.data.data
    pagination.total = response.data.total
  } catch (error) {
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 获取国家列表
const fetchCountries = async () => {
  try {
    const response = await api.get('/api/game-recharge/countries')
    countries.value = response.data.data
  } catch (error) {
    ElMessage.error('获取国家列表失败')
  }
}

// 搜索订单
const searchOrders = () => {
  pagination.page = 1
  fetchOrders()
}

// 重置筛选条件
const resetFilters = () => {
  Object.keys(filters).forEach(key => {
    filters[key] = key === 'status' ? null : ''
  })
  pagination.page = 1
  fetchOrders()
}

// 刷新订单
const refreshOrders = () => {
  fetchOrders()
}

// 查看订单详情
const viewOrder = async (order) => {
  try {
    const response = await api.post('/api/game-recharge/queryOrder', {
      order_id: order.order_id,
      api_key: 'admin_key', // 这里需要配置管理员API密钥
      sign: 'admin_sign' // 这里需要计算签名
    })
    selectedOrder.value = response.data.data
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取订单详情失败')
  }
}

// 审核通过
const approveOrder = async (order) => {
  try {
    await ElMessageBox.confirm('确认审核通过该订单？', '确认操作', {
      type: 'warning'
    })
    
    await api.post('/api/game-recharge/approveOrder', {
      order_id: order.order_id,
      api_key: 'admin_key',
      sign: 'admin_sign'
    })
    
    ElMessage.success('订单审核通过')
    dialogVisible.value = false
    fetchOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('审核操作失败')
    }
  }
}

// 审核拒绝
const rejectOrder = async (order) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因', '审核拒绝', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValidator: (value) => {
        if (!value) {
          return '请输入拒绝原因'
        }
        return true
      }
    })
    
    await api.post('/api/game-recharge/rejectOrder', {
      order_id: order.order_id,
      reason: reason,
      api_key: 'admin_key',
      sign: 'admin_sign'
    })
    
    ElMessage.success('订单已拒绝')
    dialogVisible.value = false
    fetchOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('审核操作失败')
    }
  }
}

// 处理排序变化
const handleSortChange = ({ prop, order }) => {
  sort.prop = prop
  sort.order = order
  fetchOrders()
}

// 处理页面大小变化
const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  fetchOrders()
}

// 处理当前页变化
const handleCurrentChange = (page) => {
  pagination.page = page
  fetchOrders()
}

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    0: 'info',
    1: 'warning',
    2: 'success',
    3: 'danger',
    4: 'info'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    0: '待提交凭证',
    1: '已提交凭证，待审核',
    2: '审核通过，充值成功',
    3: '审核拒绝',
    4: '订单取消'
  }
  return texts[status] || '未知状态'
}

// 格式化日期
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 组件挂载时获取数据
onMounted(() => {
  fetchCountries()
  fetchOrders()
})
</script>

<style scoped>
.order-management {
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

.order-detail {
  margin-bottom: 20px;
}

.payment-proof {
  margin-top: 20px;
}

.payment-proof h4 {
  margin-bottom: 10px;
  color: #303133;
}

.proof-text {
  margin-bottom: 10px;
}

.proof-image {
  text-align: center;
}

.dialog-footer {
  text-align: right;
}
</style>