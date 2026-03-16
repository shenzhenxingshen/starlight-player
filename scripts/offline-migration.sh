#!/bin/bash

# 念佛机应用完全离线化自动执行脚本
# 作者: Kiro AI Assistant
# 日期: 2026-03-09

set -e

PROJECT_DIR="/Users/litao.2025/Downloads/nianfoji-v20260309-v1"
cd "$PROJECT_DIR"

echo "========================================="
echo "念佛机应用完全离线化自动执行脚本"
echo "========================================="
echo ""

# 步骤1: 安装Tailwind CSS依赖
echo "📦 步骤1/8: 安装Tailwind CSS本地依赖..."
npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms @tailwindcss/container-queries

# 步骤2: 初始化Tailwind配置
echo "⚙️  步骤2/8: 创建Tailwind配置文件..."
npx tailwindcss init -p

# 步骤3: 创建目录结构
echo "📁 步骤3/8: 创建资源目录..."
mkdir -p public/fonts
mkdir -p public/assets/audio
mkdir -p public/assets/images
mkdir -p src
mkdir -p scripts

# 步骤4: 下载字体文件
echo "🔤 步骤4/8: 下载字体文件..."
echo "  - 下载 Noto Serif SC..."
curl -sL "https://fonts.gstatic.com/s/notoserifsc/v22/H4c8BXePl9DZ0Xe7gG9cyOj7mm63SzZBEtERe7U.woff2" \
  -o public/fonts/NotoSerifSC-Regular.woff2

curl -sL "https://fonts.gstatic.com/s/notoserifsc/v22/H4chBXePl9DZ0Xe7gG9cyOj7oqCcbzhqDtg.woff2" \
  -o public/fonts/NotoSerifSC-Bold.woff2

echo "  - 下载 Ma Shan Zheng..."
curl -sL "https://fonts.gstatic.com/s/mashanzheng/v10/NaPecZTRCLxvwo41b4gvzkXaRMTsDIRSfr0.woff2" \
  -o public/fonts/MaShanZheng-Regular.woff2

echo "  - 下载 Inter..."
curl -sL "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2" \
  -o public/fonts/Inter-Regular.woff2

curl -sL "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2" \
  -o public/fonts/Inter-Bold.woff2

echo "  - 下载 Material Symbols..."
curl -sL "https://fonts.gstatic.com/s/materialsymbolsoutlined/v189/kJF1BvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oDMzByHX9rA6RzaxHMPdY43zj-jCxv3fzvRNU22ZXGJpEpjC_1v-p_4MrImHCIJIZrDCvHOej.woff2" \
  -o public/fonts/MaterialSymbolsOutlined.woff2

# 步骤5: 下载封面图片
echo "🖼️  步骤5/8: 下载封面图片..."
curl -sL "https://www.shouyueliang.org/wp-content/uploads/2021/04/1623587633-v500-4-1.gif" \
  -o public/assets/images/cover.gif

# 步骤6: 下载音频文件
echo "🎵 步骤6/8: 下载音频文件（这可能需要几分钟）..."
BASE_URL="https://shouyueliangplayermp3.s3.cn-south-1.jdcloud-oss.com/mp3"

download_audio() {
  local file="$1"
  local encoded=$(echo "$file" | sed 's/ /%20/g')
  echo "  - 下载: $file"
  curl -sL "$BASE_URL/$encoded" -o "public/assets/audio/$file"
}

download_audio "A01 大悲咒（跟我学）.mp3"
download_audio "A02 大悲咒（唱版）.mp3"
download_audio "A03 大悲咒（慢版）.mp3"
download_audio "A04 大悲咒（快版）.mp3"
download_audio "A05 大悲咒（共修版）.mp3"
download_audio "B06 发愿回向文.mp3"
download_audio "C07 南无阿弥陀佛（唱版）.mp3"
download_audio "C08 南无阿弥陀佛（慢版）.mp3"
download_audio "C09 南无阿弥陀佛（快版）.mp3"
download_audio "C10 阿弥陀佛（唱版）.mp3"
download_audio "C11 阿弥陀佛（慢版）.mp3"
download_audio "C12 阿弥陀佛（快版）.mp3"
download_audio "C13 南无观世音菩萨（唱版）.mp3"
download_audio "C14 南无观世音菩萨（慢版）.mp3"
download_audio "D15 期盼（歌曲）.mp3"
download_audio "D16 回向偈.mp3"
download_audio "D17 观音灵感歌.mp3"
download_audio "D18 观音菩萨如秋月.mp3"
download_audio "D19 一声佛号一声心.mp3"
download_audio "D20 观音菩萨偈.mp3"
download_audio "D21 愿做菩萨那朵莲.mp3"

# 步骤7: 生成配置文件
echo "📝 步骤7/8: 生成配置文件..."

# 生成tailwind.config.js将在下一步完成
# 生成src/index.css将在下一步完成
# 修改constants.tsx将在下一步完成

echo "⚠️  注意: 配置文件需要手动更新，请参考 OFFLINE_MIGRATION_REPORT.md"

# 步骤8: 验证资源
echo "✅ 步骤8/8: 验证下载的资源..."
echo ""
echo "字体文件:"
ls -lh public/fonts/
echo ""
echo "图片文件:"
ls -lh public/assets/images/
echo ""
echo "音频文件:"
ls -lh public/assets/audio/ | head -10
echo "..."
echo ""

echo "========================================="
echo "✅ 资源下载完成！"
echo "========================================="
echo ""
echo "📋 下一步操作:"
echo "1. 查看 OFFLINE_MIGRATION_REPORT.md 了解详细步骤"
echo "2. 运行 node scripts/generate-configs.js 生成配置文件"
echo "3. 运行 npm run build 构建离线版本"
echo ""
echo "⚠️  重要提示:"
echo "- 需要手动更新 tailwind.config.js"
echo "- 需要创建 src/index.css"
echo "- 需要修改 constants.tsx 使用本地路径"
echo "- 需要更新 index.html 移除CDN引用"
echo ""
