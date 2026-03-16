
import React, { useEffect, useState } from 'react';

interface MeritAnimationProps {
  onComplete: () => void;
}

const MeritAnimation: React.FC<MeritAnimationProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'outro'>('intro');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('active'), 100);
    const t2 = setTimeout(() => setPhase('outro'), 3500);
    const t3 = setTimeout(onComplete, 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-700 ${phase === 'outro' ? 'opacity-0' : 'opacity-100'}`}>
      {/* 佛光背景 */}
      <div className={`absolute w-[400px] h-[400px] bg-gold-main/20 blur-[120px] rounded-full transition-transform duration-1000 ${phase === 'active' ? 'scale-150' : 'scale-50'}`}></div>
      
      {/* 金色莲花图标 */}
      <div className={`relative mb-8 transition-all duration-1000 ${phase === 'active' ? 'scale-110 opacity-100' : 'scale-50 opacity-0'}`}>
        <span className="material-symbols-outlined text-9xl text-gold-main animate-lotus-float" style={{ fontVariationSettings: "'FILL' 1" }}>
          filter_vintage
        </span>
        <div className="absolute inset-0 bg-gold-main/40 blur-3xl animate-pulse"></div>
      </div>

      <div className={`text-center space-y-4 transition-all duration-1000 delay-300 ${phase === 'active' ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <h2 className="text-gold-light text-4xl font-bold tracking-[0.5em] font-serif drop-shadow-2xl">随喜赞叹</h2>
        <div className="flex items-center justify-center gap-4">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-gold-dark"></div>
          <p className="text-gold-main/60 text-xs tracking-[0.8em] font-serif uppercase">播放结束</p>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-gold-dark"></div>
        </div>
      </div>

      <div className="absolute bottom-20 text-stone-500 text-[10px] tracking-[0.5em] font-serif uppercase animate-pulse">
        都摄六根 · 净念相继
      </div>
    </div>
  );
};

export default MeritAnimation;
