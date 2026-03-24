#!/bin/bash
# 星光播放器 - 编译构建 & 发布脚本
# 用法: ./build-and-deploy.sh <版本号> [发布路径]
# 示例: ./build-and-deploy.sh 0.2.0
#       ./build-and-deploy.sh 0.3.0 v0.3.0-beta

set -e

VERSION="${1:?用法: $0 <版本号> [发布路径]  例: $0 0.2.0}"
DEPLOY_PATH="${2:-v${VERSION}}"
APK_NAME="xingguang-v${VERSION}.apk"
SERVER="root@116.196.86.84"
REMOTE_DIR="/var/www/app-download/starlight/${DEPLOY_PATH}"
DOWNLOAD_URL="http://116.196.86.84/starlight/${DEPLOY_PATH}/${APK_NAME}"

echo "=========================================="
echo "星光播放器 v${VERSION} - 构建 & 发布"
echo "发布地址: ${DOWNLOAD_URL}"
echo "=========================================="
echo ""

# 1. 更新版本号
echo "📝 [1/7] 更新版本号为 ${VERSION}..."
sed -i '' "s/versionName \"[^\"]*\"/versionName \"${VERSION}\"/" android/app/build.gradle
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" package.json
echo "✅ 版本号已更新"
echo ""

# 2. Web 构建
echo "📦 [2/7] 构建 Web 应用..."
npm run build
echo "✅ Web 构建完成"
echo ""

# 3. 同步到 Android
echo "🔄 [3/7] 同步到 Android..."
npx cap sync android
echo "✅ 同步完成"
echo ""

# 4. 构建 APK
echo "🔨 [4/7] 构建 Android APK..."
cd android
./gradlew clean assembleRelease
cd ..
echo "✅ APK 构建完成"
echo ""

# 5. 签名
echo "✍️  [5/7] 签名 APK..."
~/Library/Android/sdk/build-tools/35.0.0/apksigner sign \
  --ks my-release-key.jks \
  --ks-key-alias my-key-alias \
  --ks-pass pass:shouyueliang2026 \
  --out "${APK_NAME}" \
  android/app/build/outputs/apk/release/app-release-unsigned.apk
echo "✅ 签名完成: ${APK_NAME} ($(du -h "${APK_NAME}" | cut -f1))"
echo ""

# 6. 上传
echo "🚀 [6/7] 上传到服务器..."
ssh ${SERVER} "mkdir -p ${REMOTE_DIR}"
scp "${APK_NAME}" "${SERVER}:${REMOTE_DIR}/${APK_NAME}"
echo "✅ 上传完成"
echo ""

# 7. 验证
echo "🔍 [7/7] 验证..."
HTTP_CODE=$(curl -sI -o /dev/null -w "%{http_code}" "${DOWNLOAD_URL}")
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ 验证通过"
else
  echo "❌ 验证失败 (HTTP ${HTTP_CODE})"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ 全部完成！"
echo "📦 APK: ${APK_NAME}"
echo "🌐 下载: ${DOWNLOAD_URL}"
echo "📊 统计: http://116.196.86.84/starlight/${DEPLOY_PATH}/stats.html"
echo "=========================================="
