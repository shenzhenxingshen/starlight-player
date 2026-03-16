import React from 'react';

interface VinylRecordProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

const VinylRecord: React.FC<VinylRecordProps> = ({ isPlaying, currentTime, duration }) => {
  // 计算进度百分比 (0 到 1)
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
  
  // 映射进度到旋转角度：从 12 度 (外圈) 到 30 度 (内圈)
  const rotationAngle = 12 + (progress * 18);
  
  // 轨道亮度随进度变化 (0.2 到 0.7)
  const trackOpacity = 0.2 + (progress * 0.5);

  return (
    <div className="w-full h-full rounded-full bg-[#1A1A1A] border-[8px] border-[#333] flex items-center justify-center relative shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden">
      {/* 呼吸灯效果 */}
      {isPlaying && (
        <div className="absolute inset-0 rounded-full border-2 border-gold-main/30 animate-breathing"></div>
      )}

      {/* 唱片纹理 - 亮度随进度变化 */}
      <div className="absolute inset-2 rounded-full border border-white transition-opacity duration-300" style={{ opacity: trackOpacity * 0.4 }}></div>
      <div className="absolute inset-4 rounded-full border border-white transition-opacity duration-300" style={{ opacity: trackOpacity * 0.6 }}></div>
      <div className="absolute inset-6 rounded-full border border-white transition-opacity duration-300" style={{ opacity: trackOpacity * 0.8 }}></div>
      <div className="absolute inset-8 rounded-full border border-white transition-opacity duration-300" style={{ opacity: trackOpacity }}></div>
      
      {/* 中间标签 */}
      <div className="w-20 h-20 rounded-full bg-gold-main flex items-center justify-center relative z-10">
        <div className="w-4 h-4 rounded-full bg-[#1A1A1A]"></div>
      </div>

      {/* 播放臂和唱针 */}
      <div 
        className="absolute top-0 right-0 w-full h-full origin-top-right transition-transform duration-300 ease-linear"
        style={{ transform: `rotate(${isPlaying ? rotationAngle : 0}deg)` }}
      >
        {/* 臂 - 增加长度并调整位置 */}
        <div className="absolute top-0 right-0 w-48 h-2 bg-stone-400 rounded-full origin-right -rotate-45 translate-x-16 -translate-y-16"></div>
        {/* 针 - 调整位置 */}
        <div className="absolute top-0 right-0 w-4 h-10 bg-stone-600 rounded-sm origin-top-right -rotate-45 translate-x-40 translate-y-8"></div>
      </div>

      {/* 动画定义 */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin 4s linear infinite;
        }
        @keyframes breathing {
          0%, 100% { opacity: 0.3; transform: scale(0.95); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-breathing {
          animation: breathing 3s ease-in-out infinite;
        }
      `}</style>
      <div className={`absolute inset-0 rounded-full ${isPlaying ? 'animate-spin-slow' : ''}`}></div>
    </div>
  );
};

export default VinylRecord;
