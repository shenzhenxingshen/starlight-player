
import React from 'react';
import { View } from '../types';

interface BottomNavProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onViewChange }) => {
  const items = [
    { id: View.PLAYER, label: '播放', icon: 'play_circle' },
    { id: View.PLAYLIST, label: '曲目', icon: 'library_music' },
    { id: View.TIMER, label: '定时', icon: 'timer' },
    { id: View.PROFILE, label: '我的', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 bg-[#130b06]/95 border-t border-gold-dark/20 px-8 pt-4 pb-8 flex justify-between items-center backdrop-blur-md z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <span className={`material-symbols-outlined text-[26px] transition-transform group-active:scale-90 ${activeView === item.id ? 'text-gold-main fill-1' : 'text-stone-600 group-hover:text-gold-dark/80'}`}>
            {item.icon}
          </span>
          <span className={`text-[10px] font-medium tracking-widest font-serif ${activeView === item.id ? 'text-gold-main' : 'text-stone-600 group-hover:text-gold-dark/80'}`}>
            {item.label}
          </span>
        </div>
      ))}
    </nav>
  );
};

export default BottomNav;
