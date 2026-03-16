# 念佛机APK构建 - 快速执行指南

## 🎯 推荐方案

基于之前的构建经验，我建议使用以下方案：

### 方案A: 在当前目录构建（推荐）✅

**优点**:
- 代码最新
- 避免重复文件
- 直接应用离线化改造

**执行**:
```bash
cd /Users/litao.2025/Downloads/nianfoji-v20260309-v1
bash build-apk.sh
```

### 方案B: 复制到app编译目录

**优点**:
- 保留之前的构建环境
- 已有Android配置

**执行**:
```bash
# 备份旧代码
mv /Users/litao.2025/Downloads/app编译 /Users/litao.2025/Downloads/app编译-backup

# 复制新代码
cp -r /Users/litao.2025/Downloads/nianfoji-v20260309-v1 /Users/litao.2025/Downloads/app编译

# 执行构建
cd /Users/litao.2025/Downloads/app编译
bash build-apk.sh
```

## 🚀 一键执行（方案A）

```bash
cd /Users/litao.2025/Downloads/nianfoji-v20260309-v1

# 执行完整构建流程
bash build-apk.sh
```

## 📋 手动执行步骤

如果自动化脚本失败，可以手动执行：

### 步骤1: 离线化资源准备

```bash
cd /Users/litao.2025/Downloads/nianfoji-v20260309-v1

# 安装Tailwind CSS
npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms @tailwindcss/container-queries

# 创建目录
mkdir -p public/fonts public/assets/audio public/assets/images src

# 下载字体（使用之前的脚本）
bash scripts/offline-migration.sh
```

### 步骤2: 生成配置

```bash
node scripts/generate-configs.js
```

### 步骤3: 安装依赖并构建

```bash
npm install
npm run build
```

### 步骤4: 初始化Capacitor

```bash
# 安装Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 创建配置文件
cat > capacitor.config.json << 'EOF'
{
  "appId": "com.shouyueliang.nianfoji",
  "appName": "守月亮念佛机",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  }
}
EOF

# 初始化Android平台
npx cap add android
```

### 步骤5: 生成应用图标

```bash
# 创建图标生成脚本
cat > generate_icons.sh << 'EOF'
#!/bin/bash

LOGO="/Users/litao.2025/Downloads/nianfoji-v6/nianfoji-logo-v6.png"

# 创建临时目录
mkdir -p temp_icons

# 添加25%内边距
convert "$LOGO" -gravity center -background transparent -extent 133.33%x133.33% temp_icons/logo_padded.png

# 生成各种尺寸
mkdir -p android/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}

convert temp_icons/logo_padded.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
convert temp_icons/logo_padded.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
convert temp_icons/logo_padded.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
convert temp_icons/logo_padded.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
convert temp_icons/logo_padded.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# 圆形图标
convert temp_icons/logo_padded.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
convert temp_icons/logo_padded.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
convert temp_icons/logo_padded.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
convert temp_icons/logo_padded.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
convert temp_icons/logo_padded.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png

rm -rf temp_icons
echo "图标生成完成！"
EOF

chmod +x generate_icons.sh
bash generate_icons.sh
```

### 步骤6: 同步并构建APK

```bash
# 同步资源
npx cap sync android
npx cap copy android

# 构建APK
cd android
./gradlew assembleRelease

# 查看APK位置
ls -lh app/build/outputs/apk/release/
```

## 📦 构建产物位置

```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

## 🔐 签名APK（可选）

### 使用之前的签名密钥

如果之前已经生成过签名密钥：

```bash
# 复制签名密钥
cp /Users/litao.2025/Downloads/app编译/my-release-key.jks android/

# 配置签名（编辑 android/app/build.gradle）
# 添加 signingConfigs 配置

# 重新构建
cd android
./gradlew assembleRelease
```

### 生成新的签名密钥

```bash
keytool -genkey -v -keystore android/my-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-key-alias \
  -dname "CN=守月亮念佛机, OU=Dev, O=ShouYueLiang, L=Beijing, ST=Beijing, C=CN" \
  -storepass nianfoji2026 \
  -keypass nianfoji2026
```

## ✅ 验证构建

### 检查APK

```bash
# 查看APK信息
aapt dump badging android/app/build/outputs/apk/release/app-release-unsigned.apk | grep -E "package|application-label|launchable-activity"

# 查看APK大小
ls -lh android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### 安装测试

```bash
# 通过ADB安装
adb install android/app/build/outputs/apk/release/app-release-unsigned.apk

# 或者
adb install -r android/app/build/outputs/apk/release/app-release-unsigned.apk
```

## 🎯 预期结果

构建成功后，您将获得：

- ✅ APK文件大小：约150-200MB
- ✅ 应用ID：com.shouyueliang.nianfoji
- ✅ 应用名称：守月亮念佛机
- ✅ 图标：带25%内边距的logo
- ✅ 完全离线可用

## 🔧 故障排查

### 问题1: ImageMagick未安装

```bash
# macOS
brew install imagemagick

# 验证
convert --version
```

### 问题2: Gradle构建失败

```bash
cd android
./gradlew clean
./gradlew assembleRelease --stacktrace --info
```

### 问题3: 资源下载失败

```bash
# 重新运行下载脚本
bash scripts/offline-migration.sh
```

### 问题4: Android SDK未配置

```bash
# 设置ANDROID_HOME环境变量
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

## 📊 构建时间线

| 步骤 | 时间 | 累计 |
|------|------|------|
| 资源下载 | 5-10分钟 | 10分钟 |
| 配置生成 | 1分钟 | 11分钟 |
| Web构建 | 2-3分钟 | 14分钟 |
| Capacitor初始化 | 1分钟 | 15分钟 |
| 图标生成 | 1分钟 | 16分钟 |
| APK构建 | 3-5分钟 | 20分钟 |

**总计**: 约20分钟

## 🎉 开始构建

**推荐执行**:

```bash
cd /Users/litao.2025/Downloads/nianfoji-v20260309-v1
bash build-apk.sh
```

构建完成后，APK文件位于：
```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

---

**需要帮助？** 查看 `APK_BUILD_GUIDE.md` 了解详细步骤。
