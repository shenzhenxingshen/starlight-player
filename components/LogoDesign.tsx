
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface LogoDesignProps {
  onBack: () => void;
}

interface LogoOption {
  id: string;
  name: string;
  description: string;
  prompt: string;
  url: string | null;
  loading: boolean;
}

const LogoDesign: React.FC<LogoDesignProps> = ({ onBack }) => {
  const [options, setOptions] = useState<LogoOption[]>([
    {
      id: 'classic_gold',
      name: '至尊经典金',
      description: '极简线条，拉丝金属质感，彰显庄严。',
      prompt: 'A premium minimalist Zen logo. A circular golden emblem containing a crescent moon and a silhouette of a lotus flower. Luxurious brushed gold metallic texture on a deep matte black background. Spiritual and elegant.',
      url: null,
      loading: false
    },
    {
      id: 'ink_wash',
      name: '禅意水墨',
      description: '传统中式写意，宁静而致远。',
      prompt: 'A traditional Chinese ink wash style Zen logo. A soft brushstroke circle representing the moon, with a simple ink lotus in the center. High contrast black ink on white textured rice paper background. Artistic and serene.',
      url: null,
      loading: false
    },
    {
      id: 'modern_glass',
      name: '现代琉璃',
      description: '通透 3D 质感，符合现代科技美学。',
      prompt: 'A modern 3D Zen app logo. Translucent frosted glass crescent moon overlapping a glowing golden lotus icon. Soft studio lighting, elegant depth of field, premium tech aesthetic.',
      url: null,
      loading: false
    },
    {
      id: 'wood_carving',
      name: '古木雕刻',
      description: '沉香木质感，内嵌金箔，古朴厚重。',
      prompt: 'A Zen logo carved into dark sandalwood. A circular relief of a moon and lotus. Subtle gold leaf inlay in the carvings. Organic, tactile, and ancient feel.',
      url: null,
      loading: false
    }
  ]);

  const generateLogo = async (id: string) => {
    const option = options.find(o => o.id === id);
    if (!option) return;

    setOptions(prev => prev.map(o => o.id === id ? { ...o, loading: true } : o));

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: option.prompt }],
        },
        config: {
          imageConfig: { aspectRatio: "1:1" }
        }
      });

      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData) {
        const url = `data:image/png;base64,${part.inlineData.data}`;
        setOptions(prev => prev.map(o => o.id === id ? { ...o, url, loading: false } : o));
      }
    } catch (error) {
      console.error("Logo generation failed:", error);
      setOptions(prev => prev.map(o => o.id === id ? { ...o, loading: false } : o));
      alert("生成失败，请重试。");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zen-dark overflow-y-auto pb-32">
      <header className="flex items-center px-4 py-3 sticky top-0 bg-[#0f0a06]/90 backdrop-blur-md z-30 border-b border-white/5">
        <button onClick={onBack} className="text-gold-main flex size-10 items-center justify-center active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
        <h2 className="text-gold-light text-lg font-bold tracking-[0.2em] flex-1 text-center pr-10 font-serif uppercase">Logo 设计中心</h2>
      </header>

      <div className="p-6 space-y-8">
        <div className="bg-gold-main/5 border border-gold-main/20 rounded-2xl p-4">
          <p className="text-gold-main text-xs leading-relaxed font-serif">
            温馨提示：您可以分别为以下风格生成预览图。生成后，请<span className="text-white font-bold underline">长按图片或点击右键</span>，选择“图片另存为”即可下载保存到您的本地相册或电脑。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {options.map((opt) => (
            <div key={opt.id} className="bg-black/30 border border-white/5 rounded-[2.5rem] p-6 flex flex-col items-center space-y-6">
              <div className="text-center">
                <h3 className="text-gold-light text-lg font-bold tracking-widest font-serif">{opt.name}</h3>
                <p className="text-stone-500 text-[10px] mt-1 uppercase tracking-[0.2em]">{opt.description}</p>
              </div>

              <div className="relative w-48 h-48 rounded-3xl border border-gold-dark/20 bg-stone-900/50 flex items-center justify-center overflow-hidden shadow-2xl">
                {opt.loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-gold-main/20 border-t-gold-main rounded-full animate-spin"></div>
                    <span className="text-[10px] text-gold-main/50 animate-pulse">正在精绘中...</span>
                  </div>
                ) : opt.url ? (
                  <img src={opt.url} alt={opt.name} className="w-full h-full object-cover animate-in fade-in duration-700" />
                ) : (
                  <span className="material-symbols-outlined text-5xl text-stone-800">palette</span>
                )}
              </div>

              <button 
                onClick={() => generateLogo(opt.id)}
                disabled={opt.loading}
                className={`w-full py-4 rounded-2xl bg-gold-metal text-[#3d2b1f] font-bold tracking-[0.4em] font-serif transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg`}
              >
                <span className="material-symbols-outlined text-xl">auto_fix_high</span>
                {opt.url ? '重新生成' : '开始设计'}
              </button>

              {opt.url && (
                <p className="text-[9px] text-stone-600 font-serif tracking-[0.1em] text-center animate-bounce">
                  ↑ 右键或长按上方图片保存 ↑
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogoDesign;
