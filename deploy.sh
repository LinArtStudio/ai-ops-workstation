#!/bin/bash
# AI产品运营工作台 - 部署脚本
# 使用方法: ./deploy.sh

set -e

echo "🚀 开始部署 AI产品运营工作台..."

# 配置
SERVER="root@114.55.110.19"
REMOTE_DIR="/opt/ai-product-ops-workstation"
LOCAL_DIR="$(pwd)"

# 1. 构建项目
echo "📦 构建项目..."
npm run build

# 2. 打包项目
echo "📁 打包项目..."
tar -czf ai-product-ops-workstation.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=*.tar.gz \
  .

# 3. 上传到服务器
echo "⬆️  上传到服务器..."
scp ai-product-ops-workstation.tar.gz $SERVER:/tmp/

# 4. 在服务器上部署
echo "🔧 在服务器上部署..."
ssh $SERVER << 'EOF'
  # 停止现有服务
  pm2 stop ai-ops 2>/dev/null || true
  
  # 备份旧版本
  if [ -d /opt/ai-product-ops-workstation ]; then
    mv /opt/ai-product-ops-workstation /opt/ai-product-ops-workstation-backup-$(date +%Y%m%d%H%M%S)
  fi
  
  # 创建新目录
  mkdir -p /opt/ai-product-ops-workstation
  cd /opt/ai-product-ops-workstation
  
  # 解压新版本
  tar -xzf /tmp/ai-product-ops-workstation.tar.gz
  
  # 安装依赖
  npm install --production
  
  # 启动服务
  pm2 start npm --name ai-ops -- run dev
  
  # 保存PM2配置
  pm2 save
  
  echo "✅ 部署完成！"
EOF

# 5. 清理临时文件
echo "🧹 清理临时文件..."
rm -f ai-product-ops-workstation.tar.gz

echo "🎉 部署成功！"
echo "访问地址: http://114.55.110.19:3000"
