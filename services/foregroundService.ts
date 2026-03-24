import { Capacitor } from '@capacitor/core';

let serviceRunning = false;

export const startPlaybackService = async (): Promise<void> => {
  if (serviceRunning || !Capacitor.isNativePlatform()) return;
  try {
    const { ForegroundService } = await import(
      '@capawesome-team/capacitor-android-foreground-service'
    );

    // Android 13+ 需要通知权限
    const { display } = await ForegroundService.checkPermissions();
    if (display !== 'granted') {
      await ForegroundService.requestPermissions();
    }

    await ForegroundService.startForegroundService({
      id: 1001,
      title: '星光播放器',
      body: '正在播放中…',
      smallIcon: 'ic_launcher',
      silent: true,
      serviceType: 2, // FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
    } as any);
    serviceRunning = true;
  } catch (e) {
    console.warn('ForegroundService start failed:', e);
  }
};

export const stopPlaybackService = async (): Promise<void> => {
  if (!serviceRunning || !Capacitor.isNativePlatform()) return;
  try {
    const { ForegroundService } = await import(
      '@capawesome-team/capacitor-android-foreground-service'
    );
    await ForegroundService.stopForegroundService();
    serviceRunning = false;
  } catch (e) {
    console.warn('ForegroundService stop failed:', e);
  }
};
