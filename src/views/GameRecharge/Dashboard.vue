<template>
  <div class="game-recharge-dashboard">
    <div class="page-header">
      <h2>游戏充值平台 - 数据统计</h2>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="handleDateChange"
        />
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total-orders">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalOrders }}</div>
              <div class="stat-label">总订单数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total-amount">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatAmount(stats.totalAmount) }}</div>
              <div class="stat-label">总交易金额</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon success-orders">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.successOrders }}</div>
              <div class="stat-label">成功订单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon success-rate">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.successRate }}%</div>
              <div class="stat-label">成功率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-section">
      <!-- 订单趋势图 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>订单趋势</span>
              <el-select v-model="orderTrendType" size="small" style="width: 120px;">
                <el-option label="按天" value="day" />
                <el-option label="按周" value="week" />
                <el-option label="按月" value="month" />
              </el-select>
            </div>
          </template>
          <div ref="orderTrendChart" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 订单状态分布 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>订单状态分布</span>
          </template>
          <div ref="orderStatusChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-section">
      <!-- 国家分布 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>国家分布</span>
          </template>
          <div ref="countryChart" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 商户排行 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>商户交易排行</span>
          </template>
          <div ref="merchantChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近订单 -->
    <el-card class="recent-orders-card">
      <template #header>
        <div class="card-header">
          <span>最近订单</span>
          <el-button size="small" @click="$router.push('/game-recharge/orders')">查看全部</el-button>
        </div>
      </template>
      <el-table :data="recentOrders" stripe style="width: 100%">
        <el-table-column prop="order_id" label="订单号" width="180" />
        <el-table-column prop="platform_order_id" label="平台订单号" width="180" />
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            {{ row.amount }} {{ row.country?.currency || 'CNY' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="150">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="country.name" label="国家" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Document, Money, CircleCheck, TrendCharts } from '@element-plus/icons-vue'
import api from '@/services/api'
import dayjs from 'dayjs'
import * as echarts from 'echarts'

// 响应式数据
const loading = ref(false)
const dateRange = ref([dayjs().subtract(7, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')])
const orderTrendType = ref('day')

// 图表实例
const orderTrendChart = ref()
const orderStatusChart = ref()
const countryChart = ref()
const merchantChart = ref()

let orderTrendChartInstance = null
let orderStatusChartInstance = null
let countryChartInstance = null
let merchantChartInstance = null

// 统计数据
const stats = reactive({
  totalOrders: 0,
  totalAmount: 0,
  successOrders: 0,
  successRate: 0
})

// 最近订单
const recentOrders = ref([])

// 图表数据
const chartData = reactive({
  orderTrend: [],
  orderStatus: [],
  countryDistribution: [],
  merchantRanking: []
})

// 获取统计数据
const fetchStats = async () => {
  try {
    const params = {
      start_date: dateRange.value[0],
      end_date: dateRange.value[1]
    }
    
    const response = await api.get('/api/game-recharge/stats', { params })
    const data = response.data.data
    
    stats.totalOrders = data.totalOrders
    stats.totalAmount = data.totalAmount
    stats.successOrders = data.successOrders
    stats.successRate = data.successRate
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  }
}

// 获取订单趋势数据
const fetchOrderTrend = async () => {
  try {
    const params = {
      start_date: dateRange.value[0],
      end_date: dateRange.value[1],
      type: orderTrendType.value
    }
    
    const response = await api.get('/api/game-recharge/stats/order-trend', { params })
    chartData.orderTrend = response.data.data
    renderOrderTrendChart()
  } catch (error) {
    ElMessage.error('获取订单趋势数据失败')
  }
}

// 获取订单状态分布
const fetchOrderStatus = async () => {
  try {
    const params = {
      start_date: dateRange.value[0],
      end_date: dateRange.value[1]
    }
    
    const response = await api.get('/api/game-recharge/stats/order-status', { params })
    chartData.orderStatus = response.data.data
    renderOrderStatusChart()
  } catch (error) {
    ElMessage.error('获取订单状态数据失败')
  }
}

// 获取国家分布数据
const fetchCountryDistribution = async () => {
  try {
    const params = {
      start_date: dateRange.value[0],
      end_date: dateRange.value[1]
    }
    
    const response = await api.get('/api/game-recharge/stats/country-distribution', { params })
    chartData.countryDistribution = response.data.data
    renderCountryChart()
  } catch (error) {
    ElMessage.error('获取国家分布数据失败')
  }
}

// 获取商户排行数据
const fetchMerchantRanking = async () => {
  try {
    const params = {
      start_date: dateRange.value[0],
      end_date: dateRange.value[1]
    }
    
    const response = await api.get('/api/game-recharge/stats/merchant-ranking', { params })
    chartData.merchantRanking = response.data.data
    renderMerchantChart()
  } catch (error) {
    ElMessage.error('获取商户排行数据失败')
  }
}

// 获取最近订单
const fetchRecentOrders = async () => {
  try {
    const response = await api.get('/api/game-recharge/orders/recent', {
      params: { limit: 10 }
    })
    recentOrders.value = response.data.data
  } catch (error) {
    ElMessage.error('获取最近订单失败')
  }
}

// 渲染订单趋势图
const renderOrderTrendChart = () => {
  if (!orderTrendChartInstance) {
    orderTrendChartInstance = echarts.init(orderTrendChart.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['订单数量', '成功订单']
    },
    xAxis: {
      type: 'category',
      data: chartData.orderTrend.map(item => item.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '订单数量',
        type: 'line',
        data: chartData.orderTrend.map(item => item.total),
        smooth: true
      },
      {
        name: '成功订单',
        type: 'line',
        data: chartData.orderTrend.map(item => item.success),
        smooth: true
      }
    ]
  }
  
  orderTrendChartInstance.setOption(option)
}

// 渲染订单状态图
const renderOrderStatusChart = () => {
  if (!orderStatusChartInstance) {
    orderStatusChartInstance = echarts.init(orderStatusChart.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '订单状态',
        type: 'pie',
        radius: '50%',
        data: chartData.orderStatus.map(item => ({
          value: item.count,
          name: getStatusText(item.status)
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  orderStatusChartInstance.setOption(option)
}

// 渲染国家分布图
const renderCountryChart = () => {
  if (!countryChartInstance) {
    countryChartInstance = echarts.init(countryChart.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: chartData.countryDistribution.map(item => item.country_name)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '订单数量',
        type: 'bar',
        data: chartData.countryDistribution.map(item => item.count),
        itemStyle: {
          color: '#5470c6'
        }
      }
    ]
  }
  
  countryChartInstance.setOption(option)
}

// 渲染商户排行图
const renderMerchantChart = () => {
  if (!merchantChartInstance) {
    merchantChartInstance = echarts.init(merchantChart.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: chartData.merchantRanking.map(item => item.merchant_id)
    },
    series: [
      {
        name: '交易金额',
        type: 'bar',
        data: chartData.merchantRanking.map(item => item.amount),
        itemStyle: {
          color: '#91cc75'
        }
      }
    ]
  }
  
  merchantChartInstance.setOption(option)
}

// 刷新所有数据
const refreshData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchStats(),
      fetchOrderTrend(),
      fetchOrderStatus(),
      fetchCountryDistribution(),
      fetchMerchantRanking(),
      fetchRecentOrders()
    ])
  } finally {
    loading.value = false
  }
}

// 处理日期范围变化
const handleDateChange = () => {
  refreshData()
}

// 格式化金额
const formatAmount = (amount) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount || 0)
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

// 监听订单趋势类型变化
watch(orderTrendType, () => {
  fetchOrderTrend()
})

// 组件挂载时初始化
onMounted(() => {
  nextTick(() => {
    refreshData()
  })
})
</script>

<style scoped>
.game-recharge-dashboard {
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

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.stat-icon.total-orders {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.total-amount {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.success-orders {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.success-rate {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.charts-section {
  margin-bottom: 20px;
}

.chart-card {
  height: 400px;
}

.chart-container {
  height: 320px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recent-orders-card {
  margin-bottom: 20px;
}
</style>