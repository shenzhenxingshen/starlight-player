// 生成离线化所需的配置文件
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');

console.log('生成离线化配置文件...\n');

// 1. 生成 tailwind.config.js
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "zen-brown": "#2C1E12",
        "zen-dark": "#1A0F08",
        "gold-light": "#F9Eea5",
        "gold-main": "#D4AF37",
        "gold-dark": "#8C6A28",
        "amber-glow": "rgba(255, 191, 0, 0.3)",
        "background-dark": "#1a1208",
        "surface-dark": "#2a2118",
      },
      fontFamily: {
        "serif": ["Noto Serif SC", "serif"],
        "calligraphy": ["Ma Shan Zheng", "cursive"],
        "display": ["Inter", "sans-serif"]
      },
      backgroundImage: {
        'wood-grain': "url('data:image/svg+xml,%3Csvg width=\\\\'100\\\\' height=\\\\'100\\\\' viewBox=\\\\'0 0 100 100\\\\' xmlns=\\\\'http://www.w3.org/2000/svg\\\\'%3E%3Cfilter id=\\\\'noise\\\\'%3E%3CfeTurbulence type=\\\\'fractalNoise\\\\' baseFrequency=\\\\'0.8\\\\' numOctaves=\\\\'3\\\\' stitchTiles=\\\\'stitch\\\\'/%3E%3C/filter%3E%3Crect width=\\\\'100\\\\' height=\\\\'100\\\\' filter=\\\\'url(%23noise)\\\\' opacity=\\\\'0.08\\\\'/%3E%3C/svg%3E')",
        'gold-metal': "linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%)",
        'dark-gradient': 'linear-gradient(to bottom, #221b10, #1a1208)',
      },
      animation: {
        'spin-slow': 'spin 60s linear infinite',
        'pulse-gentle': 'pulse-gentle 4s ease-in-out infinite',
        'aura-breath': 'aura-breath 6s ease-in-out infinite',
        'smoke-flow': 'smoke-flow 20s linear infinite',
        'lotus-float': 'lotus-float 8s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-gentle': {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 0.8 },
        },
        'aura-breath': {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.1 },
          '50%': { transform: 'scale(1.15)', opacity: 0.3 },
        },
        'smoke-flow': {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: 0 },
          '10%': { opacity: 0.4 },
          '50%': { transform: 'translate(10%, -10%) scale(1.1)', opacity: 0.3 },
          '90%': { opacity: 0.4 },
          '100%': { transform: 'translate(20%, -20%) scale(1.2)', opacity: 0 },
        },
        'lotus-float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        'glow-pulse': {
          '0%, 100%': { textShadow: '0 0 10px rgba(212, 175, 55, 0.4)' },
          '50%': { textShadow: '0 0 25px rgba(212, 175, 55, 0.9), 0 0 10px rgba(212, 175, 55, 0.5)' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
`;

fs.writeFileSync(path.join(PROJECT_ROOT, 'tailwind.config.js'), tailwindConfig);
console.log('✅ 生成 tailwind.config.js');

// 2. 生成 src/index.css
const indexCSS = `/* 本地字体声明 */
@font-face {
  font-family: 'Noto Serif SC';
  font-style: normal;
  font-weight: 400;
  src: url('/fonts/NotoSerifSC-Regular.woff2') format('woff2');
  font-display: swap;
}

@font-face {
  font-family: 'Noto Serif SC';
  font-style: normal;
  font-weight: 700;
  src: url('/fonts/NotoSerifSC-Bold.woff2') format('woff2');
  font-display: swap;
}

@font-face {
  font-family: 'Ma Shan Zheng';
  font-style: normal;
  font-weight: 400;
  src: url('/fonts/MaShanZheng-Regular.woff2') format('woff2');
  font-display: swap;
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  src: url('/fonts/Inter-Regular.woff2') format('woff2');
  font-display: swap;
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 700;
  src: url('/fonts/Inter-Bold.woff2') format('woff2');
  font-display: swap;
}

@font-face {
  font-family: 'Material Symbols Outlined';
  font-style: normal;
  font-weight: 100 700;
  src: url('/fonts/MaterialSymbolsOutlined.woff2') format('woff2');
  font-display: block;
}

.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
}

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .text-gold {
    background: linear-gradient(to bottom, #F9Eea5, #D4AF37);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .text-gold-glow {
    @apply animate-glow-pulse;
    color: #F9Eea5;
  }
  .metal-btn {
    background: linear-gradient(145deg, #2a1f16, #150f0a);
    box-shadow: 5px 5px 10px #0b0805, -5px -5px 10px #35261b;
    border: 1px solid rgba(212, 175, 55, 0.1);
  }
  .glass-panel {
    @apply bg-white/[0.03] backdrop-blur-2xl border border-white/10;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
    position: relative;
    overflow: hidden;
  }
  .glass-panel::after {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.03) 50%,
      transparent 70%
    );
    transform: rotate(45deg);
    pointer-events: none;
  }
}
`;

fs.mkdirSync(path.join(PROJECT_ROOT, 'src'), { recursive: true });
fs.writeFileSync(path.join(PROJECT_ROOT, 'src/index.css'), indexCSS);
console.log('✅ 生成 src/index.css');

// 3. 备份并修改 constants.tsx
const constantsPath = path.join(PROJECT_ROOT, 'constants.tsx');
const constantsBackup = path.join(PROJECT_ROOT, 'constants.tsx.backup');

if (fs.existsSync(constantsPath)) {
  fs.copyFileSync(constantsPath, constantsBackup);
  console.log('✅ 备份 constants.tsx -> constants.tsx.backup');
  
  let content = fs.readFileSync(constantsPath, 'utf8');
  
  // 替换图片URL
  content = content.replace(
    /const IMAGE_\w+ = 'https:\/\/www\.shouyueliang\.org[^']+';/g,
    "const IMAGE_COVER = '/assets/images/cover.gif';"
  );
  content = content.replace(/IMAGE_DABEI|IMAGE_AMITABHA|IMAGE_GUANYIN|IMAGE_SONG/g, 'IMAGE_COVER');
  
  // 替换音频URL
  content = content.replace(
    /audioUrl: 'https:\/\/shouyueliangplayermp3\.s3\.cn-south-1\.jdcloud-oss\.com\/mp3\/([^']+)'/g,
    (match, filename) => {
      const decoded = decodeURIComponent(filename);
      return `audioUrl: '/assets/audio/${decoded}'`;
    }
  );
  
  fs.writeFileSync(constantsPath, content);
  console.log('✅ 修改 constants.tsx 使用本地路径');
}

// 4. 备份并修改 index.html
const indexHtmlPath = path.join(PROJECT_ROOT, 'index.html');
const indexHtmlBackup = path.join(PROJECT_ROOT, 'index.html.backup');

if (fs.existsSync(indexHtmlPath)) {
  fs.copyFileSync(indexHtmlPath, indexHtmlBackup);
  console.log('✅ 备份 index.html -> index.html.backup');
  
  const newIndexHtml = `<!DOCTYPE html>
<html lang="zh-CN" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>守月亮念佛机</title>
    <meta name="description" content="守月亮念佛机 - 完全离线版">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
</body>
</html>`;
  
  fs.writeFileSync(indexHtmlPath, newIndexHtml);
  console.log('✅ 修改 index.html 移除CDN引用');
}

// 5. 修改 index.tsx 引入CSS
const indexTsxPath = path.join(PROJECT_ROOT, 'index.tsx');
if (fs.existsSync(indexTsxPath)) {
  let content = fs.readFileSync(indexTsxPath, 'utf8');
  if (!content.includes("import './src/index.css'")) {
    content = "import './src/index.css';\n" + content;
    fs.writeFileSync(indexTsxPath, content);
    console.log('✅ 修改 index.tsx 引入CSS');
  }
}

console.log('\n========================================');
console.log('✅ 配置文件生成完成！');
console.log('========================================\n');
console.log('📋 下一步操作:');
console.log('1. 运行 npm install 安装依赖');
console.log('2. 运行 npm run build 构建离线版本');
console.log('3. 运行 npm run preview 预览离线版本\n');
