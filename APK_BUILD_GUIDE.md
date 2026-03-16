# 念佛机APK构建完整指南

## 📋 构建方案

基于之前的经验和当前项目结构，我们将：
1. ✅ 在当前目录执行离线化改造
2. ✅ 使用Capacitor构建Android APK
3. ✅ 使用带25%内边距的logo

## 🚀 一键构建（推荐）

```bash
cd /Users/litao.2025/Downloads/nianfoji-v20260309-v1
bash build-apk.sh
```

**预计时间**: 15-20分钟（取决于网速）

## 📝 详细步骤

### 阶段1: 离线化资源准备（5-10分钟）

下载所有必需资源：
- 6个字体文件（约2MB）
- 1个封面图片（约500KB）
- 21个MP3音频文件（约150MB）

### 阶段2: 生成配置文件（1分钟）

自动生成：
- `tailwind.config.js`
- `src/index.css`
- 修改`constants.tsx`
- 修改`index.html`

### 阶段3: 构建Web应用（2-3分钟）

```bash
npm install
npm run build
```

产物位于 `dist/` 目录

### 阶段4: 初始化Capacitor（1分钟）

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "守月亮念佛机" "com.shouyueliang.nianfoji" --web-dir=dist
npx cap add android
```

### 阶段5: 生成应用图标（1分钟）

使用ImageMagick生成带25%内边距的图标：

```bash
# 添加内边距
convert logo.png -gravity center -background transparent -extent 133.33%x133.33% logo_padded.png

# 生成各种尺寸
convert logo_padded.png -resize 48x48 mipmap-mdpi/ic_launcher.png
convert logo_padded.png -resize 72x72 mipmap-hdpi/ic_launcher.png
convert logo_padded.png -resize 96x96 mipmap-xhdpi/ic_launcher.png
convert logo_padded.png -resize 144x144 mipmap-xxhdpi/ic_launcher.png
convert logo_padded.png -resize 192x192 mipmap-xxxhdpi/ic_launcher.png
```

### 阶段6: 构建APK（3-5分钟）

```bash
npx cap sync android
npx cap copy android
cd android
./gradlew assembleRelease
```

## 📦 构建产物

### 未签名APK
```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### 签名APK（如果配置了签名）
```
android/app/build/outputs/apk/release/app-release.apk
```

## 🔐 APK签名（可选）

### 生成签名密钥

```bash
keytool -genkey -v -keystore my-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-key-alias
```

### 配置签名

编辑 `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('my-release-key.jks')
            storePassword 'your-password'
            keyAlias 'my-key-alias'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

### 构建签名APK

```bash
cd android
./gradlew assembleRelease
```

## 📱 安装测试

### 通过ADB安装

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### 通过文件传输

1. 将APK文件传输到手机
2. 在手机上打开文件管理器
3. 点击APK文件安装

## ✅ 验证清单

### 构建前检查

- [ ] Node.js已安装（v16+）
- [ ] npm已安装
- [ ] ImageMagick已安装（用于图标生成）
- [ ] Java JDK已安装（Android构建需要）
- [ ] Android SDK已安装
- [ ] 网络连接稳定（下载资源）
- [ ] 磁盘空间充足（至少500MB）

### 构建后检查

- [ ] dist目录已生成
- [ ] android目录已生成
- [ ] 应用图标已生成（各种尺寸）
- [ ] APK文件已生成
- [ ] APK大小合理（约150-200MB）

### 安装后测试

- [ ] 应用图标显示正常（有内边距）
- [ ] 应用可以正常启动
- [ ] 页面样式正常显示
- [ ] 字体正确加载
- [ ] 图标正常显示
- [ ] 音频可以正常播放
- [ ] 歌词同步显示正常
- [ ] 断网后仍可正常使用

## 🔧 常见问题

### Q1: ImageMagick未安装

**解决方案**:
```bash
# macOS
brew install imagemagick

# 或手动生成图标
# 使用在线工具或Photoshop添加内边距
```

### Q2: Gradle构建失败

**解决方案**:
```bash
cd android
./gradlew clean
./gradlew assembleRelease --stacktrace
```

### Q3: APK无法安装

**原因**: 未签名或签名不匹配

**解决方案**:
- 使用debug版本: `./gradlew assembleDebug`
- 或配置正确的签名

### Q4: 应用闪退

**原因**: 资源未正确打包

**解决方案**:
```bash
npx cap sync android
npx cap copy android
cd android
./gradlew clean assembleRelease
```

### Q5: 音频无法播放

**原因**: 文件路径错误或权限问题

**解决方案**:
- 检查 `constants.tsx` 中的路径
- 确认音频文件在 `public/assets/audio/`
- 检查Android权限配置

## 📊 构建时间估算

| 阶段 | 时间 | 说明 |
|------|------|------|
| 资源下载 | 5-10分钟 | 取决于网速 |
| 配置生成 | 1分钟 | 自动化 |
| Web构建 | 2-3分钟 | npm build |
| Capacitor初始化 | 1分钟 | 首次较慢 |
| 图标生成 | 1分钟 | ImageMagick |
| APK构建 | 3-5分钟 | Gradle |
| **总计** | **15-20分钟** | |

## 🎯 优化建议

### 减小APK体积

1. **音频压缩**
```bash
# 降低比特率到128kbps
for file in public/assets/audio/*.mp3; do
  ffmpeg -i "$file" -b:a 128k "${file%.mp3}_compressed.mp3"
done
```

2. **图片优化**
```bash
# 转换为WebP
ffmpeg -i cover.gif cover.webp
```

3. **启用ProGuard**
在 `android/app/build.gradle` 中:
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### 提升性能

1. **启用R8优化**（默认已启用）
2. **使用App Bundle**
```bash
./gradlew bundleRelease
```

3. **分包（Split APKs）**
```gradle
android {
    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a'
        }
    }
}
```

## 📱 发布到应用商店

### Google Play Store

1. 创建开发者账号
2. 创建应用
3. 上传APK或AAB
4. 填写应用信息
5. 提交审核

### 其他应用商店

- 华为应用市场
- 小米应用商店
- OPPO软件商店
- vivo应用商店
- 应用宝（腾讯）

## 🎉 完成！

构建完成后，您将获得一个完全离线可用的Android APK，包含：

✅ 所有资源本地化（字体、图标、音频、图片）  
✅ 无需网络连接即可使用  
✅ 带25%内边距的应用图标  
✅ 原生应用体验  

---

**需要帮助？** 查看 `OFFLINE_MIGRATION_REPORT.md` 了解离线化技术细节。
