import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'TaskList',
        component: () => import('@/views/TaskList.vue')
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/Categories.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue')
      },
      {
        path: 'game-recharge',
        name: 'GameRechargeDashboard',
        component: () => import('@/views/GameRecharge/Dashboard.vue')
      },
      {
        path: 'game-recharge/orders',
        name: 'GameRechargeOrders',
        component: () => import('@/views/GameRecharge/OrderManagement.vue')
      },
      {
        path: 'game-recharge/merchants',
        name: 'GameRechargeMerchants',
        component: () => import('@/views/GameRecharge/MerchantManagement.vue')
      },
      {
        path: 'game-recharge/countries',
        name: 'GameRechargeCountries',
        component: () => import('@/views/GameRecharge/CountryManagement.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 在路由守卫内部动态获取store实例，避免初始化时序问题
  const authStore = useAuthStore()
  
  // 如果是首次访问且有token，先检查认证状态
  if (authStore.token && !authStore.user && from.name === undefined) {
    try {
      await authStore.checkAuth()
    } catch (error) {
      console.log('认证检查失败:', error)
    }
  }
  
  // 如果访问需要认证的页面但未认证，跳转到登录页
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } 
  // 如果已认证但访问登录/注册页，跳转到首页
  else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/')
  } 
  // 其他情况正常通过
  else {
    next()
  }
})

export default router