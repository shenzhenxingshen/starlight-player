
import React, { useRef, useEffect, useState } from 'react';
import { Track } from '../types';
import VinylRecord from './VinylRecord';
import { FEATURE_FLAGS } from '../constants/featureFlags';

interface PlayerProps {
  track: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  currentTime: number;
  duration: number;
  volume: number;
  setVolume: (vol: number) => void;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  syncMode: boolean;
  onToggleSyncMode: () => void;
  isLargeText: boolean;
}

const Player: React.FC<PlayerProps> = ({
  track, isPlaying, onTogglePlay, onNext, onPrev, onSeek,
  currentTime, duration, volume, setVolume,
  playbackRate, setPlaybackRate, syncMode, onToggleSyncMode, isLargeText
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVinyl, setShowVinyl] = useState(() => {
    try {
      const saved = localStorage.getItem('zen_chant_show_vinyl');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [showLyrics, setShowLyrics] = useState(false);
  const lastVolumeRef = useRef(volume > 0 ? volume : 0.65);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  const enableLyrics = !FEATURE_FLAGS.HIDE_LYRICS;
  const enableCoverToggle = !FEATURE_FLAGS.HIDE_COVER_TOGGLE;
  const enableModeSwitch = !FEATURE_FLAGS.HIDE_MODE_SWITCH;
  const enablePlaybackRate = !FEATURE_FLAGS.HIDE_PLAYBACK_RATE;
  const enableVolumeControl = !FEATURE_FLAGS.HIDE_VOLUME_CONTROL;
  const showSyncLockTip = !FEATURE_FLAGS.HIDE_SYNC_LOCK_TIP;
  const timelineLocked = FEATURE_FLAGS.LOCK_TIMELINE || syncMode;

  const isMinimalUi =
    !enableLyrics &&
    !enableCoverToggle &&
    !enableModeSwitch &&
    !enablePlaybackRate &&
    !enableVolumeControl;

  const mainButtonScale = FEATURE_FLAGS.PLAYER_MAIN_BUTTON_SCALE;
  const mainButtonSize = Math.round(96 * mainButtonScale);
  const mainIconSize = Math.round(68 * mainButtonScale);

  const currentLyricIndex = track.lyrics?.findIndex((l, i) => {
    const next = track.lyrics?.[i + 1];
    return currentTime >= l.time && (!next || currentTime < next.time);
  }) ?? -1;

  useEffect(() => {
    if (enableCoverToggle) {
      localStorage.setItem('zen_chant_show_vinyl', JSON.stringify(showVinyl));
    }
  }, [showVinyl, enableCoverToggle]);

  useEffect(() => {
    if (enableLyrics && showLyrics && lyricsContainerRef.current && currentLyricIndex !== -1) {
      const container = lyricsContainerRef.current;
      const activeElement = container.children[currentLyricIndex] as HTMLElement;
      if (activeElement) {
        const containerHeight = container.clientHeight;
        const elementTop = activeElement.offsetTop;
        const elementHeight = activeElement.clientHeight;
        const scrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);
        container.scrollTo({ top: scrollTop, behavior: 'smooth' });
      }
    }
  }, [currentLyricIndex, showLyrics, enableLyrics]);

  useEffect(() => {
    if (volume > 0) {
      lastVolumeRef.current = volume;
    }
  }, [volume]);

  useEffect(() => {
    if ((syncMode || !enablePlaybackRate) && showSpeedMenu) {
      setShowSpeedMenu(false);
    }
  }, [syncMode, showSpeedMenu, enablePlaybackRate]);

  const handleMuteToggle = () => {
    if (volume > 0) {
      setVolume(0);
    } else {
      setVolume(lastVolumeRef.current);
    }
  };

  const formatSeconds = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const sideButtonSizeClass = isMinimalUi ? 'w-16 h-16' : 'w-14 h-14';

  return (
    <main className="flex-1 flex flex-col justify-between px-6 pt-12 pb-28 relative z-10">
      <div className="flex-1 flex flex-col justify-center items-center gap-8">
        {!isMinimalUi && (
          <div className="relative w-60 h-60 sm:w-72 sm:h-72">
            <div className="absolute inset-0 rounded-full bg-gold-main/20 blur-[60px]"></div>
            <div className="relative w-full h-full rounded-full gold-ring shadow-[0_0_60px_rgba(0,0,0,0.6)]">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#0c0805] relative flex items-center justify-center border-[4px] border-[#1A0F08]">
                {showVinyl || !enableCoverToggle ? (
                  <VinylRecord isPlaying={isPlaying} currentTime={currentTime} duration={duration} />
                ) : (
                  <img
                    alt={track.title}
                    className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-in-out ${isPlaying ? 'scale-110 rotate-2' : 'scale-100 rotate-0'}`}
                    src={track.imageUrl}
                  />
                )}
              </div>
            </div>

            {enableLyrics && (
              <button
                onClick={() => setShowLyrics((prev) => !prev)}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] tracking-widest bg-black/50 text-gold-main border border-gold-main/20"
              >
                {showLyrics ? '隐藏歌词' : '显示歌词'}
              </button>
            )}
          </div>
        )}

        {enableLyrics && showLyrics && !isMinimalUi && (
          <div
            ref={lyricsContainerRef}
            className="w-full max-w-[340px] max-h-44 overflow-y-auto scrollbar-hide bg-black/25 rounded-2xl border border-white/10 px-4 py-3 space-y-3"
          >
            {track.lyrics && track.lyrics.length > 0 ? (
              track.lyrics.map((line, idx) => (
                <p
                  key={idx}
                  className={`text-center font-serif transition-all ${
                    idx === currentLyricIndex
                      ? 'text-gold-light text-base'
                      : 'text-stone-500 text-sm'
                  }`}
                >
                  {line.text}
                </p>
              ))
            ) : (
              <p className="text-center text-sm text-stone-500">暂无歌词内容</p>
            )}
          </div>
        )}

        <div className="text-center space-y-3">
          <h2 className={`text-gold-glow font-bold tracking-[0.22em] font-serif transition-all ${isLargeText ? 'text-5xl' : 'text-3xl'}`}>
            {track.title}
          </h2>
          {!isMinimalUi && track.subtitle && (
            <p className={`text-stone-500 font-light tracking-[0.2em] font-serif italic opacity-80 ${isLargeText ? 'text-lg' : 'text-sm'}`}>
              {track.subtitle}
            </p>
          )}
        </div>

        <div className="w-full max-w-[340px] space-y-3">
          <div className={`relative h-1.5 w-full rounded-full overflow-visible transition-opacity ${timelineLocked ? 'bg-stone-800/60 opacity-70' : 'bg-stone-900/80'}`}>
            <input
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              disabled={timelineLocked}
              className={`absolute inset-0 w-full h-full opacity-0 z-20 ${timelineLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            />
            <div
              className="absolute top-0 left-0 h-full bg-gold-metal shadow-[0_0_15px_rgba(212,175,55,0.7)] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] transition-all duration-300"
              style={{ left: `${progressPercent}%`, transform: 'translate(-50%, -50%)' }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-stone-600 font-display tracking-widest font-bold">
            <span>{formatSeconds(currentTime)}</span>
            <span>{formatSeconds(duration)}</span>
          </div>
          {syncMode && showSyncLockTip && (
            <p className="text-center text-[10px] text-gold-main/70 tracking-[0.25em] font-serif mt-1">
              共修模式已锁定时间轴
            </p>
          )}
        </div>
      </div>

      <div className="w-full max-w-[360px] mx-auto">
        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            className={`${sideButtonSizeClass} rounded-full flex items-center justify-center text-gold-main/70 hover:text-gold-light hover:bg-white/5 active:scale-90 transition-all border border-white/10`}
            aria-label="上一曲"
          >
            <span className="material-symbols-outlined text-[44px]">chevron_left</span>
          </button>

          <button
            onClick={onTogglePlay}
            className="relative rounded-full bg-gold-metal flex items-center justify-center shadow-[0_15px_45px_rgba(0,0,0,0.7),inset_0_-4px_8px_rgba(0,0,0,0.4)] active:scale-95 transition-all border-4 border-[#2C1E12] overflow-hidden"
            style={{ width: `${mainButtonSize}px`, height: `${mainButtonSize}px` }}
            aria-label={isPlaying ? '暂停' : '播放'}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 opacity-70 pointer-events-none"></div>
            <span className="material-symbols-outlined text-[#3d2b1f] select-none" style={{ fontSize: `${mainIconSize}px` }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <button
            onClick={onNext}
            className={`${sideButtonSizeClass} rounded-full flex items-center justify-center text-gold-main/70 hover:text-gold-light hover:bg-white/5 active:scale-90 transition-all border border-white/10`}
            aria-label="下一曲"
          >
            <span className="material-symbols-outlined text-[44px]">chevron_right</span>
          </button>
        </div>

        {!isMinimalUi && (
          <div className="mt-6 space-y-3">
            <div className="flex justify-center gap-2 px-1 flex-wrap">
              {enableCoverToggle && (
                <button
                  onClick={() => setShowVinyl(!showVinyl)}
                  className={`min-w-0 whitespace-nowrap flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all duration-300 backdrop-blur-xl active:scale-95 ${
                    showVinyl
                      ? 'bg-gold-main/20 border-gold-main/30 text-gold-light shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                      : 'bg-black/40 border-white/5 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {showVinyl ? 'album' : 'image'}
                  </span>
                  <span className="text-[11px] font-bold tracking-[0.16em] font-serif">
                    {showVinyl ? '唱片' : '封面'}
                  </span>
                </button>
              )}

              {enableModeSwitch && (
                <button
                  onClick={onToggleSyncMode}
                  className={`min-w-0 whitespace-nowrap flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all duration-300 backdrop-blur-xl active:scale-95 ${
                    syncMode
                      ? 'bg-gold-main/20 border-gold-main/40 text-gold-light shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                      : 'bg-black/40 border-white/5 text-stone-400 hover:text-stone-200'
                  }`}
                  title={syncMode ? '已开启共修模式' : '开启共修模式'}
                >
                  <span className="material-symbols-outlined text-base">
                    {syncMode ? 'sync_lock' : 'sync'}
                  </span>
                  <span className="text-[11px] font-bold tracking-[0.16em] font-serif">
                    {syncMode ? '共修' : '自习'}
                  </span>
                </button>
              )}

              {enablePlaybackRate && (
                <button
                  onClick={() => !syncMode && setShowSpeedMenu(!showSpeedMenu)}
                  disabled={syncMode}
                  className={`min-w-0 whitespace-nowrap flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all duration-300 backdrop-blur-xl ${
                    syncMode
                      ? 'bg-black/20 border-white/5 text-stone-600 cursor-not-allowed opacity-60'
                      : showSpeedMenu
                        ? 'bg-gold-main/20 border-gold-main/30 text-gold-light shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                        : 'bg-black/40 border-white/5 text-stone-400 hover:text-stone-200 active:scale-95'
                  }`}
                  title={syncMode ? '共修模式下倍速已锁定为1.0x' : '打开倍速调节'}
                >
                  <span className="material-symbols-outlined text-base">speed</span>
                  <span className="text-[11px] font-bold tracking-[0.16em] font-serif">
                    {playbackRate.toFixed(1)}x
                  </span>
                </button>
              )}
            </div>

            {showSpeedMenu && enablePlaybackRate && !syncMode && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 px-4">
                <div className="glass-panel rounded-2xl p-6 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-gold-main/10 max-w-[320px] mx-auto">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gold-main font-bold tracking-widest uppercase">播放倍速</span>
                    <button onClick={() => setShowSpeedMenu(false)} className="text-stone-500 hover:text-white">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setPlaybackRate(1.0)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-stone-400 hover:text-gold-main transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">replay</span>
                    </button>
                    <div className="flex-1 relative flex items-center h-6">
                      <div className="absolute w-full h-1 bg-stone-800 rounded-full"></div>
                      <div
                        className="absolute h-1 bg-gold-main/60 rounded-full transition-all duration-75"
                        style={{ width: `${((playbackRate - 0.5) / 1.5) * 100}%` }}
                      ></div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.05"
                        value={playbackRate}
                        onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                        className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div
                        className="absolute w-4 h-4 bg-gold-light rounded-full border-2 border-gold-main shadow-[0_0_10px_rgba(212,175,55,0.5)] transition-all duration-75"
                        style={{ left: `calc(${((playbackRate - 0.5) / 1.5) * 100}% - 8px)` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gold-light font-bold w-8 text-right">{playbackRate.toFixed(1)}x</span>
                  </div>
                </div>
              </div>
            )}

            {enableVolumeControl && (
              <div className="w-full flex items-center gap-4 px-5 py-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-inner group">
                <button
                  onClick={handleMuteToggle}
                  className="flex items-center justify-center focus:outline-none transition-transform active:scale-90"
                  title={volume === 0 ? '取消静音' : '静音'}
                >
                  <span className={`material-symbols-outlined text-[20px] font-light transition-colors ${volume === 0 ? 'text-red-500/80' : 'text-stone-600 hover:text-gold-main'}`}>
                    {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                  </span>
                </button>

                <div className="flex-1 relative flex items-center h-4">
                  <div className="absolute w-full h-1 bg-stone-800 rounded-full pointer-events-none"></div>
                  <div
                    className="absolute h-1 bg-gold-dark/60 rounded-full pointer-events-none transition-all duration-75"
                    style={{ width: `${volume * 100}%` }}
                  ></div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="absolute w-full h-6 opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className="absolute w-4 h-4 bg-gold-light rounded-full border-2 border-gold-dark shadow-xl transition-all duration-75 pointer-events-none"
                    style={{ left: `calc(${volume * 100}% - 8px)` }}
                  ></div>
                </div>
                <span className="text-[10px] text-stone-600 font-display w-6 text-right font-bold">{Math.round(volume * 100)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default Player;
