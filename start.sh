#!/bin/bash

# Vue3 Todo List 启动脚本

echo "=== Vue3 Todo List 任务管理系统 ==="
echo "正在检查环境..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    echo "请先安装 Node.js (版本 >= 16.0.0)"
    echo "安装命令: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    echo "请先安装 npm"
    echo "安装命令: sudo apt install -y npm"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
fi

# 构建生产版本
echo "🔨 正在构建生产版本..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 构建完成"

# 启动生产预览服务器
echo "🚀 启动生产服务器..."
echo "应用将在 http://localhost:4173 启动"
echo "按 Ctrl+C 停止服务器"
npm run preview -- --host 0.0.0.0 --port 4173