
import React from 'react';
import { TRACKS } from '../constants';
import { ZenQuote } from '../services/zenQuoteService';
import { FEATURE_FLAGS } from '../constants/featureFlags';

interface ProfileProps {
  stats: {
    installDate: string;
    totalCompletions: number;
    dailyLogs: { [date: string]: { [trackId: string]: number } };
  };
  zenQuote: ZenQuote;
  onRefreshQuote: () => void;
  isLargeText: boolean;
  onToggleLargeText: () => void;
  onOpenShare: () => void;
}

const Profile: React.FC<ProfileProps> = ({ 
  stats, 
  zenQuote, 
  onRefreshQuote, 
  isLargeText, 
  onToggleLargeText, 
  onOpenShare 
}) => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayStats: Record<string, number> = stats.dailyLogs[today] || {};
  const showProfileHeader = !FEATURE_FLAGS.HIDE_PROFILE_HEADER;
  const showProfileQuote = !FEATURE_FLAGS.HIDE_PROFILE_QUOTE;
  
  const calculateDays = () => {
    const start = new Date(stats.installDate).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return diff + 1;
  };

  const todayItems = (Object.entries(todayStats) as [string, number][])
    .map(([trackId, count]) => {
      const track = TRACKS.find(t => t.id === trackId);
      return {
        title: track?.title || '自定义曲目',
        subtitle: track?.subtitle || '',
        count
      };
    })
    .sort((a, b) => b.count - a.count);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto pb-32 pt-20">
      {showProfileHeader && (
        <div className="px-8 pb-12 flex flex-col items-center text-center">
          <div className="relative mb-8">
            <div className="absolute inset-[-12px] bg-gold-main/5 blur-3xl rounded-full"></div>
            <div className="w-20 h-20 rounded-full badge-texture flex items-center justify-center text-[#4a3b18] border border-gold-dark/20 shadow-xl relative z-10">
              <span className="material-symbols-outlined text-4xl font-light">person</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className={`font-bold text-gold-light tracking-[0.4em] font-serif uppercase transition-all ${isLargeText ? 'text-3xl' : 'text-xl'}`}>
              净土行人
            </h3>
            <p className={`text-stone-600 tracking-[0.2em] font-serif opacity-60 transition-all ${isLargeText ? 'text-sm' : 'text-[10px]'}`}>
              已使用此APP {calculateDays()} 日
            </p>
          </div>
        </div>
      )}

      {showProfileQuote && (
        <div className="px-10 mb-16">
          <div className="relative px-4 py-8 flex flex-col items-center">
            <span className="absolute top-0 left-0 text-gold-main/20 text-5xl font-serif">“</span>
            <div className="px-4">
              <p className={`text-stone-300 tracking-widest leading-[2] font-serif text-center transition-all ${isLargeText ? 'text-2xl' : 'text-[17px]'}`}>
                {zenQuote.text}
              </p>
              <p className={`text-gold-main/60 tracking-[0.2em] font-serif mt-6 text-right transition-all ${isLargeText ? 'text-lg' : 'text-[12px]'}`}>
                —— {zenQuote.source}
              </p>
            </div>
            <span className="absolute bottom-0 right-0 text-gold-main/20 text-5xl font-serif rotate-180">“</span>

            <div className="flex items-center justify-center gap-8 mt-10">
              <button
                onClick={onRefreshQuote}
                className={`text-stone-600 uppercase tracking-[0.4em] hover:text-gold-main transition-all flex items-center gap-1.5 ${isLargeText ? 'text-sm' : 'text-[10px]'}`}
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                刷新
              </button>
              <button
                onClick={onOpenShare}
                className={`text-stone-600 uppercase tracking-[0.4em] hover:text-gold-main transition-all flex items-center gap-1.5 ${isLargeText ? 'text-sm' : 'text-[10px]'}`}
              >
                <span className="material-symbols-outlined text-sm">share</span>
                分享
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 功课列表：只保留今日每项曲目的记录 */}
      <div className="px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
           <h4 className={`text-stone-500 font-bold tracking-[0.3em] font-serif uppercase transition-all ${isLargeText ? 'text-sm' : 'text-[11px]'}`}>今日播放记录</h4>
        </div>

        <div className="space-y-1">
          {todayItems.length > 0 ? (
            todayItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-4 group">
                <div className="flex flex-col">
                  <span className={`text-stone-200 font-serif tracking-wide group-hover:text-gold-main transition-all ${isLargeText ? 'text-lg' : 'text-base'}`}>
                    {item.title}
                  </span>
                  <span className={`text-stone-600 tracking-widest mt-1 opacity-60 transition-all ${isLargeText ? 'text-sm' : 'text-[10px]'}`}>
                    {item.subtitle}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-gold-main/80 font-display font-medium transition-all ${isLargeText ? 'text-2xl' : 'text-xl'}`}>{item.count}</span>
                  <span className={`text-stone-700 font-serif transition-all ${isLargeText ? 'text-sm' : 'text-[10px]'}`}>遍</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 flex flex-col items-center justify-center opacity-10">
               <span className="material-symbols-outlined text-3xl mb-3">quiet_times</span>
               <p className={`tracking-[0.4em] uppercase transition-all ${isLargeText ? 'text-sm' : 'text-[10px]'}`}>今日虚度，尚未用功</p>
            </div>
          )}
        </div>
      </div>

      {/* 底部设置：极简布局 */}
      <div className="mt-16 px-8 mb-8">
        <div className="pt-8 border-t border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className={`text-stone-500 font-bold tracking-[0.3em] uppercase transition-all ${isLargeText ? 'text-sm' : 'text-[11px]'}`}>大字模式</span>
            <span className={`text-stone-700 mt-1 transition-all ${isLargeText ? 'text-[10px]' : 'text-[9px]'}`}>开启后文字显示更加清晰</span>
          </div>
          <button 
            onClick={onToggleLargeText}
            className={`w-10 h-5 rounded-full transition-all relative ${isLargeText ? 'bg-gold-main/60' : 'bg-stone-900'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-stone-300 rounded-full transition-all shadow-sm ${isLargeText ? 'left-5.5 bg-white' : 'left-0.5'}`}></div>
          </button>
        </div>
      </div>

      {/* 最后的留白感 */}
      <div className="mt-8 text-center">
        <p className={`text-[#3d2b1f] tracking-[0.8em] font-serif uppercase opacity-30 transition-all ${isLargeText ? 'text-[11px]' : 'text-[9px]'}`}>
          万缘放下 · 一心念佛
        </p>
      </div>
    </div>
  );
};

export default Profile;
