<template>
  <div class="dashboard">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="250px" class="sidebar">
        <div class="logo">
          <h2>Todo List</h2>
        </div>
        
        <el-menu
          :default-active="$route.path"
          router
          class="sidebar-menu"
        >
          <el-menu-item index="/">
            <el-icon><List /></el-icon>
            <span>任务列表</span>
          </el-menu-item>
          
          <el-menu-item index="/categories">
            <el-icon><Collection /></el-icon>
            <span>分类管理</span>
          </el-menu-item>
          
          <el-menu-item index="/profile">
            <el-icon><User /></el-icon>
            <span>个人资料</span>
          </el-menu-item>
          
          <el-sub-menu index="game-recharge">
            <template #title>
              <el-icon><Money /></el-icon>
              <span>游戏充值平台</span>
            </template>
            <el-menu-item index="/game-recharge">
              <el-icon><DataAnalysis /></el-icon>
              <span>数据统计</span>
            </el-menu-item>
            <el-menu-item index="/game-recharge/orders">
              <el-icon><Document /></el-icon>
              <span>订单管理</span>
            </el-menu-item>
            <el-menu-item index="/game-recharge/merchants">
              <el-icon><Shop /></el-icon>
              <span>商户管理</span>
            </el-menu-item>
            <el-menu-item index="/game-recharge/countries">
              <el-icon><Location /></el-icon>
              <span>国家管理</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      
      <!-- 主内容区 -->
      <el-container>
        <!-- 顶部导航 -->
        <el-header class="header">
          <div class="header-left">
            <h3>{{ getPageTitle() }}</h3>
          </div>
          
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-icon><Avatar /></el-icon>
                {{ authStore.user?.username }}
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人资料
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <!-- 主要内容 -->
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()

// 获取页面标题
const getPageTitle = () => {
  const titleMap = {
    '/': '任务列表',
    '/categories': '分类管理',
    '/profile': '个人资料',
    '/game-recharge': '游戏充值平台 - 数据统计',
    '/game-recharge/orders': '游戏充值平台 - 订单管理',
    '/game-recharge/merchants': '游戏充值平台 - 商户管理',
    '/game-recharge/countries': '游戏充值平台 - 国家管理'
  }
  return titleMap[route.path] || '任务管理'
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'logout':
      authStore.logout()
      router.push('/login')
      break
  }
}
//参加肯德基深Vi就哦i
onMounted(() => {
  // 初始化加载分类数据
  categoriesStore.fetchCategories()
})
</script>

<style scoped>

/* 修正子菜单（展开后的 el-menu--inline）背景色为深色 */
.sidebar-menu :deep(.el-menu--inline) {
  background-color: transparent !important;
}

/* 修正子菜单项颜色 */
.sidebar-menu :deep(.el-menu--inline .el-menu-item) {
  background-color: transparent !important;
  color: #ecf0f1 !important;
  margin: 5px 15px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

/* 子菜单 hover 效果 */
.sidebar-menu :deep(.el-menu--inline .el-menu-item:hover) {
  background: linear-gradient(135deg, #3498db, #2980b9) !important;
  color: white !important;
  transform: translateX(5px);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

/* 子菜单 active 状态 */
.sidebar-menu :deep(.el-menu--inline .el-menu-item.is-active) {
  background: linear-gradient(135deg, #e74c3c, #c0392b) !important;
  color: white !important;
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
}

.dashboard {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.sidebar {
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.logo {
  padding: 25px 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}

.logo h2 {
  color: white;
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

.sidebar-menu {
  border: none;
  background-color: transparent;
  padding-top: 10px;
}

.sidebar-menu .el-menu-item {
  color: #ecf0f1;
  border-bottom: none;
  margin: 5px 15px;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.sidebar-menu .el-menu-item:hover {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  transform: translateX(5px);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.sidebar-menu .el-menu-item.is-active {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
}

/* 新增：为子菜单标题设置样式 */
.sidebar-menu :deep(.el-sub-menu__title) {
  color: #ecf0f1;
  font-weight: 500; /* 保持字体粗细一致 */
}

/* 优化：也为子菜单标题添加悬停效果，使其行为更统一 */
.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  transform: translateX(5px);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
  margin: 5px 15px;
  border-radius: 8px;
}

.header {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-bottom: none;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  backdrop-filter: blur(10px);
}

.header-left h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #34495e;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.user-info:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.user-info .el-icon {
  margin-right: 8px;
}

.user-info .el-icon--right {
  margin-left: 8px;
  margin-right: 0;
}

.main-content {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 30px;
  min-height: calc(100vh - 60px);
  position: relative;
}

.main-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
  pointer-events: none;
}
</style>