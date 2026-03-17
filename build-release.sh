#!/bin/bash
# 星光播放器 - 完整构建脚本
# 用途: 构建、签名并部署 APK

set -e  # 遇到错误立即退出

echo "=========================================="
echo "星光播放器 - 完整构建流程"
echo "=========================================="
echo ""

# 1. Web 构建
echo "📦 [1/6] 构建 Web 应用..."
npm run build
echo "✅ Web 构建完成"
echo ""

# 2. 同步到 Android
echo "🔄 [2/6] 同步到 Android..."
npx cap sync android
echo "✅ 同步完成"
echo ""

# 3. 清理并构建 APK
echo "🔨 [3/6] 构建 Android APK..."
cd android
./gradlew clean assembleRelease
cd ..
echo "✅ APK 构建完成"
echo ""

# 4. 签名 APK
echo "✍️  [4/6] 签名 APK..."
~/Library/Android/sdk/build-tools/35.0.0/apksigner sign \
  --ks my-release-key.jks \
  --ks-key-alias my-key-alias \
  --ks-pass pass:shouyueliang2026 \
  --out xingguang-v0.1.0.apk \
  android/app/build/outputs/apk/release/app-release-unsigned.apk
echo "✅ APK 签名完成"
echo ""

# 5. 显示 APK 信息
echo "📊 [5/6] APK 信息:"
ls -lh xingguang-v0.1.0.apk
echo ""

# 6. 上传到服务器
echo "🚀 [6/6] 上传到服务器..."
scp xingguang-v0.1.0.apk root@116.196.86.84:/var/www/app-download/test/
echo "✅ 上传完成"
echo ""

echo "=========================================="
echo "✅ 构建流程全部完成！"
echo "📦 APK: xingguang-v0.1.0.apk"
echo "🌐 下载: http://116.196.86.84/test/"
echo "=========================================="
