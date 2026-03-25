import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Track } from '../types';

const IS_NATIVE = Capacitor.isNativePlatform();
const ASSET_ID = 'current_track';

// NativeAudio 懒加载
let _nativeAudio: any = null;
const getNativeAudio = async () => {
  if (!_nativeAudio) {
    const mod = await import('@capgo/native-audio');
    _nativeAudio = mod.NativeAudio;
  }
  return _nativeAudio;
};

/**
 * AudioProxy: 模拟 HTMLAudioElement 的关键属性，供 App.tsx 中 audioRef.current 读写
 * 使用 getter/setter 拦截 currentTime 和 playbackRate 赋值，自动同步到原生层
 */
function createAudioProxy() {
  let _currentTime = 0;
  let _playbackRate = 1.0;

  const proxy = {
    get currentTime() { return _currentTime; },
    set currentTime(v: number) {
      _currentTime = v;
      getNativeAudio().then(na => na.setCurrentTime({ assetId: ASSET_ID, time: v }).catch(() => {}));
    },
    get playbackRate() { return _playbackRate; },
    set playbackRate(v: number) {
      _playbackRate = v;
      getNativeAudio().then(na => na.setRate({ assetId: ASSET_ID, rate: v }).catch(() => {}));
    },
    duration: 0,
    paused: true,
    loop: false,
    volume: 0.65,
    // 内部更新 currentTime 不触发 seek（用于 NativeAudio 回调）
    _updateTime(v: number) { _currentTime = v; },
    _updateRate(v: number) { _playbackRate = v; },
  };
  return proxy;
}

export const useAudioPlayer = (currentTrack: Track) => {
  const proxyRef = useRef(createAudioProxy());
  const audioRef = useRef<any>(proxyRef.current);
  const loadedTrackRef = useRef<string | null>(null);
  const isNativeReady = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem('zen_chant_volume');
      return saved ? JSON.parse(saved) : 0.65;
    } catch { return 0.65; }
  });
  const [playbackRate, setPlaybackRate] = useState(() => {
    try {
      const saved = localStorage.getItem('zen_chant_playback_rate');
      return saved ? JSON.parse(saved) : 1.0;
    } catch { return 1.0; }
  });

  // 外部回调（App.tsx 的 onTimeUpdate / onComplete 等）
  const onTimeUpdateRef = useRef<(() => void) | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);
  const onPlayRef = useRef<(() => void) | null>(null);
  const onPauseRef = useRef<(() => void) | null>(null);
  const onErrorRef = useRef<((e: any) => void) | null>(null);

  // ── 初始化 NativeAudio ──
  useEffect(() => {
    if (!IS_NATIVE) return;
    let cancelled = false;
    (async () => {
      try {
        const NativeAudio = await getNativeAudio();
        await NativeAudio.configure({
          backgroundPlayback: true,
          showNotification: true,
          focus: true,
        });

        NativeAudio.addListener('currentTime', (event: any) => {
          if (cancelled) return;
          const proxy = proxyRef.current;
          proxy._updateTime(event.currentTime || 0);
          setCurrentTime(proxy.currentTime);
          if (onTimeUpdateRef.current) onTimeUpdateRef.current();
        });

        NativeAudio.addListener('complete', (event: any) => {
          if (cancelled || event.assetId !== ASSET_ID) return;
          if (onCompleteRef.current) onCompleteRef.current();
        });

        isNativeReady.current = true;
      } catch (e) {
        console.warn('NativeAudio init failed, falling back to web:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── 加载曲目 ──
  const loadTrack = useCallback(async (track: Track) => {
    if (!IS_NATIVE || !isNativeReady.current) return;
    const NativeAudio = await getNativeAudio();

    // 卸载旧曲目
    if (loadedTrackRef.current) {
      try { await NativeAudio.stop({ assetId: ASSET_ID }); } catch {}
      try { await NativeAudio.unload({ assetId: ASSET_ID }); } catch {}
    }

    // 音频路径：Capacitor 打包在 public/ 下，原生访问路径是 public/assets/audio/...
    const assetPath = track.audioUrl.startsWith('/') ? 'public' + track.audioUrl : track.audioUrl;

    await NativeAudio.preload({
      assetId: ASSET_ID,
      assetPath,
      isUrl: false,
      volume: volume,
      notificationMetadata: {
        title: track.title,
        artist: '星光播放器',
      },
    });

    // 获取时长
    const { duration: dur } = await NativeAudio.getDuration({ assetId: ASSET_ID });
    const proxy = proxyRef.current;
    proxy.duration = dur || 0;
    proxy._updateTime(0);
    proxy.paused = true;
    setDuration(dur || 0);
    setCurrentTime(0);
    loadedTrackRef.current = track.id;

    // 设置循环
    await NativeAudio.loop({ assetId: ASSET_ID, isLooping: true }).catch(() => {});
  }, [volume]);

  // 切曲时加载
  useEffect(() => {
    if (!IS_NATIVE) return;
    loadTrack(currentTrack);
  }, [currentTrack.id]);

  // ── 播放/暂停 ──
  useEffect(() => {
    if (!IS_NATIVE) return;
    const proxy = proxyRef.current;

    (async () => {
      if (!isNativeReady.current || !loadedTrackRef.current) return;
      const NativeAudio = await getNativeAudio();

      if (isPlaying) {
        try {
          await NativeAudio.resume({ assetId: ASSET_ID });
        } catch {
          try { await NativeAudio.play({ assetId: ASSET_ID }); } catch {}
        }
        proxy.paused = false;
        if (onPlayRef.current) onPlayRef.current();
      } else {
        try { await NativeAudio.pause({ assetId: ASSET_ID }); } catch {}
        proxy.paused = true;
        if (onPauseRef.current) onPauseRef.current();
      }
    })();
  }, [isPlaying]);

  // ── 音量 ──
  useEffect(() => {
    localStorage.setItem('zen_chant_volume', JSON.stringify(volume));
    if (!IS_NATIVE || !loadedTrackRef.current) return;
    proxyRef.current.volume = volume;
    getNativeAudio().then(na => na.setVolume({ assetId: ASSET_ID, volume }).catch(() => {}));
  }, [volume]);

  // ── 播放速率 ──
  useEffect(() => {
    localStorage.setItem('zen_chant_playback_rate', JSON.stringify(playbackRate));
    proxyRef.current._updateRate(playbackRate);
    if (!IS_NATIVE || !loadedTrackRef.current) return;
    getNativeAudio().then(na => na.setRate({ assetId: ASSET_ID, rate: playbackRate }).catch(() => {}));
  }, [playbackRate]);

  // ── Web 降级（开发环境） ──
  const webAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (IS_NATIVE) return;
    // Web 环境使用 <audio> 元素
    if (!webAudioRef.current) {
      const el = new Audio();
      el.loop = true;
      webAudioRef.current = el;
      audioRef.current = el;
    }
    const el = webAudioRef.current;
    el.src = currentTrack.audioUrl;
    el.volume = volume;
    el.playbackRate = playbackRate;
    el.load();
  }, [currentTrack.id]);

  useEffect(() => {
    if (IS_NATIVE || !webAudioRef.current) return;
    if (isPlaying) {
      webAudioRef.current.play().catch(() => {});
    } else {
      webAudioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (IS_NATIVE || !webAudioRef.current) return;
    webAudioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (IS_NATIVE || !webAudioRef.current) return;
    webAudioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Web 环境的 timeupdate
  useEffect(() => {
    if (IS_NATIVE || !webAudioRef.current) return;
    const el = webAudioRef.current;
    const handler = () => {
      setCurrentTime(el.currentTime);
      setDuration(el.duration || 0);
      if (onTimeUpdateRef.current) onTimeUpdateRef.current();
    };
    el.addEventListener('timeupdate', handler);
    return () => el.removeEventListener('timeupdate', handler);
  }, [currentTrack.id]);

  // ── 清理 ──
  useEffect(() => {
    return () => {
      if (IS_NATIVE && loadedTrackRef.current) {
        getNativeAudio().then(na => {
          na.stop({ assetId: ASSET_ID }).catch(() => {});
          na.unload({ assetId: ASSET_ID }).catch(() => {});
        });
      }
      if (webAudioRef.current) {
        webAudioRef.current.pause();
        webAudioRef.current.src = '';
      }
    };
  }, []);

  const togglePlay = () => setIsPlaying(prev => !prev);

  const seek = (time: number) => {
    setCurrentTime(time);
    if (IS_NATIVE) {
      proxyRef.current._updateTime(time);
      getNativeAudio().then(na => na.setCurrentTime({ assetId: ASSET_ID, time }).catch(() => {}));
    } else if (webAudioRef.current) {
      webAudioRef.current.currentTime = time;
    }
  };

  const handleTimeUpdate = () => {
    // 由 NativeAudio currentTime 事件或 web timeupdate 自动触发
    // 这里保留空实现，供 App.tsx 兼容调用
  };

  return {
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
    handleTimeUpdate,
    // 新增：供 App.tsx 注册回调
    onTimeUpdateRef,
    onCompleteRef,
    onPlayRef,
    onPauseRef,
    onErrorRef,
  };
};
