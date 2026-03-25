import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Track } from '../types';

const IS_NATIVE = Capacitor.isNativePlatform();
const ASSET_ID = 'current_track';

let _nativeAudio: any = null;
let _nativeAudioFailed = false; // 标记原生音频是否不可用，降级到 web

const getNativeAudio = async () => {
  if (_nativeAudioFailed) return null;
  if (!_nativeAudio) {
    try {
      const mod = await import('@capgo/native-audio');
      _nativeAudio = mod.NativeAudio;
    } catch {
      _nativeAudioFailed = true;
      return null;
    }
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
      if (!_nativeAudioFailed) {
        getNativeAudio().then(na => na?.setCurrentTime({ assetId: ASSET_ID, time: v }).catch(() => {}));
      }
    },
    get playbackRate() { return _playbackRate; },
    set playbackRate(v: number) {
      _playbackRate = v;
      if (!_nativeAudioFailed) {
        getNativeAudio().then(na => na?.setRate({ assetId: ASSET_ID, rate: v }).catch(() => {}));
      }
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
  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  // audioRef 对外暴露：原生模式用 proxy，web 模式用 HTMLAudioElement
  const audioRef = useRef<any>(proxyRef.current);
  const loadedTrackRef = useRef<string | null>(null);
  const isNativeReady = useRef(false);
  const useNativeRef = useRef(IS_NATIVE && !_nativeAudioFailed);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    try { return JSON.parse(localStorage.getItem('zen_chant_volume') || '0.65'); }
    catch { return 0.65; }
  });
  const [playbackRate, setPlaybackRate] = useState(() => {
    try { return JSON.parse(localStorage.getItem('zen_chant_playback_rate') || '1.0'); }
    catch { return 1.0; }
  });

  const onTimeUpdateRef = useRef<(() => void) | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);
  const onPlayRef = useRef<(() => void) | null>(null);
  const onPauseRef = useRef<(() => void) | null>(null);
  const onErrorRef = useRef<((e: any) => void) | null>(null);

  // ── Web Audio 辅助 ──
  const ensureWebAudio = () => {
    if (!webAudioRef.current) {
      const el = new Audio();
      el.loop = true;
      el.addEventListener('timeupdate', () => {
        const proxy = proxyRef.current;
        proxy._updateTime(el.currentTime);
        proxy.duration = el.duration || 0;
        setCurrentTime(el.currentTime);
        setDuration(el.duration || 0);
        if (onTimeUpdateRef.current) onTimeUpdateRef.current();
      });
      el.addEventListener('ended', () => {
        if (onCompleteRef.current) onCompleteRef.current();
      });
      webAudioRef.current = el;
    }
    return webAudioRef.current;
  };

  const fallbackToWeb = () => {
    console.warn('NativeAudio unavailable, falling back to web audio');
    _nativeAudioFailed = true;
    useNativeRef.current = false;
    const el = ensureWebAudio();
    audioRef.current = el;
    // 加载当前曲目
    el.src = currentTrack.audioUrl;
    el.volume = volume;
    el.playbackRate = playbackRate;
    el.load();
    loadedTrackRef.current = currentTrack.id;
  };

  // ── 初始化 NativeAudio ──
  useEffect(() => {
    if (!IS_NATIVE) {
      // Web 环境直接用 web audio
      useNativeRef.current = false;
      const el = ensureWebAudio();
      audioRef.current = el;
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const NativeAudio = await getNativeAudio();
        if (!NativeAudio || cancelled) { fallbackToWeb(); return; }

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

        // 加载初始曲目
        try {
          await doLoadTrackNative(currentTrack);
        } catch (e) {
          console.error('Initial track load failed, falling back to web:', e);
          fallbackToWeb();
        }
      } catch (e) {
        console.error('NativeAudio init failed:', e);
        fallbackToWeb();
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Native 加载曲目 ──
  const doLoadTrackNative = async (track: Track) => {
    const NativeAudio = await getNativeAudio();
    if (!NativeAudio) throw new Error('NativeAudio not available');

    if (loadedTrackRef.current) {
      try { await NativeAudio.stop({ assetId: ASSET_ID }); } catch {}
      try { await NativeAudio.unload({ assetId: ASSET_ID }); } catch {}
      loadedTrackRef.current = null;
    }

    // NativeAudio 自动加 "public/" 前缀
    const assetPath = track.audioUrl.startsWith('/')
      ? track.audioUrl.substring(1)
      : track.audioUrl;

    await NativeAudio.preload({
      assetId: ASSET_ID,
      assetPath,
      isUrl: false,
      volume: proxyRef.current.volume,
      notificationMetadata: { title: track.title, artist: '星光播放器' },
    });

    const { duration: dur } = await NativeAudio.getDuration({ assetId: ASSET_ID });
    proxyRef.current.duration = dur || 0;
    proxyRef.current._updateTime(0);
    proxyRef.current.paused = true;
    setDuration(dur || 0);
    setCurrentTime(0);
    loadedTrackRef.current = track.id;

    await NativeAudio.loop({ assetId: ASSET_ID, isLooping: true }).catch(() => {});
  };

  // ── 切曲 ──
  useEffect(() => {
    if (!useNativeRef.current) {
      // Web 模式
      const el = ensureWebAudio();
      el.src = currentTrack.audioUrl;
      el.volume = volume;
      el.playbackRate = playbackRate;
      el.load();
      loadedTrackRef.current = currentTrack.id;
      if (isPlaying) el.play().catch(() => {});
      return;
    }

    if (!isNativeReady.current) return; // 初始化中，由初始化完成后加载

    (async () => {
      try {
        await doLoadTrackNative(currentTrack);
        if (isPlaying) await doPlayNative();
      } catch (e) {
        console.error('Track load failed, falling back:', e);
        fallbackToWeb();
        if (isPlaying) ensureWebAudio().play().catch(() => {});
      }
    })();
  }, [currentTrack.id]);

  // ── Native 播放/暂停 ──
  const doPlayNative = async () => {
    if (!loadedTrackRef.current) return;
    const NativeAudio = await getNativeAudio();
    if (!NativeAudio) return;
    try {
      await NativeAudio.play({ assetId: ASSET_ID });
    } catch (e) {
      console.error('NativeAudio play failed:', e);
    }
    proxyRef.current.paused = false;
    if (onPlayRef.current) onPlayRef.current();
  };

  const doPauseNative = async () => {
    if (!loadedTrackRef.current) return;
    const NativeAudio = await getNativeAudio();
    if (!NativeAudio) return;
    try { await NativeAudio.pause({ assetId: ASSET_ID }); } catch {}
    proxyRef.current.paused = true;
    if (onPauseRef.current) onPauseRef.current();
  };

  // ── 播放/暂停 effect ──
  useEffect(() => {
    if (!useNativeRef.current) {
      const el = webAudioRef.current;
      if (!el) return;
      if (isPlaying) el.play().catch(() => {});
      else el.pause();
      return;
    }

    if (!isNativeReady.current || !loadedTrackRef.current) return;
    if (isPlaying) doPlayNative();
    else doPauseNative();
  }, [isPlaying]);

  // ── 音量 ──
  useEffect(() => {
    localStorage.setItem('zen_chant_volume', JSON.stringify(volume));
    proxyRef.current.volume = volume;
    if (webAudioRef.current) webAudioRef.current.volume = volume;
    if (useNativeRef.current && loadedTrackRef.current) {
      getNativeAudio().then(na => na?.setVolume({ assetId: ASSET_ID, volume }).catch(() => {}));
    }
  }, [volume]);

  // ── 播放速率 ──
  useEffect(() => {
    localStorage.setItem('zen_chant_playback_rate', JSON.stringify(playbackRate));
    proxyRef.current._updateRate(playbackRate);
    if (webAudioRef.current) webAudioRef.current.playbackRate = playbackRate;
    if (useNativeRef.current && loadedTrackRef.current) {
      getNativeAudio().then(na => na?.setRate({ assetId: ASSET_ID, rate: playbackRate }).catch(() => {}));
    }
  }, [playbackRate]);

  // ── 清理 ──
  useEffect(() => {
    return () => {
      if (useNativeRef.current && loadedTrackRef.current) {
        getNativeAudio().then(na => {
          na?.stop({ assetId: ASSET_ID }).catch(() => {});
          na?.unload({ assetId: ASSET_ID }).catch(() => {});
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
    proxyRef.current._updateTime(time);
    if (useNativeRef.current) {
      getNativeAudio().then(na => na?.setCurrentTime({ assetId: ASSET_ID, time }).catch(() => {}));
    }
    if (webAudioRef.current && !useNativeRef.current) {
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
