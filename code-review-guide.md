# 星光播放器 — Code Review 指引

## 项目概述

佛教念佛/持咒播放器 Android App，支持循环播放、任务计次、多人共修同步。

技术栈：React 19 + TypeScript + Vite + Tailwind CSS + Capacitor 8（打包为 Android WebView App）。

没有后端，纯离线单机应用。音频文件打包在 APK 内（`public/assets/audio/`，21 首，共 ~120MB）。

## 目录结构

```
├── index.tsx              # React 入口，挂载 <App />
├── App.tsx                # ★ 核心文件（1003行），全部业务逻辑集中在此
├── types.ts               # 类型定义：View、PlaybackMode、Track、AppState
├── constants.tsx           # 21 首曲目定义（含 durationMs）、分区定义
├── constants/featureFlags.ts  # 功能开关（当前大部分 UI 被隐藏）
├── lyricsData.ts           # 歌词时间轴数据（694行）
│
├── hooks/
│   ├── useAudioPlayer.ts   # 底层音频控制：play/pause/seek/volume/playbackRate
│   └── useTaskPlayer.ts    # 任务模式状态：目标遍数、进度、完成判定
│
├── components/
│   ├── Player.tsx          # 播放器主界面：封面、进度条、倍速、音量
│   ├── Playlist.tsx        # 曲目列表（支持本地上传，IndexedDB 存储）
│   ├── Settings.tsx        # 计次界面：圆环进度、7/21/49/108 遍预设
│   ├── Profile.tsx         # 个人统计：累计遍数、每日记录、禅语
│   ├── BottomNav.tsx       # 底部导航栏（4 个 tab）
│   ├── SplashScreen.tsx    # React 层启动屏（900ms 兜底）
│   ├── VinylRecord.tsx     # 唱片旋转动画
│   ├── MeritAnimation.tsx  # 任务完成时的功德动画
│   ├── ShareCard.tsx       # 分享卡片
│   └── LogoDesign.tsx      # Logo SVG 组件
│
├── services/
│   ├── dbService.ts        # IndexedDB 封装（存储用户上传的音频）
│   ├── zenQuoteService.ts  # 本地禅语随机选取（24 条印光大师语录）
│   └── geminiService.ts    # Gemini API 调用（当前未使用，被 zenQuoteService 替代）
│
├── vite.config.ts          # Vite 构建配置
├── tailwind.config.js      # Tailwind 主题（金色系自定义色板）
├── capacitor.config.json   # Capacitor 配置（https scheme，SplashScreen 手动隐藏）
├── android/                # Capacitor 生成的 Android 工程
└── build-and-deploy.sh     # 一键构建+签名+上传脚本
```

## 核心架构

### 数据流

```
App.tsx（状态中心）
  ├── useAudioPlayer hook → 管理 <audio> 元素
  │     └── audioRef, isPlaying, currentTime, duration, volume, playbackRate
  ├── useTaskPlayer hook → 管理任务模式
  │     └── playbackMode, taskTarget, taskProgress, isTaskActive
  ├── 状态持久化 → 全部用 localStorage（无数据库）
  └── 渲染 → Player / Playlist / Settings / Profile（通过 view 状态切换）
```

### 三种播放模式（PlaybackMode 枚举）

| 模式 | 说明 | audio.loop |
|------|------|-----------|
| `SINGLE_LOOP` | 单曲循环，每次回绕记一遍 | `true` |
| `TASK` | 任务模式，播放 N 遍后停止 | `true` |
| `SEQUENTIAL` | 顺序播放，播完切下一首 | `false` |

### 计次机制（回绕检测）

不依赖 `onEnded` 事件（因为 `loop=true` 时不触发），而是在 `onTimeUpdate` 中检测时间回绕：

```
如果 上一帧 currentTime > 总时长 × 0.7
且 当前帧 currentTime < 总时长 × 0.3
且 不在手动 seek 窗口内（1.5秒）
→ 判定为完成一遍
```

位置：`App.tsx` → `handleTaskTimeUpdate()`

### 共修同步模式

核心思路：所有用户基于当天 0 点的时间戳，对音频时长取模，算出"现在应该播到第几秒"，从而实现无服务器的多端同步。

```typescript
getSyncStartSec(): 
  elapsedMs = Date.now() - 今天0点
  offsetMs = elapsedMs % durationMs
  return offsetMs / 1000
```

包含漂移校正（`runSyncDriftCorrection`）：小偏差（≤300ms）用播放速率微调，大偏差直接跳转。

### 功能开关（Feature Flags）

`constants/featureFlags.ts` 中 `DEFAULT_FEATURE_FLAGS` 当前配置：

- `FORCE_SYNC_MODE: true` — 强制共修模式
- `LOCK_TIMELINE: true` — 禁止拖动进度条
- 大部分 UI 隐藏：歌词、封面切换、倍速、音量、模式切换等

用户可通过 localStorage 写入 `starlight_feature_flags_override` JSON 来覆盖。

## 重点 Review 区域

### 1. App.tsx 过于庞大（1003 行）

所有业务逻辑集中在一个文件：播放控制、同步校正、任务管理、统计记录、中断恢复、切曲逻辑。大量 `useRef` + `useEffect`（约 20 个 ref，15+ 个 effect）。

建议关注：
- 各 effect 之间的依赖关系和执行顺序
- ref 和 state 的一致性（`isPlayingRef` vs `isPlaying`）
- 定时器清理是否完整（`clearScheduledSyncTimers` 等）

### 2. 后台播放中断恢复

App.tsx 中有多层恢复机制：

| 机制 | 触发条件 | 位置 |
|------|---------|------|
| `keepalive` 定时器 | 每 5 秒检测 audio.paused | `useEffect([isPlaying])` |
| `visibilitychange` | 页面重新可见 | `tryResumeAfterInterrupt` |
| Capacitor `appStateChange` | App 回到前台 | `CapacitorApp.addListener` |
| `onPause` 事件 | audio 被系统暂停 | `triggerPlaybackRecovery` |
| `onWaiting/onStalled/onSuspend` | 网络/缓冲问题 | `triggerPlaybackRecovery` |

**已知问题**：这些都是 JS 层恢复，当 Android 系统冻结 WebView 进程时全部失效。缺少原生前台服务（`FOREGROUND_SERVICE`）和 `WAKE_LOCK` 权限。`package.json` 已引入 `@capawesome-team/capacitor-android-foreground-service` 但代码中未使用。

### 3. 旧设备兼容性

- `tsconfig.json` target 为 `ES2022`
- `vite.config.ts` 未设置 `build.target`，Vite 默认输出 ES2020+
- 打包后 JS 包含 `??`（nullish coalescing），需要 Chrome 80+
- `minSdkVersion = 24`（Android 7.0），但 Android 7-9 的 WebView 版本低于 Chrome 80
- **已知问题**：Android 9 设备（如荣耀10）JS 解析失败，卡在启动屏

### 4. 状态持久化

全部使用 `localStorage`，key 前缀 `zen_chant_`：

| Key | 内容 |
|-----|------|
| `zen_chant_current_track` | 当前曲目 JSON |
| `zen_chant_volume` | 音量 |
| `zen_chant_playback_rate` | 播放倍速 |
| `zen_chant_playback_mode` | 播放模式 |
| `zen_chant_task_target` | 任务目标遍数 |
| `zen_chant_task_progress` | 任务当前进度 |
| `zen_chant_user_stats` | 累计统计（含每日分曲目记录） |
| `zen_chant_sync_mode` | 共修模式开关 |
| `zen_chant_show_vinyl` | 唱片/封面切换 |
| `zen_chant_config` | 大字模式等配置 |
| `zen_chant_last_recovery_reason` | 最近一次恢复原因（调试用） |
| `starlight_feature_flags_override` | 功能开关覆盖 |

注意：`taskProgress` 持久化到 localStorage，App 被杀后重新打开会恢复上次进度，但音频位置不会恢复（从头开始），可能导致计次不准。

### 5. 未使用的代码

- `geminiService.ts` — 引入了 `@google/genai`，但实际用的是 `zenQuoteService.ts`（本地数据）
- `sw.js` — Service Worker 文件存在但未注册
- `AppState` 接口（`types.ts`）— 定义了但未使用
- `dbService.ts` — IndexedDB 封装，被 Playlist 的自定义曲目上传功能使用，但该功能被 `HIDE_CUSTOM_TRACKS: true` 隐藏

### 6. Android 工程

- `MainActivity.java` 只有一行：`extends BridgeActivity`，无自定义逻辑
- `AndroidManifest.xml` 只声明了 `INTERNET` 权限
- `targetSdkVersion = 36`，`compileSdkVersion = 36`
- 签名密钥 `my-release-key.jks` 在项目根目录（应移出版本控制）

## 构建 & 运行

```bash
# 开发
npm install
npm run dev          # http://localhost:3000

# 构建 APK
./build-and-deploy.sh 0.2.0
# 或手动：
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
# 签名：~/Library/Android/sdk/build-tools/35.0.0/apksigner sign ...
```

## 代码风格说明

- 无 ESLint/Prettier 配置，无代码格式化规则
- 无单元测试
- 组件内大量内联 Tailwind 类名（部分超过 200 字符）
- 中文注释和中文 UI 文案混在代码中
- 部分 `.backup` 文件和多个历史 APK 文件在项目根目录
