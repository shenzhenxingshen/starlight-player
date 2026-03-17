# 星光播放器 - 构建指令文档

## 标准构建指令

### 方式一：使用构建脚本（推荐）
```bash
cd /Users/litao.2025/Downloads/nianfoji-v20260309-v1
./build-release.sh
```

### 方式二：AI 助手指令
直接对 AI 说：
```
编译构建星光播放器 app，完整流程包括：
1. Web 构建
2. 同步到 Android
3. 清理并构建 APK
4. 签名 APK
5. 上传到服务器 http://116.196.86.84/test/
```

或者简化版：
```
执行完整的 app 构建流程并部署
```

## 构建流程说明

### 1. Web 构建
```bash
npm run build
```
- 输出目录: `dist/`
- 构建时间: ~1秒

### 2. 同步到 Android
```bash
npx cap sync android
```
- 将 Web 资源同步到 Android 工程
- 同步插件配置

### 3. 构建 APK
```bash
cd android
./gradlew clean assembleRelease
cd ..
```
- 清理旧构建产物
- 生成 release APK
- 构建时间: ~15-25秒

### 4. 签名 APK
```bash
~/Library/Android/sdk/build-tools/35.0.0/apksigner sign \
  --ks my-release-key.jks \
  --ks-key-alias my-key-alias \
  --ks-pass pass:shouyueliang2026 \
  --out xingguang-v0.1.0.apk \
  android/app/build/outputs/apk/release/app-release-unsigned.apk
```
- 使用 v2 + v3 签名
- 输出: `xingguang-v0.1.0.apk`

### 5. 上传到服务器
```bash
scp xingguang-v0.1.0.apk root@116.196.86.84:/var/www/app-download/test/
```
- 服务器: 116.196.86.84
- 路径: /var/www/app-download/test/
- 下载地址: http://116.196.86.84/test/

## 重要配置

### 图标配置
- **图标源**: `public/assets/images/星光播放器logo.png` (1365×1365, 扩展25%)
- **不使用**: adaptive icon (已删除 mipmap-anydpi-v26/)
- **手动生成**: 所有密度的 ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png

### 启动图配置
- **启动图源**: `resources/splash.png` (来自 splash-slogan-2732.png)
- **背景色**: #0a0705
- **生成命令**: `npx @capacitor/assets generate --android`

### 版本信息
- **应用名**: 星光播放器
- **包名**: com.shouyueliang.nianfoji
- **版本**: v0.1.0 (versionCode 2)

## 常见问题

### Q: 图标显示不完整怎么办？
A: 确保删除了 `android/app/src/main/res/mipmap-anydpi-v26/` 目录，使用手动生成的图标。

### Q: 启动图不显示怎么办？
A: 检查 `resources/splash.png` 是否是正确的启动图，然后重新运行 `npx @capacitor/assets generate --android`。

### Q: 如何更新启动图？
A: 
1. 更新 `resources/splash.png`
2. 运行 `npx @capacitor/assets generate --android`
3. 删除 `android/app/src/main/res/mipmap-anydpi-v26/` (如果生成了)
4. 恢复手动生成的图标
5. 重新构建

## 快速命令参考

```bash
# 完整构建流程
./build-release.sh

# 仅构建不上传
npm run build && npx cap sync android && cd android && ./gradlew clean assembleRelease && cd ..

# 仅签名
~/Library/Android/sdk/build-tools/35.0.0/apksigner sign --ks my-release-key.jks --ks-key-alias my-key-alias --ks-pass pass:shouyueliang2026 --out xingguang-v0.1.0.apk android/app/build/outputs/apk/release/app-release-unsigned.apk

# 仅上传
scp xingguang-v0.1.0.apk root@116.196.86.84:/var/www/app-download/test/
```

## 输出文件

- **APK**: `xingguang-v0.1.0.apk` (约 129 MB)
- **下载地址**: http://116.196.86.84/test/
