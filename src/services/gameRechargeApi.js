import api from './api'

// 订单相关API
export const orderApi = {
  // 获取订单列表
  getOrders(params = {}) {
    return api.get('/orders', { params })
  },
  
  // 获取订单详情
  getOrderDetail(orderId) {
    return api.get(`/orders/${orderId}`)
  },
  
  // 审核订单
  reviewOrder(orderId, data) {
    return api.post(`/orders/${orderId}/review`, data)
  },
  
  // 获取订单统计
  getOrderStats(params = {}) {
    return api.get('/orders/stats', { params })
  }
}

// 商户相关API
export const merchantApi = {
  // 获取商户列表
  getMerchants(params = {}) {
    return api.get('/merchants', { params })
  },
  
  // 创建商户
  createMerchant(data) {
    return api.post('/merchants', data)
  },
  
  // 更新商户
  updateMerchant(merchantId, data) {
    return api.put(`/merchants/${merchantId}`, data)
  },
  
  // 删除商户
  deleteMerchant(merchantId) {
    return api.delete(`/merchants/${merchantId}`)
  },
  
  // 切换商户状态
  toggleMerchantStatus(merchantId) {
    return api.patch(`/merchants/${merchantId}/toggle-status`)
  },
  
  // 重新生成API密钥
  regenerateApiKey(merchantId) {
    return api.put(`/api/game-recharge/merchants/${merchantId}/regenerate-api-key`)
  },

  // 重新生成密钥
  regenerateSecretKey(merchantId) {
    return api.put(`/api/game-recharge/merchants/${merchantId}/regenerate-secret-key`)
  }
}

// 国家相关API
export const countryApi = {
  // 获取国家列表
  getCountries(params = {}) {
    return api.get('/countries', { params })
  },
  
  // 创建国家
  createCountry(data) {
    return api.post('/countries', data)
  },
  
  // 更新国家
  updateCountry(countryId, data) {
    return api.put(`/countries/${countryId}`, data)
  },
  
  // 删除国家
  deleteCountry(countryId) {
    return api.delete(`/countries/${countryId}`)
  },
  
  // 切换国家状态
  toggleCountryStatus(countryId) {
    return api.patch(`/countries/${countryId}/toggle-status`)
  }
}

// 统计相关API
export const statsApi = {
  // 获取仪表板统计数据
  getDashboardStats(params = {}) {
    return api.get('/stats/dashboard', { params })
  },
  
  // 获取订单趋势数据
  getOrderTrends(params = {}) {
    return api.get('/stats/order-trends', { params })
  },
  
  // 获取订单状态分布
  getOrderStatusDistribution(params = {}) {
    return api.get('/stats/order-status-distribution', { params })
  },
  
  // 获取国家分布数据
  getCountryDistribution(params = {}) {
    return api.get('/stats/country-distribution', { params })
  },
  
  // 获取商户排行
  getMerchantRanking(params = {}) {
    return api.get('/stats/merchant-ranking', { params })
  }
}

// 导出所有API
export default {
  orderApi,
  merchantApi,
  countryApi,
  statsApi
}