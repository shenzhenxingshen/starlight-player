
import React, { useEffect, useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateLogo = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = "A high-end, minimalist Zen app logo. A golden circular emblem containing a crescent moon and a silhouette of a lotus flower. Minimalist lines. Luxurious gold metallic texture. Deep matte black background. The aesthetic is serene, spiritual and premium.";
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1"
            }
          }
        });

        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (part?.inlineData) {
          setLogoUrl(`data:image/png;base64,${part.inlineData.data}`);
        }
      } catch (error) {
        console.error("Logo generation failed:", error);
      } finally {
        setLoading(false);
        // 展示 3 秒后自动进入
        setTimeout(onComplete, 3500);
      }
    };

    generateLogo();
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0705] flex flex-col items-center justify-center overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-20 bg-wood-grain mix-blend-overlay"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-main/5 blur-[120px] rounded-full animate-aura-breath"></div>

      <div className="relative z-10 flex flex-col items-center space-y-12">
        <div className="relative w-48 h-48 flex items-center justify-center">
          {loading ? (
            <div className="w-16 h-16 border-2 border-gold-main/20 border-t-gold-main rounded-full animate-spin"></div>
          ) : logoUrl ? (
            <div className="relative group animate-in fade-in zoom-in duration-1000">
              <div className="absolute inset-0 bg-gold-main/20 blur-2xl group-hover:blur-3xl transition-all duration-1000 rounded-full"></div>
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-40 h-40 rounded-full border border-gold-main/30 shadow-2xl relative z-10 grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
              />
            </div>
          ) : (
             <span className="material-symbols-outlined text-7xl text-gold-main/50 animate-pulse">brightness_2</span>
          )}
        </div>

        <div className="text-center space-y-4 animate-in slide-in-from-bottom-8 duration-1000 delay-300">
          <h1 className="text-gold-light text-4xl font-bold tracking-[0.5em] font-serif drop-shadow-2xl">
            守月亮
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-gold-dark"></div>
            <p className="text-gold-main/60 text-xs tracking-[0.8em] font-serif uppercase">念佛机</p>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-gold-dark"></div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 text-stone-800 text-[10px] tracking-[0.5em] font-serif uppercase opacity-40">
        Pure Mind · Serene Light
      </div>
    </div>
  );
};

export default SplashScreen;
