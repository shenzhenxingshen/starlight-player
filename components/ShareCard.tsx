
import React from 'react';
import { ZenQuote } from '../services/zenQuoteService';

interface ShareCardProps {
  quote: ZenQuote;
  onClose: () => void;
}

const ShareCard: React.FC<ShareCardProps> = ({ quote, onClose }) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-[320px] flex flex-col items-center">
        {/* 分享卡正文 */}
        <div className="w-full bg-[#1a1208] border border-gold-dark/30 rounded-3xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative p-8 flex flex-col min-h-[480px]">
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-wood-grain opacity-10 pointer-events-none"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold-main/5 blur-[60px] rounded-full"></div>
          
          {/* 顶部 Logo - 修改：使用 scale-105 放大图片，视觉更加充盈 */}
          <div className="flex flex-col items-center mb-10 relative z-10">
            <div className="relative group">
              {/* 光晕形状同步调整为圆角矩形 */}
              <div className="absolute inset-0 bg-gold-main/20 blur-2xl rounded-[28%] scale-110"></div>
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl relative z-10 border border-gold-main/20 bg-black/40">
                <img 
                  src="https://shouyueliangplayermp3.s3.cn-south-1.jdcloud-oss.com/nianfoji-logo-v6.png" 
                  alt="守月亮念佛机 Logo" 
                  className="w-full h-full object-cover block scale-110 transition-transform duration-700"
                />
              </div>
            </div>
            <p className="text-gold-main/40 text-[9px] tracking-[0.6em] font-serif uppercase mt-4">守月亮念佛机</p>
          </div>

          {/* 语录内容 */}
          <div className="flex-1 flex flex-col justify-center relative z-10">
            <span className="text-gold-main/10 text-6xl font-serif absolute -top-8 -left-4">“</span>
            <p className="text-stone-200 text-2xl font-serif leading-[1.8] tracking-[0.1em] text-center px-4">
              {quote.text}
            </p>
            <div className="mt-12 flex flex-col items-end">
              <div className="w-8 h-[1px] bg-gold-main/30 mb-2"></div>
              <p className="text-gold-main/50 text-xs font-serif tracking-widest">
                {quote.source}
              </p>
            </div>
            <span className="text-gold-main/10 text-6xl font-serif absolute -bottom-8 -right-4 rotate-180">“</span>
          </div>

          {/* 底部装饰 */}
          <div className="mt-12 pt-6 border-t border-gold-dark/10 flex flex-col items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full border border-gold-main/20"></div>
              <p className="text-stone-600 text-[9px] tracking-[0.4em] font-serif uppercase">净土 · 语录</p>
              <div className="w-2 h-2 rounded-full border border-gold-main/20"></div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-8 flex gap-4 w-full">
          <button 
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl border border-white/10 text-stone-500 font-serif text-sm tracking-widest hover:bg-white/5 transition-colors"
          >
            返回
          </button>
          <button 
            onClick={() => alert("请截屏保存当前卡片，或直接分享链接给好友。")}
            className="flex-[2] py-4 rounded-2xl bg-gold-metal text-[#3d2b1f] font-bold font-serif text-sm tracking-widest shadow-xl active:scale-95 transition-all"
          >
            保存卡片
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareCard;
