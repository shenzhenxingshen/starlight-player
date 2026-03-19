# 星光播放器（Starlight Player）

一款面向佛号、咒语与经典歌曲练习的离线播放器，支持共修同步、任务遍数与个人统计。

当前稳定基线：`v0.1.0`

---

## 功能概览

- 官方曲目播放（A/B/C/D 系列）
- 播放器控制：播放/暂停、上一曲/下一曲、进度、音量
- 歌词同步高亮与自动滚动
- 任务模式：按目标遍数修学（如 7 / 21 / 49 / 108）
- 共修/同步模式：根据当天时间轴计算起播进度，并自动纠偏
- 自定义曲目：支持本地文件或网络链接
- 统计功能：今日记录、累计完成次数
- Android 打包支持（Capacitor）

---

## 技术栈

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Capacitor（Android）
- IndexedDB（自定义本地音频）
- localStorage（配置与统计）

---

## 目录结构（核心）

- `App.tsx`：应用主流程、播放与共修逻辑、统计
- `components/`：页面组件（播放器、曲库、定时、个人中心）
- `hooks/`：音频播放与任务逻辑
- `constants.tsx`：官方曲目定义
- `lyricsData.ts`：歌词时间轴
- `services/dbService.ts`：IndexedDB 音频存取
- `android/`：Android 工程
- `public/`：静态资源、PWA manifest

---

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
npm run dev
```

### 3. 类型检查

```bash
npm run lint
```

### 4. 构建 Web 版本

```bash
npm run build
```

---

## Android 构建（常用）

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

APK 产物默认路径：

`android/app/build/outputs/apk/release/`

---

## 共修模式说明（v0.1.0）

- 共修模式下用户速率锁定为 `1.0x`
- 点击播放会按时间轴自动计算当前应在的进度
- 播放过程中会进行自动纠偏
- 若切换到无时长信息的自定义曲目，会自动降级为自习模式并提示

---

## 推荐分支策略（协作开发）

- `main`：稳定主线
- `release-v0.1.0`：v0.1.0 发布分支
- `develop-v0.2.0`：v0.2.0 开发分支
- `feature/*`：功能开发分支

建议每次合并前执行：

```bash
npm run lint
npm run build
```

---

## 提交与安全注意事项

请勿提交以下文件到远程仓库：

- `*.jks` / `*.keystore`（签名密钥）
- `*.apk` / `*.aab` / `*.idsig`（构建产物）
- `node_modules/`、`dist/`、日志文件
- 本地环境与临时文件（如 `.env*`、`*.bak`、`*.backup`）

---

## 版本信息

- 名称：星光播放器
- 当前版本：0.1.0
- 后续规划：v0.2.0 功能迭代开发