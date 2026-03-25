import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Track } from '../types';

const IS_NATIVE = Capacitor.isNativePlatform();
const ASSET_ID = 'current_track';

let _nativeAudio: any = null;
const getNativeAudio = async () => {
  if (!_nativeAudio) {
    const mod = await import('@capgo/native-audio');
    _nativeAudio = mod.NativeAudio;
  }
  return _nativeAudio;
};

function createAudioProxy() {
  let _currentTime = 0;
  let _playbackRate = 1.0;

  return {
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
    _updateTime(v: number) { _currentTime = v; },
    _updateRate(v: number) { _playbackRate = v; },
  };
}

export const useAudioPlayer = (currentTrack: Track) => {
  const proxyRef = useRef(createAudioProxy());
  const audioRef = useRef<any>(proxyRef.current);
  const loadedTrackRef = useRef<string | null>(null);
  const isNativeReady = useRef(false);
  const pendingTrackRef = useRef<Track | null>(null);
  const pendingPlayRef = useRef(false);

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

  const onTimeUpdateRef = useRef<(() => void) | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);
  const onPlayRef = useRef<(() => void) | null>(null);
  const onPauseRef = useRef<(() => void) | null>(null);
  const onErrorRef = useRef<((e: any) => void) | null>(null);

  // ── 加载曲目（内部函数，不依赖 state） ──
  const doLoadTrack = async (track: Track) => {
    const NativeAudio = await getNativeAudio();

    if (loadedTrackRef.current) {
      try { await NativeAudio.stop({ assetId: ASSET_ID }); } catch {}
      try { await NativeAudio.unload({ assetId: ASSET_ID }); } catch {}
    }

    // NativeAudio 自动加 "public/" 前缀，所以传 "assets/audio/..." 即可
    const assetPath = track.audioUrl.startsWith('/')
      ? track.audioUrl.substring(1)  // "/assets/audio/..." → "assets/audio/..."
      : track.audioUrl;

    await NativeAudio.preload({
      assetId: ASSET_ID,
      assetPath,
      isUrl: false,
      volume: proxyRef.current.volume,
      notificationMetadata: {
        title: track.title,
        artist: '星光播放器',
      },
    });

    const { duration: dur } = await NativeAudio.getDuration({ assetId: ASSET_ID });
    const proxy = proxyRef.current;
    proxy.duration = dur || 0;
    proxy._updateTime(0);
    proxy.paused = true;
    setDuration(dur || 0);
    setCurrentTime(0);
    loadedTrackRef.current = track.id;

    await NativeAudio.loop({ assetId: ASSET_ID, isLooping: true }).catch(() => {});
  };

  // ── 播放（内部函数） ──
  const doPlay = async () => {
    if (!loadedTrackRef.current) return;
    const NativeAudio = await getNativeAudio();
    try {
      await NativeAudio.resume({ assetId: ASSET_ID });
    } catch {
      try { await NativeAudio.play({ assetId: ASSET_ID }); } catch {}
    }
    proxyRef.current.paused = false;
    if (onPlayRef.current) onPlayRef.current();
  };

  const doPause = async () => {
    if (!loadedTrackRef.current) return;
    const NativeAudio = await getNativeAudio();
    try { await NativeAudio.pause({ assetId: ASSET_ID }); } catch {}
    proxyRef.current.paused = true;
    if (onPauseRef.current) onPauseRef.current();
  };

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
          proxyRef.current._updateTime(event.currentTime || 0);
          setCurrentTime(event.currentTime || 0);
          if (onTimeUpdateRef.current) onTimeUpdateRef.current();
        });

        NativeAudio.addListener('complete', (event: any) => {
          if (cancelled || event.assetId !== ASSET_ID) return;
          if (onCompleteRef.current) onCompleteRef.current();
        });

        isNativeReady.current = true;

        // 处理初始化期间积压的加载请求
        const pending = pendingTrackRef.current;
        if (pending) {
          pendingTrackRef.current = null;
          await doLoadTrack(pending);
          if (pendingPlayRef.current) {
            pendingPlayRef.current = false;
            await doPlay();
          }
        }
      } catch (e) {
        console.warn('NativeAudio init failed:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── 切曲时加载 ──
  useEffect(() => {
    if (!IS_NATIVE) return;
    if (!isNativeReady.current) {
      // 初始化还没完成，先记下来
      pendingTrackRef.current = currentTrack;
      return;
    }
    (async () => {
      await doLoadTrack(currentTrack);
      // 如果切曲时正在播放，加载完自动播放
      if (isPlaying) {
        await doPlay();
      }
    })();
  }, [currentTrack.id]);

  // ── 播放/暂停 ──
  useEffect(() => {
    if (!IS_NATIVE) return;
    if (!isNativeReady.current || !loadedTrackRef.current) {
      // 还没准备好，记下播放意图
      if (isPlaying) pendingPlayRef.current = true;
      return;
    }
    if (isPlaying) {
      doPlay();
    } else {
      doPause();
    }
  }, [isPlaying]);

  // ── 音量 ──
  useEffect(() => {
    localStorage.setItem('zen_chant_volume', JSON.stringify(volume));
    proxyRef.current.volume = volume;
    if (!IS_NATIVE || !loadedTrackRef.current) return;
    getNativeAudio().then(na => na.setVolume({ assetId: ASSET_ID, volume }).catch(() => {}));
  }, [volume]);

  // ── 播放速率 ──
  useEffect(() => {
    localStorage.setItem('zen_chant_playback_rate', JSON.stringify(playbackRate));
    proxyRef.current._updateRate(playbackRate);
    if (!IS_NATIVE || !loadedTrackRef.current) return;
    getNativeAudio().then(na => na.setRate({ assetId: ASSET_ID, rate: playbackRate }).catch(() => {}));
  }, [playbackRate]);

  // ── Web 降级 ──
  const webAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (IS_NATIVE) return;
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
    if (isPlaying) { webAudioRef.current.play().catch(() => {}); }
    else { webAudioRef.current.pause(); }
  }, [isPlaying]);

  useEffect(() => {
    if (IS_NATIVE || !webAudioRef.current) return;
    webAudioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (IS_NATIVE || !webAudioRef.current) return;
    webAudioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

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

  const handleTimeUpdate = () => {};

  return {
    audioRef, isPlaying, setIsPlaying, currentTime, duration,
    volume, setVolume, playbackRate, setPlaybackRate,
    togglePlay, seek, handleTimeUpdate,
    onTimeUpdateRef, onCompleteRef, onPlayRef, onPauseRef, onErrorRef,
  };
};
