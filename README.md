# 星光播放器（Starlight Player）

一款面向念诵练习与循环播放场景的离线播放器，支持共修同步、任务遍数和本地统计。

当前开发基线：`v0.2.0`（Feature Flag 条件渲染方案）

---

## 功能概览（v0.2 默认体验）

- 官方曲目播放（A/B/C/D 系列）
- 播放主路径：播放/暂停、上一曲/下一曲、进度显示
- 共修模式：按当天时间轴对齐并纠偏
- 中断恢复：来电/系统中断后自动续播兜底与进度校对
- 统计功能：今日记录、累计完成次数（本地日期口径）
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

- `App.tsx`：应用主流程、同步逻辑、统计逻辑
- `components/`：页面组件（播放器、曲库、个人中心等）
- `constants.tsx`：官方曲目定义
- `constants/featureFlags.ts`：v0.2 Feature Flag 配置中心
- `hooks/`：音频播放与任务逻辑
- `services/dbService.ts`：IndexedDB 音频存取
- `android/`：Android 工程

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

APK 产物默认路径：`android/app/build/outputs/apk/release/`

---

## v0.2 Feature Flag 策略

默认配置文件：`constants/featureFlags.ts`

| Flag | 默认值 | 影响页面 | 作用 |
|---|---:|---|---|
| FORCE_SYNC_MODE | true | App | 强制共修模式 |
| LOCK_TIMELINE | true | App/Player | 锁定时间轴拖动 |
| HIDE_SYNC_LOCK_TIP | true | Player | 隐藏“锁定时间轴”提示 |
| HIDE_LYRICS | true | Player | 隐藏歌词区 |
| HIDE_COVER_TOGGLE | true | Player | 隐藏封面切换 |
| HIDE_MODE_SWITCH | true | Player | 隐藏自习/共修切换 |
| HIDE_PLAYBACK_RATE | true | Player | 隐藏倍速区 |
| HIDE_VOLUME_CONTROL | true | Player | 隐藏音量区 |
| HIDE_CUSTOM_TRACKS | true | Playlist | 隐藏自定义曲目入口与面板 |
| HIDE_PLAYLIST_TOP_HEADER | true | Playlist | 隐藏“官方曲目/自定义”顶部区域 |
| HIDE_TIMER_NAV | true | BottomNav | 隐藏定时入口 |
| HIDE_PROFILE_HEADER | true | Profile | 隐藏“用户头部”区 |
| HIDE_PROFILE_QUOTE | true | Profile | 隐藏语录区 |
| PLAYER_MAIN_BUTTON_SCALE | 1.5 | Player | 播放主按钮缩放 |

---

## 本地灰度测试（开关覆盖）

在浏览器控制台执行：

```js
localStorage.setItem(
  'starlight_feature_flags_override',
  JSON.stringify({
    HIDE_LYRICS: false,
    HIDE_VOLUME_CONTROL: false,
    HIDE_TIMER_NAV: false
  })
);
location.reload();
```

清理覆盖：

```js
localStorage.removeItem('starlight_feature_flags_override');
location.reload();
```

---

## 回归检查清单（发布前）

1. 播放/暂停/切歌主路径正常
2. 来电或系统中断后可自动续播，并在恢复后完成进度校对
3. 前后台切换后状态一致（无假播放/假暂停）
4. 今日遍数统计按本地日期正确累计
5. 默认 Flag 体验与 v0.2 目标一致
6. 打开单个 Flag 后可恢复对应功能区块

---

## 推荐分支策略（协作开发）

- `main`：稳定主线
- `develop`：日常集成分支
- `feature/*`：功能开发分支
- `release/vX.Y.Z`：发布分支
- `hotfix/*`：线上紧急修复分支

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
- 当前版本：0.2.0（开发中）
- 当前方向：Feature Flag 条件渲染 + 稳定性优先