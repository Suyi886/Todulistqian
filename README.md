# Vue3 Todo List 任务管理系统

一个基于 Vue3 + Element Plus 的现代化任务管理系统前端应用。

## 功能特性

### 🔐 用户认证
- 用户注册和登录
- JWT Token 认证
- 自动登录状态检查
- 安全的路由守卫

### 📝 任务管理
- 创建、编辑、删除任务
- 任务状态管理（待处理、进行中、已完成、已归档）
- 优先级设置（高、中、低）
- 任务分类标签
- 截止时间设置
- 任务搜索和筛选
- 分页显示

### 🏷️ 分类管理
- 创建自定义分类
- 分类颜色设置
- 分类统计信息
- 分类编辑和删除

### 📊 数据统计
- 任务状态统计
- 分类任务分布
- 个人任务概览
- 最近任务展示

### 🎨 用户界面
- 响应式设计
- 现代化 UI 组件
- 直观的操作体验
- 优雅的动画效果

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **UI 组件库**: Element Plus
- **HTTP 客户端**: Axios
- **构建工具**: Vite
- **日期处理**: Day.js
- **图标**: Element Plus Icons

## 项目结构

```
src/
├── components/          # 可复用组件
│   └── TaskDialog.vue   # 任务创建/编辑对话框
├── router/              # 路由配置
│   └── index.js
├── services/            # API 服务
│   └── api.js           # Axios 配置和拦截器
├── stores/              # Pinia 状态管理
│   ├── auth.js          # 认证状态
│   ├── tasks.js         # 任务状态
│   └── categories.js    # 分类状态
├── views/               # 页面组件
│   ├── Login.vue        # 登录页
│   ├── Register.vue     # 注册页
│   ├── Dashboard.vue    # 主布局
│   ├── TaskList.vue     # 任务列表
│   ├── Categories.vue   # 分类管理
│   └── Profile.vue      # 个人资料
├── App.vue              # 根组件
├── main.js              # 应用入口
└── style.css            # 全局样式
```

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装依赖

```bash
npm install
```

### 环境配置

复制 `.env` 文件并根据需要修改配置：

```bash
# API配置
VITE_API_BASE_URL=http://localhost:3000

# 应用配置
VITE_APP_TITLE=Todo List - 任务管理系统
VITE_APP_VERSION=1.0.0
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动。

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## API 接口对接

本项目对接的后端 API 接口包括：

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/users/me` - 获取用户信息

### 任务管理接口
- `GET /api/tasks` - 获取任务列表（支持筛选和分页）
- `POST /api/tasks` - 创建任务
- `GET /api/tasks/{id}` - 获取任务详情
- `PUT /api/tasks/{id}` - 更新任务
- `DELETE /api/tasks/{id}` - 删除任务

### 分类管理接口
- `GET /api/categories` - 获取分类列表
- `POST /api/categories` - 创建分类
- `PUT /api/categories/{id}` - 更新分类
- `DELETE /api/categories/{id}` - 删除分类

### 提醒管理接口
- `POST /api/tasks/{id}/reminders` - 添加提醒
- `PUT /api/reminders/{id}` - 更新提醒
- `DELETE /api/reminders/{id}` - 删除提醒

### 附件管理接口
- `POST /api/tasks/{id}/attachments` - 上传附件
- `DELETE /api/attachments/{id}` - 删除附件

## 主要功能说明

### 用户认证流程
1. 用户注册或登录
2. 获取 JWT Token
3. Token 自动添加到请求头
4. 路由守卫检查认证状态

### 任务管理流程
1. 查看任务列表（支持筛选和搜索）
2. 创建新任务（设置标题、描述、优先级、分类等）
3. 编辑任务信息
4. 更新任务状态
5. 删除不需要的任务

### 分类管理流程
1. 创建自定义分类
2. 设置分类颜色
3. 查看分类统计
4. 编辑或删除分类

## 开发说明

### 状态管理
使用 Pinia 进行状态管理，主要包括：
- `authStore`: 用户认证状态
- `tasksStore`: 任务数据和操作
- `categoriesStore`: 分类数据和操作

### API 请求
- 使用 Axios 进行 HTTP 请求
- 自动添加认证头
- 统一错误处理
- 请求和响应拦截器

### 路由守卫
- 认证路由保护
- 自动重定向
- 访客页面限制

## 部署说明

### 构建应用
```bash
npm run build
```

### 部署到服务器
将 `dist` 目录中的文件部署到 Web 服务器即可。

### 环境变量配置
在生产环境中，请确保正确配置 API 基础 URL：
```
VITE_API_BASE_URL=https://your-api-domain.com
```

### 端口配置
- 前端开发服务器：http://localhost:5173
- 后端API服务器：http://localhost:3000

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 许可证

MIT License