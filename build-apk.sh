#!/bin/bash

# 念佛机APK完整构建脚本
# 包含离线化 + Capacitor Android构建

set -e

PROJECT_DIR="/Users/litao.2025/Downloads/nianfoji-v20260309-v1"
LOGO_SOURCE="/Users/litao.2025/Downloads/nianfoji-v6/nianfoji-logo-v6.png"

cd "$PROJECT_DIR"

echo "========================================="
echo "念佛机APK完整构建流程"
echo "========================================="
echo ""

# ============================================
# 阶段1: 离线化资源准备
# ============================================
echo "📦 阶段1/6: 离线化资源准备"
echo "----------------------------------------"

# 1.1 安装Tailwind CSS依赖
echo "安装Tailwind CSS依赖..."
npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms @tailwindcss/container-queries

# 1.2 创建目录结构
echo "创建资源目录..."
mkdir -p public/fonts
mkdir -p public/assets/audio
mkdir -p public/assets/images
mkdir -p src

# 1.3 下载字体文件
echo "下载字体文件..."
curl -sL "https://fonts.gstatic.com/s/notoserifsc/v22/H4c8BXePl9DZ0Xe7gG9cyOj7mm63SzZBEtERe7U.woff2" \
  -o public/fonts/NotoSerifSC-Regular.woff2
curl -sL "https://fonts.gstatic.com/s/notoserifsc/v22/H4chBXePl9DZ0Xe7gG9cyOj7oqCcbzhqDtg.woff2" \
  -o public/fonts/NotoSerifSC-Bold.woff2
curl -sL "https://fonts.gstatic.com/s/mashanzheng/v10/NaPecZTRCLxvwo41b4gvzkXaRMTsDIRSfr0.woff2" \
  -o public/fonts/MaShanZheng-Regular.woff2
curl -sL "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2" \
  -o public/fonts/Inter-Regular.woff2
curl -sL "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2" \
  -o public/fonts/Inter-Bold.woff2
curl -sL "https://fonts.gstatic.com/s/materialsymbolsoutlined/v189/kJF1BvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oDMzByHX9rA6RzaxHMPdY43zj-jCxv3fzvRNU22ZXGJpEpjC_1v-p_4MrImHCIJIZrDCvHOej.woff2" \
  -o public/fonts/MaterialSymbolsOutlined.woff2

# 1.4 下载封面图片
echo "下载封面图片..."
curl -sL "https://www.shouyueliang.org/wp-content/uploads/2021/04/1623587633-v500-4-1.gif" \
  -o public/assets/images/cover.gif

# 1.5 下载音频文件（这是最耗时的部分）
echo "下载音频文件（约150MB，需要几分钟）..."
BASE_URL="https://shouyueliangplayermp3.s3.cn-south-1.jdcloud-oss.com/mp3"

download_audio() {
  local file="$1"
  local encoded=$(echo "$file" | sed 's/ /%20/g')
  echo "  - $file"
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

echo "✅ 阶段1完成：资源下载完成"
echo ""

# ============================================
# 阶段2: 生成配置文件
# ============================================
echo "📝 阶段2/6: 生成配置文件"
echo "----------------------------------------"

# 这部分将由Node.js脚本完成
node scripts/generate-configs.js

echo "✅ 阶段2完成：配置文件已生成"
echo ""

# ============================================
# 阶段3: 安装依赖并构建Web应用
# ============================================
echo "🔨 阶段3/6: 构建Web应用"
echo "----------------------------------------"

npm install
npm run build

echo "✅ 阶段3完成：Web应用构建完成"
echo ""

# ============================================
# 阶段4: 初始化Capacitor
# ============================================
echo "📱 阶段4/6: 初始化Capacitor"
echo "----------------------------------------"

# 安装Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 初始化Capacitor（如果还没有）
if [ ! -f "capacitor.config.json" ]; then
  npx cap init "守月亮念佛机" "com.shouyueliang.nianfoji" --web-dir=dist
fi

# 添加Android平台（如果还没有）
if [ ! -d "android" ]; then
  npx cap add android
fi

echo "✅ 阶段4完成：Capacitor初始化完成"
echo ""

# ============================================
# 阶段5: 生成应用图标
# ============================================
echo "🎨 阶段5/6: 生成应用图标"
echo "----------------------------------------"

# 生成带25%内边距的图标
echo "生成带内边距的图标..."

# 创建临时目录
mkdir -p temp_icons

# 使用ImageMagick添加25%内边距
convert "$LOGO_SOURCE" \
  -gravity center \
  -background transparent \
  -extent 133.33%x133.33% \
  temp_icons/logo_with_padding.png

# 生成各种尺寸的图标
mkdir -p android/app/src/main/res/mipmap-mdpi
mkdir -p android/app/src/main/res/mipmap-hdpi
mkdir -p android/app/src/main/res/mipmap-xhdpi
mkdir -p android/app/src/main/res/mipmap-xxhdpi
mkdir -p android/app/src/main/res/mipmap-xxxhdpi

convert temp_icons/logo_with_padding.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
convert temp_icons/logo_with_padding.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
convert temp_icons/logo_with_padding.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
convert temp_icons/logo_with_padding.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
convert temp_icons/logo_with_padding.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# 生成圆形图标（Android 8.0+）
convert temp_icons/logo_with_padding.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
convert temp_icons/logo_with_padding.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
convert temp_icons/logo_with_padding.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
convert temp_icons/logo_with_padding.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
convert temp_icons/logo_with_padding.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png

# 清理临时文件
rm -rf temp_icons

echo "✅ 阶段5完成：应用图标已生成"
echo ""

# ============================================
# 阶段6: 同步并构建APK
# ============================================
echo "🚀 阶段6/6: 构建APK"
echo "----------------------------------------"

# 同步Web资源到Android
npx cap sync android

# 复制Web资源到Android
npx cap copy android

echo "开始构建APK..."
cd android
./gradlew assembleRelease

echo ""
echo "========================================="
echo "✅ 构建完成！"
echo "========================================="
echo ""
echo "APK位置:"
echo "  $(pwd)/app/build/outputs/apk/release/app-release-unsigned.apk"
echo ""
echo "下一步:"
echo "1. 签名APK（如果需要）"
echo "2. 安装到设备测试"
echo ""
