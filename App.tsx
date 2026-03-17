
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

const STATS_KEY = 'zen_chant_user_stats';
const CONFIG_KEY = 'zen_chant_config';
const SYNC_MODE_KEY = 'zen_chant_sync_mode';
const AUDIO_CACHE_NAME = 'zen-chant-audio';

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

  const [isLargeText, setIsLargeText] = useState(() => {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      return saved ? JSON.parse(saved).isLargeText : false;
    } catch {
      return false;
    }
  });
  const [syncMode, setSyncMode] = useState(() => {
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
    togglePlay,
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
    if (syncMode && playbackRate !== 1.0) {
      setPlaybackRate(1.0);
    }
  }, [syncMode, playbackRate, setPlaybackRate]);

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
    if (syncMode) {
      pendingSyncDurationMsRef.current = track.durationMs ?? null;
      pendingSyncAutoplayRef.current = true;
    }
    setCurrentTrack(track);
    setIsPlaying(true);
    setView(View.PLAYER);
    stopTask();
  };

  const handlePrev = () => {
    const idx = TRACKS.findIndex(t => t.id === currentTrack.id);
    if (idx !== -1) {
      const nextTrack = TRACKS[(idx - 1 + TRACKS.length) % TRACKS.length];
      if (syncMode && isPlaying) {
        pendingSyncDurationMsRef.current = nextTrack.durationMs ?? null;
        pendingSyncAutoplayRef.current = true;
      }
      if (isTaskActive) {
        stopTask();
      }
      setCurrentTrack(nextTrack);
      if (isPlaying) {
        setIsPlaying(true);
      }
    }
  };

  const handleRefreshQuote = () => {
    setZenQuote(getZenQuote());
  };

  const recordCompletion = (track: Track) => {
    setStats(prev => {
      const today = new Date().toISOString().split('T')[0];
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
    const idx = TRACKS.findIndex(t => t.id === currentTrack.id);
    if (idx !== -1) {
      const nextTrack = TRACKS[(idx + 1) % TRACKS.length];
      if (syncMode && isPlaying) {
        pendingSyncDurationMsRef.current = nextTrack.durationMs ?? null;
        pendingSyncAutoplayRef.current = true;
      }
      if (isTaskActive) {
        stopTask();
      }
      setCurrentTrack(nextTrack);
      if (isPlaying) {
        setIsPlaying(true);
      }
    }
  };

  const {
    playbackMode,
    isTaskActive,
    taskProgress,
    taskTarget,
    setTaskTarget,
    setTaskProgress,
    stopTask,
    updateTaskTarget,
    recordCompletion: taskRecordCompletion,
    isSingleLoop,
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
  const scheduledSyncStartTimerRef = useRef<number | null>(null);
  const syncDriftFirstCheckTimerRef = useRef<number | null>(null);
  const syncDriftIntervalRef = useRef<number | null>(null);

  const handleToggleSyncMode = () => {
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
  };

  const getSyncStartSec = (durationMs?: number, epochMs: number = Date.now()): number | null => {
    const resolvedDurationMs = durationMs ?? currentTrack.durationMs;
    if (!resolvedDurationMs || resolvedDurationMs <= 0) return null;

    const todayStart = new Date(epochMs);
    todayStart.setHours(0, 0, 0, 0);
    const elapsedMs = epochMs - todayStart.getTime();
    const rawOffsetMs = ((elapsedMs % resolvedDurationMs) + resolvedDurationMs) % resolvedDurationMs;
    const safeOffsetMs = Math.min(rawOffsetMs, Math.max(resolvedDurationMs - 120, 0));
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

    const driftSec = audio.currentTime - expectedSec;
    // 超过120ms才纠偏，避免抖动
    if (Math.abs(driftSec) > 0.12) {
      alignToSyncTimeline(durationMs);
    }
  };

  const scheduleSyncedStart = (durationMs?: number, afterStart?: () => void) => {
    clearScheduledSyncTimers();
    const audio = audioRef.current;
    if (!audio) {
      setIsPlaying(true);
      return;
    }

    const now = Date.now();
    const boundaryMs = 1000;
    const delayMs = boundaryMs - (now % boundaryMs);
    const targetEpochMs = now + delayMs;

    alignToSyncTimeline(durationMs, targetEpochMs);

    scheduledSyncStartTimerRef.current = window.setTimeout(() => {
      setIsPlaying(true);
      afterStart?.();

      // 起播后1.2秒做一次首次纠偏
      syncDriftFirstCheckTimerRef.current = window.setTimeout(() => {
        runSyncDriftCorrection(durationMs);
      }, 1200);

      // 每15秒做一次轻量纠偏
      syncDriftIntervalRef.current = window.setInterval(() => {
        runSyncDriftCorrection(durationMs);
      }, 15000);
    }, delayMs);
  };

  useEffect(() => {
    if (!syncMode) {
      clearScheduledSyncTimers();
    }
  }, [syncMode]);

  useEffect(() => {
    if (!isPlaying) {
      clearScheduledSyncTimers();
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      clearScheduledSyncTimers();
    };
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      clearScheduledSyncTimers();
      return;
    }
    if (syncMode) {
      scheduleSyncedStart(currentTrack.durationMs, () => setPlaybackRate(1.0));
      return;
    }
    setIsPlaying(true);
  };

  const handleUpdateTarget = (target: number) => {
    if (syncMode) {
      // 策略B：同步任务从0开始，首次完整回绕计为1
      const durationMs = currentTrack.durationMs;
      const startSec = getSyncStartSec(durationMs) ?? 0;
      updateTaskTarget(target, startSec, 0, false);
      scheduleSyncedStart(durationMs, () => setPlaybackRate(1.0));
    } else {
      updateTaskTarget(target, 0, 1);
    }
  };

  const handleManualSeek = (time: number) => {
    if (syncMode) return;
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
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => console.error("Audio error:", e)}
        crossOrigin="anonymous"
        loop={playbackMode === PlaybackMode.SINGLE_LOOP || isTaskActive}
      />

      {renderContent()}

      <BottomNav activeView={view} onViewChange={setView} />

      {showMerit && <MeritAnimation onComplete={() => setShowMerit(false)} />}
      {showShare && <ShareCard quote={zenQuote} onClose={() => setShowShare(false)} />}
    </div>
  );
};

export default App;