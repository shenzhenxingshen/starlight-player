
import React, { useRef, useEffect, useState } from 'react';
import { Track } from '../types';
import VinylRecord from './VinylRecord';

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
  isLargeText: boolean;
}

const Player: React.FC<PlayerProps> = ({ 
  track, isPlaying, onTogglePlay, onNext, onPrev, onSeek,
  currentTime, duration, volume, setVolume, 
  playbackRate, setPlaybackRate, isLargeText
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

  useEffect(() => {
    localStorage.setItem('zen_chant_show_vinyl', JSON.stringify(showVinyl));
  }, [showVinyl]);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  const currentLyricIndex = track.lyrics?.findIndex((l, i) => {
    const next = track.lyrics?.[i + 1];
    return currentTime >= l.time && (!next || currentTime < next.time);
  }) ?? -1;

  useEffect(() => {
    if (showLyrics && lyricsContainerRef.current && currentLyricIndex !== -1) {
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
  }, [currentLyricIndex, showLyrics]);

  useEffect(() => {
    if (volume > 0) {
      lastVolumeRef.current = volume;
    }
  }, [volume]);

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

  return (
    <main className="flex-1 flex flex-col justify-between px-8 pt-12 pb-28 relative z-10">
      <div className="flex-1 flex flex-col justify-center items-center py-4">
        <div className="relative w-full max-w-[340px] flex items-center justify-center">
          
          <button 
            onClick={onPrev}
            className="absolute -left-10 z-30 w-14 h-14 rounded-full flex items-center justify-center text-gold-main/50 hover:text-gold-light hover:bg-white/5 active:scale-90 transition-all focus:outline-none backdrop-blur-sm border border-white/5 shadow-lg group"
            aria-label="上一曲"
          >
            <span className="material-symbols-outlined text-[40px] transition-transform group-hover:-translate-x-1">chevron_left</span>
          </button>

          <div className="relative w-64 h-64 sm:w-80 sm:h-80 perspective-1000">
            {/* 佛光背景动效 */}
            <div className={`absolute inset-0 rounded-full bg-gold-main/20 blur-[60px] transition-all duration-1000 ${isPlaying ? 'scale-125 opacity-40 animate-aura-breath' : 'scale-95 opacity-0'}`}></div>
            
            <div 
              onClick={() => setShowLyrics(!showLyrics)}
              className={`relative w-full h-full transition-all duration-700 preserve-3d cursor-pointer ${showLyrics ? 'rotate-y-180' : ''}`}
            >
              {/* 正面：佛像图片或唱片 */}
              <div className="absolute inset-0 backface-hidden">
                <div className="w-full h-full rounded-full gold-ring shadow-[0_0_60px_rgba(0,0,0,0.6)]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#0c0805] relative flex items-center justify-center border-[4px] border-[#1A0F08]">
                    {showVinyl ? (
                      <VinylRecord isPlaying={isPlaying} currentTime={currentTime} duration={duration} />
                    ) : (
                      <img 
                        alt={track.title}
                        className={`w-full h-full object-cover relative z-10 transition-transform duration-[10000ms] ease-in-out ${isPlaying ? 'scale-110 rotate-2' : 'scale-100 rotate-0'}`} 
                        src={track.imageUrl} 
                      />
                    )}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-20"></div>
                  </div>
                </div>
                {/* 翻转提示 */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[10px] text-gold-main/40 font-serif tracking-widest animate-pulse">
                  <span className="material-symbols-outlined text-xs">menu_book</span>
                  <span>点击查看歌词</span>
                </div>
              </div>

              {/* 反面：经文歌词 */}
              <div className="absolute inset-0 backface-hidden rotate-y-180">
                <div className="w-full h-full rounded-full gold-ring shadow-[0_0_60px_rgba(0,0,0,0.6)]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#150f0a] relative flex flex-col items-center justify-center border-[4px] border-[#1A0F08] p-1">
                    <div className="absolute inset-0 bg-wood-grain opacity-10 pointer-events-none"></div>
                    
                    <div 
                      ref={lyricsContainerRef}
                      className="w-full h-full overflow-y-auto scrollbar-hide flex flex-col items-center pt-[50%] pb-[50%] px-8 space-y-6 relative"
                    >
                      {track.lyrics && track.lyrics.length > 0 ? (
                        track.lyrics.map((line, idx) => {
                          const isCurrent = idx === currentLyricIndex;
                          const hasPinyin = line.text.includes('\n');
                          const parts = hasPinyin ? line.text.split('\n') : [line.text];
                          
                          return (
                            <div 
                              key={idx}
                              className={`text-center transition-all duration-500 font-serif tracking-widest px-4 flex flex-col items-center justify-center max-w-full break-words ${
                                isCurrent 
                                  ? 'text-gold-light scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]' 
                                  : 'text-stone-600 opacity-40'
                              }`}
                            >
                              {hasPinyin ? (
                                <>
                                  <span 
                                    className={`block tracking-normal leading-tight mb-1 transition-all duration-500 ${
                                      isCurrent ? 'font-medium opacity-90' : 'opacity-60'
                                    }`}
                                    style={{ 
                                      fontSize: isCurrent 
                                        ? 'clamp(0.875rem, 4vw, 1.5rem)' 
                                        : 'clamp(0.75rem, 2.5vw, 1rem)' 
                                    }}
                                  >
                                    {parts[0]}
                                  </span>
                                  <span 
                                    className={`block leading-tight transition-all duration-500 ${
                                      parts[1].length <= 10 ? 'whitespace-nowrap' : 'whitespace-normal'
                                    } ${isCurrent ? 'font-bold' : ''}`}
                                    style={{ 
                                      fontSize: isCurrent 
                                        ? 'clamp(0.875rem, 4vw, 1.5rem)' 
                                        : 'clamp(0.75rem, 2.5vw, 1rem)' 
                                    }}
                                  >
                                    {parts[1]}
                                  </span>
                                </>
                              ) : (
                                <span 
                                  className={`block leading-tight transition-all duration-500 ${
                                    line.text.length <= 10 ? 'whitespace-nowrap' : 'whitespace-normal'
                                  } ${isCurrent ? 'font-bold' : ''}`}
                                  style={{ 
                                    fontSize: isCurrent 
                                      ? 'clamp(0.875rem, 4vw, 1.5rem)' 
                                      : 'clamp(0.75rem, 2.5vw, 1rem)' 
                                  }}
                                >
                                  {line.text}
                                </span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-600 font-serif italic text-sm space-y-2">
                          <span className="material-symbols-outlined text-3xl opacity-20">auto_stories</span>
                          <p>暂无歌词内容</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* 翻转提示 */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[10px] text-gold-main/40 font-serif tracking-widest animate-pulse">
                  <span className="material-symbols-outlined text-xs">image</span>
                  <span>点击返回唱片</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={onNext}
            className="absolute -right-10 z-30 w-14 h-14 rounded-full flex items-center justify-center text-gold-main/50 hover:text-gold-light hover:bg-white/5 active:scale-90 transition-all focus:outline-none backdrop-blur-sm border border-white/5 shadow-lg group"
            aria-label="下一曲"
          >
            <span className="material-symbols-outlined text-[40px] transition-transform group-hover:translate-x-1">chevron_right</span>
          </button>
        </div>

        <div className="mt-12 text-center space-y-3 relative">
          <h2 className={`text-gold-glow font-bold tracking-[0.25em] font-serif transition-all duration-500 ${isLargeText ? 'text-4xl' : 'text-2xl'}`}>
            {track.title}
          </h2>
          <p className={`text-stone-500 font-light tracking-[0.2em] font-serif italic opacity-80 ${isLargeText ? 'text-lg' : 'text-sm'}`}>
            {track.subtitle}
          </p>
        </div>
      </div>

      <div className="w-full max-w-[320px] mx-auto space-y-6 relative">
        {/* 倍速调节弹出菜单 */}
        {showSpeedMenu && (
          <div className="absolute bottom-24 left-0 right-0 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 px-4">
            <div className="glass-panel rounded-2xl p-6 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-gold-main/10 max-w-[280px] mx-auto">
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

              <div className="flex justify-between px-2">
                {[0.8, 1.0, 1.2, 1.5].map(rate => (
                  <button 
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    className={`text-[10px] px-2 py-1 rounded transition-colors ${playbackRate === rate ? 'text-gold-main bg-gold-main/10' : 'text-stone-500 hover:text-stone-300'}`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
            {/* 装饰性小三角 - 居中指向按钮 */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1a140f] rotate-45 border-r border-b border-white/5"></div>
          </div>
        )}

        <div className="space-y-4">
          <div className="relative h-1.5 w-full bg-stone-900/80 rounded-full overflow-visible">
            <input 
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            <div 
              className="absolute top-0 left-0 h-full bg-gold-metal shadow-[0_0_15px_rgba(212,175,55,0.7)] transition-all duration-300 rounded-full" 
              style={{ width: `${progressPercent}%` }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] transition-all duration-300"
              style={{ left: `${progressPercent}%`, transform: `translate(-50%, -50%)` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-stone-600 font-display tracking-widest font-bold">
            <span>{formatSeconds(currentTime)}</span>
            <span>{formatSeconds(duration)}</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            {isPlaying && (
              <div className="absolute inset-0 rounded-full border-2 border-gold-main/10 animate-[ping_3s_linear_infinite] scale-150 pointer-events-none"></div>
            )}
            <button 
              onClick={onTogglePlay}
              className="relative w-24 h-24 rounded-full bg-gold-metal flex items-center justify-center shadow-[0_15px_45px_rgba(0,0,0,0.7),inset_0_-4px_8px_rgba(0,0,0,0.4)] active:scale-95 transition-all border-4 border-[#2C1E12] z-10 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <span className="material-symbols-outlined text-[#3d2b1f] text-[68px] select-none transition-transform group-hover:scale-110">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
          </div>

          <div className="w-full space-y-2">
            {/* 功能控制条 - 唱片切换 & 倍速调节 */}
            <div className="flex justify-center gap-4 px-2">
              <button 
                onClick={() => setShowVinyl(!showVinyl)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all duration-300 backdrop-blur-xl active:scale-95 ${
                  showVinyl 
                    ? 'bg-gold-main/20 border-gold-main/30 text-gold-light shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                    : 'bg-black/40 border-white/5 text-stone-400 hover:text-stone-200'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {showVinyl ? 'album' : 'image'}
                </span>
                <span className="text-xs font-bold tracking-widest font-serif">
                  {showVinyl ? '唱片' : '佛像'}
                </span>
              </button>

              <button 
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all duration-300 backdrop-blur-xl active:scale-95 ${
                  showSpeedMenu 
                    ? 'bg-gold-main/20 border-gold-main/30 text-gold-light shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                    : 'bg-black/40 border-white/5 text-stone-400 hover:text-stone-200'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  speed
                </span>
                <span className="text-xs font-bold tracking-widest font-serif">
                  {playbackRate.toFixed(1)}x
                </span>
              </button>
            </div>

            <div className="w-full flex items-center gap-4 px-5 py-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-inner group">
              <button 
                onClick={handleMuteToggle}
                className="flex items-center justify-center focus:outline-none transition-transform active:scale-90"
                title={volume === 0 ? "取消静音" : "静音"}
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
          </div>
        </div>
      </div>
    </main>
  );
};

export default Player;
