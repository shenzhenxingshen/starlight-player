
import React from 'react';
import { Track } from '../types';

interface SettingsProps {
  currentTrack: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onUpdateTarget: (target: number) => void;
  onStopTask: () => void;
  taskProgress: number;
  taskTarget: number;
  currentTime: number;
  duration: number;
  isLargeText?: boolean;
}

const Settings: React.FC<SettingsProps> = ({ 
  currentTrack, isPlaying, onTogglePlay, onNext, onPrev, onUpdateTarget, onStopTask, 
  taskProgress, taskTarget, currentTime, duration, isLargeText 
}) => {
  const presets = [7, 21, 49, 108];
  const isTaskActive = taskTarget > 0;

  const size = 300;
  const radius = 110;
  const center = size / 2;
  const dashArray = 2 * Math.PI * radius;
  
  const currentRepProgress = duration > 0 ? currentTime / duration : 0;
  const totalProgressRatio = isTaskActive 
    ? Math.min(((taskProgress - 1) + currentRepProgress) / taskTarget, 1) 
    : 0;

  const dashOffset = dashArray * (1 - totalProgressRatio);

  const renderTicks = () => {
    if (!isTaskActive) return null;
    const ticks = [];
    const n = taskTarget;
    for (let i = 0; i < n; i++) {
      const angle = (i * 360 / n) - 90;
      const angleRad = (angle * Math.PI) / 180;
      const innerR = radius - 8;
      const outerR = radius + 2;
      const x1 = center + innerR * Math.cos(angleRad);
      const y1 = center + innerR * Math.sin(angleRad);
      const x2 = center + outerR * Math.cos(angleRad);
      const y2 = center + outerR * Math.sin(angleRad);
      const tickProgressRatio = i / n;
      const isPassed = totalProgressRatio >= tickProgressRatio;
      const isCurrent = i === (taskProgress - 1);
      ticks.push(
        <line 
          key={i} 
          x1={x1} y1={y1} x2={x2} y2={y2} 
          stroke={isPassed ? "#D4AF37" : (isCurrent ? "#F9Eea5" : "rgba(212, 175, 55, 0.1)")} 
          strokeWidth={isPassed ? "2" : "1"} 
          strokeLinecap="round" 
        />
      );
    }
    return ticks;
  };

  return (
    <div className="flex-1 flex flex-col bg-zen-dark pb-32 overflow-x-hidden pt-16">
      <div className="flex-1 flex flex-col items-center justify-around px-6">
        {/* 顶部选曲状态 */}
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="flex items-center justify-between w-full max-w-[320px]">
            <button onClick={onPrev} className="w-10 h-10 rounded-full flex items-center justify-center text-gold-dark/40 hover:text-gold-main active:scale-90 transition-all">
              <span className="material-symbols-outlined text-4xl">chevron_left</span>
            </button>
            <div className="relative">
              <div className={`w-24 h-24 rounded-full border-2 p-1 bg-[#0c0805] overflow-hidden relative z-10 transition-all duration-500 ${isTaskActive ? 'border-gold-main' : 'border-white/10'}`}>
                <img className="w-full h-full rounded-full object-cover grayscale-[0.1]" src={currentTrack.imageUrl} alt={currentTrack.title} />
              </div>
            </div>
            <button onClick={onNext} className="w-10 h-10 rounded-full flex items-center justify-center text-gold-dark/40 hover:text-gold-main active:scale-90 transition-all">
              <span className="material-symbols-outlined text-4xl">chevron_right</span>
            </button>
          </div>
          <div className="text-center">
            <h3 className={`text-gold-light font-bold tracking-[0.2em] font-serif transition-all ${isLargeText ? 'text-3xl' : 'text-xl'}`}>{currentTrack.title}</h3>
            <p className={`text-stone-600 mt-1 tracking-[0.4em] font-serif uppercase opacity-60 transition-all ${isLargeText ? 'text-sm' : 'text-[10px]'}`}>念佛持咒，精进修行</p>
          </div>
        </div>

        {/* 核心进度圆环 */}
        <div className="relative flex flex-col items-center">
          <div 
            className="relative flex items-center justify-center cursor-pointer group"
            style={{ width: size, height: size }}
            onClick={() => isTaskActive ? onTogglePlay() : null}
          >
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
              <defs>
                <linearGradient id="goldProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fcf6ba" /><stop offset="50%" stopColor="#bf953f" /><stop offset="100%" stopColor="#aa771c" />
                </linearGradient>
              </defs>
              <circle cx={center} cy={center} r={radius} fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
              {renderTicks()}
              <circle 
                cx={center} cy={center} r={radius} fill="transparent" 
                stroke="url(#goldProgressGrad)" strokeWidth="5" 
                strokeDasharray={dashArray} strokeDashoffset={dashOffset} 
                strokeLinecap="round" transform={`rotate(-90 ${center} ${center})`} 
                className={`transition-all duration-150 ease-linear ${!isPlaying && isTaskActive ? 'animate-pulse-gentle opacity-60' : ''}`} 
              />
            </svg>
            
            <div className="flex flex-col items-center z-10 select-none">
              <div className="flex items-baseline gap-1">
                <span className={`font-bold text-transparent bg-clip-text bg-gold-metal tracking-tighter drop-shadow-2xl transition-all ${isLargeText ? 'text-8xl' : 'text-7xl'}`}>
                  {taskProgress || 0}
                </span>
                {isTaskActive && <span className={`font-semibold text-gold-main/20 transition-all ${isLargeText ? 'text-3xl' : 'text-2xl'}`}>/{taskTarget}</span>}
              </div>
              
              {isTaskActive ? (
                <div className="mt-4 flex flex-col items-center">
                   <span className="material-symbols-outlined text-gold-main/60 text-2xl animate-pulse">
                     {isPlaying ? 'pause' : 'play_arrow'}
                   </span>
                   <p className={`font-bold text-gold-main/50 mt-1 uppercase tracking-[0.6em] font-serif transition-all ${isLargeText ? 'text-sm' : 'text-[10px]'}`}>
                     {isPlaying ? '正在播放' : '已暂停'}
                   </p>
                </div>
              ) : (
                <p className={`font-bold text-gold-main/50 mt-4 uppercase tracking-[0.6em] font-serif transition-all ${isLargeText ? 'text-sm' : 'text-[10px]'}`}>请设定遍数</p>
              )}
            </div>
          </div>

          {/* 停止/重置按钮 - 仅在任务激活时显示 */}
          {isTaskActive && (
            <button 
              onClick={(e) => { e.stopPropagation(); onStopTask(); }}
              className={`mt-4 px-6 py-2 rounded-full border border-gold-dark/20 text-stone-600 font-serif tracking-[0.4em] uppercase hover:text-gold-main hover:border-gold-main/40 transition-all flex items-center gap-2 ${isLargeText ? 'text-sm' : 'text-[10px]'}`}
            >
              <span className="material-symbols-outlined text-sm">stop</span>
              结束本轮播放
            </button>
          )}
        </div>

        {/* 快速设定按钮 */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-[340px] px-2 mb-4">
          {presets.map((p) => (
            <button key={p} onClick={() => onUpdateTarget(p)} className={`h-16 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border font-serif active:scale-95 relative overflow-hidden group ${taskTarget === p ? 'bg-gold-metal text-[#3d2b1f] border-gold-light font-bold shadow-xl' : 'bg-white/[0.02] text-stone-500 border-white/5 hover:bg-white/[0.05]'}`}>
              <span className={`tracking-widest relative z-10 transition-all ${isLargeText ? 'text-2xl' : 'text-xl'}`}>{p}遍</span>
            </button>
          ))}
        </div>
        <div className={`mt-2 text-stone-700 tracking-[0.4em] font-serif text-center opacity-40 italic transition-all ${isLargeText ? 'text-sm' : 'text-[10px]'}`}>都摄六根，净念相继</div>
      </div>
    </div>
  );
};

export default Settings;
