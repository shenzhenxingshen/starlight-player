import React, { useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // React层启动页仅作兜底，短暂展示后进入主界面
    const timer = setTimeout(onComplete, 900);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0705] flex items-center justify-center overflow-hidden">
      <img
        src="/assets/images/splash-slogan-2732.png"
        alt="念佛持咒，求生极乐"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default SplashScreen;