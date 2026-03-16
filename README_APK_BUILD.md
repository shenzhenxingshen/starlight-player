# 念佛机APK构建 - 完整方案

## 📚 文档导航

本项目包含完整的APK构建方案，包括离线化改造和Android打包。

### 核心文档

1. **BUILD_QUICK_START.md** ⭐ - 快速开始（从这里开始）
2. **APK_BUILD_GUIDE.md** - 详细构建指南
3. **OFFLINE_MIGRATION_REPORT.md** - 离线化技术报告
4. **START_HERE.md** - 离线化入口文档

### 自动化脚本

1. **build-apk.sh** - 一键构建APK（推荐）
2. **scripts/offline-migration.sh** - 离线化资源下载
3. **scripts/generate-configs.js** - 配置文件生成

## 🚀 一键构建

```bash
cd /Users/litao.2025/Downloads/nianfoji-v20260309-v1
bash build-apk.sh
```

**预计时间**: 15-20分钟

## 📋 构建流程

```
离线化资源准备 (5-10分钟)
    ↓
生成配置文件 (1分钟)
    ↓
构建Web应用 (2-3分钟)
    ↓
初始化Capacitor (1分钟)
    ↓
生成应用图标 (1分钟)
    ↓
构建APK (3-5分钟)
    ↓
✅ 完成！
```

## 🎯 构建特性

- ✅ 完全离线可用（无需网络）
- ✅ 所有资源本地化（字体、图标、音频、图片）
- ✅ 带25%内边距的应用图标
- ✅ 原生Android应用体验
- ✅ APK大小约150-200MB

## 📦 构建产物

```
android/app/build/outputs/apk/release/
├── app-release-unsigned.apk  # 未签名APK
└── app-release.apk            # 签名APK（如果配置了签名）
```

## 🔧 环境要求

- Node.js v16+
- npm
- ImageMagick（图标生成）
- Java JDK 17+
- Android SDK
- Gradle

## ✅ 快速检查

```bash
# 检查Node.js
node --version

# 检查npm
npm --version

# 检查ImageMagick
convert --version

# 检查Java
java --version

# 检查Android SDK
echo $ANDROID_HOME
```

## 📱 安装测试

```bash
# 通过ADB安装
adb install android/app/build/outputs/apk/release/app-release-unsigned.apk

# 查看日志
adb logcat | grep -i nianfoji
```

## 🎉 开始构建

打开 **BUILD_QUICK_START.md** 开始您的APK构建之旅！

---

**创建时间**: 2026-03-09  
**版本**: 1.0
