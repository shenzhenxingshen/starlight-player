// 前台服务已由 @capgo/native-audio 的 backgroundPlayback + showNotification 替代
// 保留空导出以兼容 App.tsx 中的 import

export const startPlaybackService = async (): Promise<void> => {};
export const scheduleStopPlaybackService = (): void => {};
export const forceStopPlaybackService = async (): Promise<void> => {};
