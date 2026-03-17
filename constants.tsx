
import { Track } from './types';
import { LYRICS_DATA } from './lyricsData';

// 本地图片资源
const IMAGE_DABEI = '/assets/images/cover.gif';
const IMAGE_AMITABHA = '/assets/images/cover.gif';
const IMAGE_GUANYIN = '/assets/images/cover.gif';
const IMAGE_SONG = '/assets/images/cover.gif';

export const TRACKS: Track[] = [
  // A: 大悲咒系列
  { 
    id: 'a01', code: 'A01', title: '大悲咒（跟我学）', subtitle: '', section: 'A', 
    imageUrl: IMAGE_DABEI, 
    audioUrl: '/assets/audio/A01 大悲咒（跟我学）.mp3',
    durationMs: 273894
  },
  { 
    id: 'a02', code: 'A02', title: '大悲咒（唱版）', subtitle: '', section: 'A', 
    imageUrl: IMAGE_DABEI, 
    audioUrl: '/assets/audio/A02 大悲咒（唱版）.mp3',
    durationMs: 174795
  },
  { 
    id: 'a03', code: 'A03', title: '大悲咒（慢版）', subtitle: '', section: 'A', 
    imageUrl: IMAGE_DABEI, 
    audioUrl: '/assets/audio/A03 大悲咒（慢版）.mp3',
    durationMs: 83235
  },
  { 
    id: 'a04', code: 'A04', title: '大悲咒（快版）', subtitle: '', section: 'A', 
    imageUrl: IMAGE_DABEI, 
    audioUrl: '/assets/audio/A04 大悲咒（快版）.mp3',
    durationMs: 60008
  },
  { 
    id: 'a05', code: 'A05', title: '大悲咒（共修版）', subtitle: '', section: 'A', 
    imageUrl: IMAGE_DABEI, 
    audioUrl: '/assets/audio/A05 大悲咒（共修版）.mp3',
    durationMs: 70134
  },

  // B: 仪轨回向
  { 
    id: 'b06', code: 'B06', title: '发愿回向文', subtitle: '', section: 'B', 
    imageUrl: IMAGE_GUANYIN, 
    audioUrl: '/assets/audio/B06 发愿回向文.mp3',
    durationMs: 79944
  },

  // C: 佛号圣号
  { 
    id: 'c07', code: 'C07', title: '南无阿弥陀佛（唱版）', subtitle: '', section: 'C', 
    imageUrl: IMAGE_AMITABHA, 
    audioUrl: '/assets/audio/C07 南无阿弥陀佛（唱版）.mp3',
    durationMs: 608888
  },
  { 
    id: 'c08', code: 'C08', title: '南无阿弥陀佛（慢版）', subtitle: '', section: 'C', 
    imageUrl: IMAGE_AMITABHA, 
    audioUrl: '/assets/audio/C08 南无阿弥陀佛（慢版）.mp3',
    durationMs: 115083
  },
  { 
    id: 'c09', code: 'C09', title: '南无阿弥陀佛（快版）', subtitle: '', section: 'C', 
    imageUrl: IMAGE_AMITABHA, 
    audioUrl: '/assets/audio/C09 南无阿弥陀佛（快版）.mp3',
    durationMs: 83667
  },
  { 
    id: 'c10', code: 'C10', title: '阿弥陀佛（唱版）', subtitle: '', section: 'C', 
    imageUrl: IMAGE_AMITABHA, 
    audioUrl: '/assets/audio/C10 阿弥陀佛（唱版）.mp3',
    durationMs: 917708
  },
  { 
    id: 'c11', code: 'C11', title: '阿弥陀佛（慢版）', subtitle: '', section: 'C', 
    imageUrl: IMAGE_AMITABHA, 
    audioUrl: '/assets/audio/C11 阿弥陀佛（慢版）.mp3',
    durationMs: 98691
  },
  { 
    id: 'c12', code: 'C12', title: '阿弥陀佛（快版）', subtitle: '', section: 'C', 
    imageUrl: IMAGE_AMITABHA, 
    audioUrl: '/assets/audio/C12 阿弥陀佛（快版）.mp3',
    durationMs: 62595
  },
  { 
    id: 'c13', code: 'C13', title: '南无观世音菩萨（唱版）', subtitle: '', section: 'C', 
    imageUrl: IMAGE_GUANYIN, 
    audioUrl: '/assets/audio/C13 南无观世音菩萨（唱版）.mp3',
    durationMs: 412865
  },
  { 
    id: 'c14', code: 'C14', title: '南无观世音菩萨（慢版）', subtitle: '', section: 'C', 
    imageUrl: IMAGE_GUANYIN, 
    audioUrl: '/assets/audio/C14 南无观世音菩萨（慢版）.mp3',
    durationMs: 76515
  },

  // D: 期盼歌曲
  { 
    id: 'd15', code: 'D15', title: '期盼（歌曲）', subtitle: '', section: 'D', 
    imageUrl: IMAGE_SONG, 
    audioUrl: '/assets/audio/D15 期盼（歌曲）.mp3',
    durationMs: 196089
  },
  { 
    id: 'd16', code: 'D16', title: '回向偈', subtitle: '', section: 'D', 
    imageUrl: IMAGE_SONG, 
    audioUrl: '/assets/audio/D16 回向偈.mp3',
    durationMs: 200787
  },
  { 
    id: 'd17', code: 'D17', title: '观音灵感歌', subtitle: '', section: 'D', 
    imageUrl: IMAGE_SONG, 
    audioUrl: '/assets/audio/D17 观音灵感歌.mp3',
    durationMs: 264497
  },
  { 
    id: 'd18', code: 'D18', title: '观音菩萨如秋月', subtitle: '', section: 'D', 
    imageUrl: IMAGE_SONG, 
    audioUrl: '/assets/audio/D18 观音菩萨如秋月.mp3',
    durationMs: 307275
  },
  { 
    id: 'd19', code: 'D19', title: '一声佛号一声心', subtitle: '', section: 'D', 
    imageUrl: IMAGE_SONG, 
    audioUrl: '/assets/audio/D19 一声佛号一声心.mp3',
    durationMs: 318733
  },
  { 
    id: 'd20', code: 'D20', title: '观音菩萨偈', subtitle: '', section: 'D', 
    imageUrl: IMAGE_SONG, 
    audioUrl: '/assets/audio/D20 观音菩萨偈.mp3',
    durationMs: 241503
  },
  { 
    id: 'd21', code: 'D21', title: '愿做菩萨那朵莲', subtitle: '', section: 'D', 
    imageUrl: IMAGE_SONG, 
    audioUrl: '/assets/audio/D21 愿做菩萨那朵莲.mp3',
    durationMs: 244766
  }
].map(track => ({
  ...track,
  lyrics: LYRICS_DATA[track.id]
}));

export const SECTIONS = [
  { id: 'A', name: '大悲咒系列', code: 'A' },
  { id: 'B', name: '仪轨回向', code: 'B' },
  { id: 'C', name: '佛号圣号', code: 'C' },
  { id: 'D', name: '经典歌曲', code: 'D' }
];
