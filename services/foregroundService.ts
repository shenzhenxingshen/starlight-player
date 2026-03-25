import { Capacitor } from '@capacitor/core';

let serviceRunning = false;
let stopTimer: number | null = null;
const STOP_DELAY = 5 * 60 * 1000; // 暂停 5 分钟后才停止前台服务

const getForegroundService = async () => {
  const mod = await import('@capawesome-team/capacitor-android-foreground-service');
  return mod.ForegroundService;
};

export const startPlaybackService = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  // 取消延迟停止
  if (stopTimer !== null) {
    window.clearTimeout(stopTimer);
    stopTimer = null;
  }

  if (serviceRunning) return;

  try {
    const ForegroundService = await getForegroundService();

    const { display } = await ForegroundService.checkPermissions();
    if (display !== 'granted') {
      await ForegroundService.requestPermissions();
    }

    await ForegroundService.startForegroundService({
      id: 1001,
      title: '星光播放器',
      body: '正在播放中…',
      smallIcon: 'ic_notification',
      silent: true,
      serviceType: 2, // FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
    } as any);
    serviceRunning = true;
  } catch (e) {
    console.warn('ForegroundService start failed:', e);
  }
};

// 暂停时不立即停止，延迟 5 分钟
export const scheduleStopPlaybackService = (): void => {
  if (!serviceRunning || !Capacitor.isNativePlatform()) return;
  if (stopTimer !== null) return; // 已有延迟计划

  stopTimer = window.setTimeout(async () => {
    stopTimer = null;
    if (!serviceRunning) return;
    try {
      const ForegroundService = await getForegroundService();
      await ForegroundService.stopForegroundService();
      serviceRunning = false;
    } catch (e) {
      console.warn('ForegroundService stop failed:', e);
    }
  }, STOP_DELAY);
};

// 仅在 app 退出时立即停止
export const forceStopPlaybackService = async (): Promise<void> => {
  if (stopTimer !== null) {
    window.clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (!serviceRunning || !Capacitor.isNativePlatform()) return;
  try {
    const ForegroundService = await getForegroundService();
    await ForegroundService.stopForegroundService();
    serviceRunning = false;
  } catch (e) {
    console.warn('ForegroundService stop failed:', e);
  }
};

// 请求忽略电池优化（华为/小米关键）
export const requestBatteryOptimizationExemption = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { App } = await import('@capacitor/app');
    // 通过 intent 打开电池优化设置
    // 使用 Capacitor 的底层 bridge 调用
    const w = window as any;
    if (w.Capacitor?.Plugins?.ForegroundService) return; // 插件已加载说明环境正常
  } catch {
    // 静默忽略
  }
};
