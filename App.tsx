
import React, { useState, useEffect, useRef } from 'react';
import { View, Track, PlaybackMode } from './types';
import { TRACKS } from './constants';
import BottomNav from './components/BottomNav';
import Player from './components/Player';
import Playlist from './components/Playlist';
import Settings from './components/Settings';
import Profile from './components/Profile';
import MeritAnimation from './components/MeritAnimation';
import ShareCard from './components/ShareCard';
import { getZenQuote, ZenQuote } from './services/zenQuoteService';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTaskPlayer } from './hooks/useTaskPlayer';
import { FEATURE_FLAGS } from './constants/featureFlags';

const STATS_KEY = 'zen_chant_user_stats';
const CONFIG_KEY = 'zen_chant_config';
const SYNC_MODE_KEY = 'zen_chant_sync_mode';


const getLocalDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.PLAYER);
  const [currentTrack, setCurrentTrack] = useState<Track>(() => {
    try {
      const saved = localStorage.getItem('zen_chant_current_track');
      return saved ? JSON.parse(saved) : TRACKS[0];
    } catch {
      return TRACKS[0];
    }
  });

  useEffect(() => {
    localStorage.setItem('zen_chant_current_track', JSON.stringify(currentTrack));
  }, [currentTrack]);
  const [zenQuote, setZenQuote] = useState<ZenQuote>(getZenQuote());
  const [showMerit, setShowMerit] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const [isLargeText, setIsLargeText] = useState(() => {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      return saved ? JSON.parse(saved).isLargeText : false;
    } catch {
      return false;
    }
  });
  const [syncMode, setSyncMode] = useState(() => {
    if (FEATURE_FLAGS.FORCE_SYNC_MODE) {
      return true;
    }
    try {
      const saved = localStorage.getItem(SYNC_MODE_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const syncModeRef = useRef(syncMode);

  const {
    audioRef,
    isPlaying,
    setIsPlaying,
    currentTime,
    duration,
    volume,
    setVolume,
    playbackRate,
    setPlaybackRate,
    seek,
    handleTimeUpdate
  } = useAudioPlayer(currentTrack);

  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem(STATS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      installDate: new Date().toISOString(),
      totalCompletions: 0,
      dailyLogs: {}
    };
  });

  useEffect(() => {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem(SYNC_MODE_KEY, JSON.stringify(syncMode));
  }, [syncMode]);

  useEffect(() => {
    syncModeRef.current = syncMode;
  }, [syncMode]);

  useEffect(() => {
    if (FEATURE_FLAGS.FORCE_SYNC_MODE && !syncModeRef.current) {
      setSyncMode(true);
    }
  }, []);

  useEffect(() => {
    if (syncMode && playbackRate !== 1.0) {
      setPlaybackRate(1.0);
    }
  }, [syncMode, playbackRate, setPlaybackRate]);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  // 原生启动图：当应用就绪后隐藏 Splash（Capacitor 插件）
  useEffect(() => {
    const hideSplash = async () => {
      try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide({ fadeOutDuration: 200 });
      } catch (e) {
        // 开发环境或未安装插件时静默忽略
      }
    };
    hideSplash();
  }, []);

  // Media Session API Integration
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: '星光播放器',
        artwork: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play', () => {
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        handlePrev();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        handleNext();
      });
    }
  }, [currentTrack, isPlaying]);

  const handleTrackSelect = (track: Track) => {
    beginTrackSwitchGuard();
    clearScheduledSyncTimers();

    const taskTargetSnapshot = isTaskActive ? taskTarget : 0;
    const syncSupported = Boolean(track.durationMs && track.durationMs > 0);
    const effectiveSyncMode = syncMode && syncSupported;

    if (syncMode && !syncSupported) {
      setSyncMode(false);
      showSyncFallbackNotice('该曲目暂不支持共修同步，已切换为自习模式');
    }

    if (taskTargetSnapshot > 0) {
      pendingTaskCarryRef.current = { target: taskTargetSnapshot, sync: effectiveSyncMode };
    } else if (effectiveSyncMode && isPlaying) {
      pendingSyncDurationMsRef.current = track.durationMs ?? null;
      pendingSyncAutoplayRef.current = true;
    }

    if (isTaskActive) {
      stopTask();
    }

    setCurrentTrack(track);
    setView(View.PLAYER);

    if (taskTargetSnapshot > 0) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    beginTrackSwitchGuard();
    clearScheduledSyncTimers();

    const idx = TRACKS.findIndex(t => t.id === currentTrack.id);
    if (idx !== -1) {
      const nextTrack = TRACKS[(idx - 1 + TRACKS.length) % TRACKS.length];
      const taskTargetSnapshot = isTaskActive ? taskTarget : 0;

      if (taskTargetSnapshot > 0) {
        pendingTaskCarryRef.current = { target: taskTargetSnapshot, sync: syncMode };
      } else if (syncMode && isPlaying) {
        pendingSyncDurationMsRef.current = nextTrack.durationMs ?? null;
        pendingSyncAutoplayRef.current = true;
      }

      if (isTaskActive) {
        stopTask();
      }

      setCurrentTrack(nextTrack);

      if (taskTargetSnapshot > 0) {
        setIsPlaying(false);
      } else if (isPlaying) {
        setIsPlaying(true);
      }
    }
  };

  const handleRefreshQuote = () => {
    setZenQuote(getZenQuote());
  };

  const recordCompletion = (track: Track) => {
    setStats(prev => {
      const today = getLocalDateKey();
      // 兼容旧数据格式：如果以前存的是数字，重置为对象
      const currentDayLog = (typeof prev.dailyLogs[today] === 'object' && prev.dailyLogs[today] !== null)
        ? prev.dailyLogs[today]
        : {};
        
      return {
        ...prev,
        totalCompletions: prev.totalCompletions + 1,
        dailyLogs: {
          ...prev.dailyLogs,
          [today]: {
            ...currentDayLog,
            [track.id]: (currentDayLog[track.id] || 0) + 1
          }
        }
      };
    });
  };

  const handleNext = () => {
    beginTrackSwitchGuard();
    clearScheduledSyncTimers();

    const idx = TRACKS.findIndex(t => t.id === currentTrack.id);
    if (idx !== -1) {
      const nextTrack = TRACKS[(idx + 1) % TRACKS.length];
      const taskTargetSnapshot = isTaskActive ? taskTarget : 0;

      if (taskTargetSnapshot > 0) {
        pendingTaskCarryRef.current = { target: taskTargetSnapshot, sync: syncMode };
      } else if (syncMode && isPlaying) {
        pendingSyncDurationMsRef.current = nextTrack.durationMs ?? null;
        pendingSyncAutoplayRef.current = true;
      }

      if (isTaskActive) {
        stopTask();
      }

      setCurrentTrack(nextTrack);

      if (taskTargetSnapshot > 0) {
        setIsPlaying(false);
      } else if (isPlaying) {
        setIsPlaying(true);
      }
    }
  };

  const {
    playbackMode,
    isTaskActive,
    taskProgress,
    taskTarget,
    setTaskProgress,
    stopTask,
    updateTaskTarget,
    handleEnded
  } = useTaskPlayer(
    currentTrack,
    () => audioRef.current,
    setIsPlaying,
    setShowMerit,
    recordCompletion,
    handleNext
  );

  // 使用 audio.loop + 时间回绕检测计次
  const lastTimeRef = useRef(0);
  const lastManualSeekAtRef = useRef(0);
  const pendingSyncDurationMsRef = useRef<number | null>(null);
  const pendingSyncAutoplayRef = useRef(false);
  const pendingTaskCarryRef = useRef<{ target: number; sync: boolean } | null>(null);
  const scheduledSyncStartTimerRef = useRef<number | null>(null);
  const syncDriftFirstCheckTimerRef = useRef<number | null>(null);
  const syncDriftIntervalRef = useRef<number | null>(null);
  const syncRateResetTimerRef = useRef<number | null>(null);
  const syncNoticeTimerRef = useRef<number | null>(null);
  const switchingTrackGuardTimerRef = useRef<number | null>(null);
  const resumeSyncAlignTimerRef = useRef<number | null>(null);
  const playbackRateRef = useRef(playbackRate);
  const isPendingSyncedStartRef = useRef(false);
  const isSwitchingTrackRef = useRef(false);
  const manualPauseIntentRef = useRef(false);
  const resumeAfterInterruptRef = useRef(false);

  const handleToggleSyncMode = () => {
    if (FEATURE_FLAGS.FORCE_SYNC_MODE) {
      setSyncMode(true);
      return;
    }

    setSyncMode(prev => {
      const next = !prev;
      if (next) {
        if (isTaskActive) {
          stopTask();
        }
        setPlaybackRate(1.0);
      } else {
        clearScheduledSyncTimers();
      }
      return next;
    });
  };

  const clearSyncRateResetTimer = () => {
    if (syncRateResetTimerRef.current !== null) {
      window.clearTimeout(syncRateResetTimerRef.current);
      syncRateResetTimerRef.current = null;
    }
  };

  const clearResumeSyncAlignTimer = () => {
    if (resumeSyncAlignTimerRef.current !== null) {
      window.clearTimeout(resumeSyncAlignTimerRef.current);
      resumeSyncAlignTimerRef.current = null;
    }
  };

  const clearSyncNoticeTimer = () => {
    if (syncNoticeTimerRef.current !== null) {
      window.clearTimeout(syncNoticeTimerRef.current);
      syncNoticeTimerRef.current = null;
    }
  };

  const showSyncFallbackNotice = (message: string) => {
    clearSyncNoticeTimer();
    setSyncNotice(message);
    syncNoticeTimerRef.current = window.setTimeout(() => {
      setSyncNotice(null);
      syncNoticeTimerRef.current = null;
    }, 2200);
  };

  const clearSwitchingTrackGuard = () => {
    if (switchingTrackGuardTimerRef.current !== null) {
      window.clearTimeout(switchingTrackGuardTimerRef.current);
      switchingTrackGuardTimerRef.current = null;
    }
    isSwitchingTrackRef.current = false;
  };

  const beginTrackSwitchGuard = () => {
    isSwitchingTrackRef.current = true;
    if (switchingTrackGuardTimerRef.current !== null) {
      window.clearTimeout(switchingTrackGuardTimerRef.current);
    }
    switchingTrackGuardTimerRef.current = window.setTimeout(() => {
      isSwitchingTrackRef.current = false;
      switchingTrackGuardTimerRef.current = null;
    }, 900);
  };

  const restorePlaybackRateByMode = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = syncModeRef.current ? 1.0 : playbackRateRef.current;
  };

  const clearScheduledSyncTimers = () => {
    if (scheduledSyncStartTimerRef.current !== null) {
      window.clearTimeout(scheduledSyncStartTimerRef.current);
      scheduledSyncStartTimerRef.current = null;
    }
    if (syncDriftFirstCheckTimerRef.current !== null) {
      window.clearTimeout(syncDriftFirstCheckTimerRef.current);
      syncDriftFirstCheckTimerRef.current = null;
    }
    if (syncDriftIntervalRef.current !== null) {
      window.clearInterval(syncDriftIntervalRef.current);
      syncDriftIntervalRef.current = null;
    }
    clearSyncRateResetTimer();
    clearResumeSyncAlignTimer();
    restorePlaybackRateByMode();
    isPendingSyncedStartRef.current = false;
  };

  const getSyncStartSec = (durationMs?: number, epochMs: number = Date.now()): number | null => {
    const resolvedDurationMs = durationMs ?? currentTrack.durationMs;
    if (!resolvedDurationMs || resolvedDurationMs <= 0) return null;

    const todayStart = new Date(epochMs);
    todayStart.setHours(0, 0, 0, 0);
    const elapsedMs = epochMs - todayStart.getTime();
    const rawOffsetMs = ((elapsedMs % resolvedDurationMs) + resolvedDurationMs) % resolvedDurationMs;
    // 减少安全边距，允许更精确的同步
    const safeOffsetMs = Math.min(rawOffsetMs, Math.max(resolvedDurationMs - 60, 0));
    return safeOffsetMs / 1000;
  };

  const alignToSyncTimeline = (durationMs?: number, epochMs: number = Date.now()) => {
    const audio = audioRef.current;
    if (!audio) return;

    const startSec = getSyncStartSec(durationMs, epochMs);
    if (startSec === null) return;

    audio.currentTime = startSec;
    // 避免刚对齐后被回绕检测误判
    lastTimeRef.current = audio.currentTime;
    lastManualSeekAtRef.current = 0;
  };

  const runSyncDriftCorrection = (durationMs?: number) => {
    const audio = audioRef.current;
    if (!audio || audio.paused || !syncModeRef.current) return;
    const expectedSec = getSyncStartSec(durationMs);
    if (expectedSec === null) return;

    const driftMs = (audio.currentTime - expectedSec) * 1000;
    const absDriftMs = Math.abs(driftMs);

    // 使用更严格的阈值：60ms
    if (absDriftMs <= 60) return;

    clearSyncRateResetTimer();

    // 小偏差（≤300ms）使用播放速率平滑校正
    if (absDriftMs <= 300) {
      const correctionDurationMs = Math.min(3000, Math.max(1000, absDriftMs * 8));
      const requiredDelta = absDriftMs / correctionDurationMs;
      const rateDelta = Math.min(0.08, Math.max(0.01, requiredDelta));
      const correctionRate = driftMs > 0 ? 1 - rateDelta : 1 + rateDelta;

      audio.playbackRate = correctionRate;

      // 在1-3秒后恢复标准速率（共修保持1.0，非共修恢复用户速率）
      syncRateResetTimerRef.current = window.setTimeout(() => {
        syncRateResetTimerRef.current = null;
        const currentAudio = audioRef.current;
        if (!currentAudio) return;

        if (syncModeRef.current) {
          currentAudio.playbackRate = 1.0;
        } else {
          currentAudio.playbackRate = playbackRateRef.current;
        }
      }, correctionDurationMs);

      return;
    }

    // 大偏差直接跳转
    alignToSyncTimeline(durationMs);
    // 立即恢复标准速率
    audio.playbackRate = 1.0;
  };

  const scheduleSyncedStart = (durationMs?: number, afterStart?: () => void) => {
    clearScheduledSyncTimers();
    isPendingSyncedStartRef.current = true;
    const audio = audioRef.current;
    if (!audio) {
      isPendingSyncedStartRef.current = false;
      setIsPlaying(true);
      return;
    }

    // 立即对齐并播放，不再等待下一秒边界
    alignToSyncTimeline(durationMs);
    setIsPlaying(true);
    isPendingSyncedStartRef.current = false;
    afterStart?.();

    const correctionIntervals = [220, 1200, 3200];

    const triggerRapidCorrection = (index: number) => {
      if (index >= correctionIntervals.length) return;
      const delay = correctionIntervals[index];

      syncDriftFirstCheckTimerRef.current = window.setTimeout(() => {
        syncDriftFirstCheckTimerRef.current = null;
        runSyncDriftCorrection(durationMs);
        triggerRapidCorrection(index + 1);
      }, delay);
    };

    triggerRapidCorrection(0);
  };

  useEffect(() => {
    if (!syncMode) {
      clearScheduledSyncTimers();
    }
  }, [syncMode]);

  useEffect(() => {
    if (!isPlaying && !isPendingSyncedStartRef.current) {
      clearScheduledSyncTimers();
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      clearScheduledSyncTimers();
      clearSyncNoticeTimer();
      clearSwitchingTrackGuard();
    };
  }, []);

  const tryResumeAfterInterrupt = () => {
    if (!resumeAfterInterruptRef.current) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    const audio = audioRef.current;
    if (!audio || !audio.paused) {
      resumeAfterInterruptRef.current = false;
      return;
    }

    setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      manualPauseIntentRef.current = true;
      resumeAfterInterruptRef.current = false;
      setIsPlaying(false);
      clearScheduledSyncTimers();
      return;
    }
    manualPauseIntentRef.current = false;
    if (syncMode) {
      scheduleSyncedStart(currentTrack.durationMs);
      return;
    }
    setIsPlaying(true);
  };

  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      tryResumeAfterInterrupt();
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, []);

  const handleUpdateTarget = (target: number) => {
    if (syncMode) {
      // 策略B：同步任务从0开始，首次完整回绕计为1
      const durationMs = currentTrack.durationMs;
      const startSec = getSyncStartSec(durationMs) ?? 0;
      updateTaskTarget(target, startSec, 0, true);
      scheduleSyncedStart(durationMs);
    } else {
      updateTaskTarget(target, 0, 1);
    }
  };

  const handleManualSeek = (time: number) => {
    if (FEATURE_FLAGS.LOCK_TIMELINE || syncMode) return;
    lastManualSeekAtRef.current = Date.now();
    seek(time);
  };

  const handleTaskTimeUpdate = () => {
    // 原有的时间更新逻辑
    handleTimeUpdate();
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    const d = audio.duration || 0;

    // 使用 loop + 时间回绕检测计次
    // 条件：上一时刻在末段(>70%时长) 且 当前时刻在前段(<30%时长)
    if (d > 0) {
      const prev = lastTimeRef.current;
      const reachedEndSegment = prev > d * 0.7;
      const backToStartSegment = t < d * 0.3;
      const crossed = reachedEndSegment && backToStartSegment;

      const isManualSeekWindow = Date.now() - lastManualSeekAtRef.current < 1500;
      if (crossed && !isManualSeekWindow) {
        if (isTaskActive) {
          if (syncMode) {
            // 策略B：同步任务从0开始，首次完整回绕计为1
            const nextProgress = taskProgress + 1;
            recordCompletion(currentTrack);

            if (nextProgress >= taskTarget) {
              stopTask();
              setIsPlaying(false);
              setShowMerit(true);
            } else {
              setTaskProgress(nextProgress);
            }
          } else {
            // 普通任务：默认从1开始计
            if (taskProgress >= taskTarget) {
              recordCompletion(currentTrack);
              stopTask();
              setIsPlaying(false);
              setShowMerit(true);
            } else {
              setTaskProgress(prevCount => prevCount + 1);
              recordCompletion(currentTrack);
            }
          }
        } else if (playbackMode === PlaybackMode.SINGLE_LOOP && isPlaying) {
          // 普通循环模式：每次回绕计一遍
          recordCompletion(currentTrack);
        }
      }
    }
    lastTimeRef.current = t;
  };

  // 模式切换/切曲/目标变化时重置回绕检测基准，避免读取旧状态
  useEffect(() => {
    lastTimeRef.current = 0;
    lastManualSeekAtRef.current = 0;
  }, [playbackMode, isTaskActive, currentTrack.id, taskTarget]);

  // 任务中切曲：继承目标遍数并按模式重启任务
  useEffect(() => {
    const pending = pendingTaskCarryRef.current;
    if (!pending) return;

    if (pending.sync) {
      const durationMs = currentTrack.durationMs;
      const startSec = getSyncStartSec(durationMs) ?? 0;
      // 策略B：同步任务从0开始，首次完整回绕计为1
      updateTaskTarget(pending.target, startSec, 0, true);
      scheduleSyncedStart(durationMs);
    } else {
      // 普通任务：从1开始
      updateTaskTarget(pending.target, 0, 1, true);
    }

    pendingTaskCarryRef.current = null;
  }, [currentTrack.id]);

  // 同步模式下切曲：在音频切换后立即对齐到同步时间轴
  useEffect(() => {
    if (!pendingSyncAutoplayRef.current) return;
    if (!syncMode) {
      pendingSyncAutoplayRef.current = false;
      pendingSyncDurationMsRef.current = null;
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      pendingSyncAutoplayRef.current = false;
      pendingSyncDurationMsRef.current = null;
      return;
    }

    const durationMs = pendingSyncDurationMsRef.current ?? currentTrack.durationMs;
    if (durationMs && durationMs > 0) {
      alignToSyncTimeline(durationMs);
    }

    pendingSyncAutoplayRef.current = false;
    pendingSyncDurationMsRef.current = null;
  }, [currentTrack.id, syncMode]);

  const renderContent = () => {
    switch (view) {
      case View.PLAYER:
        return (
          <Player
            track={currentTrack}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onNext={handleNext}
            onPrev={handlePrev}
            onSeek={handleManualSeek}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            setVolume={setVolume}
            playbackRate={playbackRate}
            setPlaybackRate={setPlaybackRate}
            syncMode={syncMode}
            onToggleSyncMode={handleToggleSyncMode}
            isLargeText={isLargeText}
          />
        );
      case View.PLAYLIST:
        return (
          <Playlist
            currentTrackId={currentTrack.id}
            onTrackSelect={handleTrackSelect}
            isLargeText={isLargeText}
          />
        );
      case View.TIMER:
        return (
          <Settings
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onNext={handleNext}
            onPrev={handlePrev}
            onUpdateTarget={handleUpdateTarget}
            onStopTask={stopTask}
            taskProgress={taskProgress}
            taskTarget={taskTarget}
            currentTime={currentTime}
            duration={duration}
            syncMode={syncMode}
            isLargeText={isLargeText}
          />
        );
      case View.PROFILE:
        return (
          <Profile
            stats={stats}
            zenQuote={zenQuote}
            onRefreshQuote={handleRefreshQuote}
            isLargeText={isLargeText}
            onToggleLargeText={() => setIsLargeText(!isLargeText)}
            onOpenShare={() => setShowShare(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto min-h-screen relative shadow-2xl bg-zen-dark overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-wood-grain mix-blend-overlay opacity-20"></div>
        <div className="absolute top-1/4 -left-1/4 w-[150%] h-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-[100px] animate-smoke-flow rotate-12"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-[150%] h-1/2 bg-gradient-to-l from-transparent via-gold-main/5 to-transparent blur-[80px] animate-smoke-flow -rotate-6 animation-delay-5000"></div>
      </div>

      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        onTimeUpdate={handleTaskTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => {
          clearSwitchingTrackGuard();
          resumeAfterInterruptRef.current = false;
          manualPauseIntentRef.current = false;
          setIsPlaying(true);

          if (syncModeRef.current) {
            clearResumeSyncAlignTimer();
            resumeSyncAlignTimerRef.current = window.setTimeout(() => {
              resumeSyncAlignTimerRef.current = null;
              runSyncDriftCorrection(currentTrack.durationMs);
            }, 180);
          }
        }}
        onPause={() => {
          if (isSwitchingTrackRef.current) return;
          clearResumeSyncAlignTimer();

          const shouldAutoResume =
            !manualPauseIntentRef.current &&
            syncModeRef.current &&
            (document.visibilityState === 'hidden' || !document.hasFocus());

          if (shouldAutoResume) {
            resumeAfterInterruptRef.current = true;
          }

          setIsPlaying(false);
        }}
        onError={(e) => console.error("Audio error:", e)}
        crossOrigin="anonymous"
        loop={playbackMode === PlaybackMode.SINGLE_LOOP || isTaskActive}
      />

      {renderContent()}

      <BottomNav activeView={view} onViewChange={setView} />

      {syncNotice && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/75 border border-gold-main/30 text-gold-light text-xs tracking-[0.12em] font-serif shadow-xl backdrop-blur pointer-events-none">
          {syncNotice}
        </div>
      )}

      {showMerit && <MeritAnimation onComplete={() => setShowMerit(false)} />}
      {showShare && <ShareCard quote={zenQuote} onClose={() => setShowShare(false)} />}
    </div>
  );
};

export default App;