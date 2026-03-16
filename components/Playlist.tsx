
import React, { useState, useEffect, useRef } from 'react';
import { Track } from '../types';
import { TRACKS, SECTIONS } from '../constants';
import { saveAudioBlob, getAudioBlob, deleteAudioBlob } from '../services/dbService';

interface PlaylistProps {
  onTrackSelect: (track: Track) => void;
  currentTrackId: string;
  isLargeText?: boolean;
}

const CUSTOM_TRACKS_KEY = 'zen_chant_custom_tracks';
const AUDIO_CACHE_NAME = 'zen-chant-audio';

const Playlist: React.FC<PlaylistProps> = ({ onTrackSelect, currentTrackId, isLargeText }) => {
  const [activeTab, setActiveTab] = useState<'official' | 'custom'>('official');
  const [customTracks, setCustomTracks] = useState<Track[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [newTrackFile, setNewTrackFile] = useState<File | null>(null);
  const [addMethod, setAddMethod] = useState<'url' | 'file'>('url');
  
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'partial'>('idle');
  const [syncProgress, setSyncProgress] = useState(0);
  const [cachedCount, setCachedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadTracks = async () => {
      const saved = localStorage.getItem(CUSTOM_TRACKS_KEY);
      if (saved) {
        try {
          const tracks: Track[] = JSON.parse(saved);
          
          // 为本地上传的曲目重新生成 ObjectURL
          const restoredTracks = await Promise.all(tracks.map(async (t) => {
            if (t.id.startsWith('custom_') && t.subtitle === '本地上传') {
              try {
                const blob = await getAudioBlob(t.id);
                if (blob) {
                  return { ...t, audioUrl: URL.createObjectURL(blob) };
                }
              } catch (err) {
                console.error(`Failed to restore audio for ${t.title}`, err);
              }
            }
            return t;
          }));
          
          setCustomTracks(restoredTracks);
        } catch (e) {
          console.error('Failed to parse custom tracks', e);
        }
      }
    };

    loadTracks();
    checkCacheStatus();

    // 监听自动缓存成功的事件
    const handleCacheUpdate = () => checkCacheStatus();
    window.addEventListener('zen_cache_updated', handleCacheUpdate);
    return () => window.removeEventListener('zen_cache_updated', handleCacheUpdate);
  }, []);

  const checkCacheStatus = async () => {
    try {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      let validCount = 0;
      const officialUrls = TRACKS.map(t => new URL(t.audioUrl, window.location.origin).href);
      
      for (const url of officialUrls) {
        const response = await cache.match(url);
        if (response && response.status === 200) {
          validCount++;
        }
      }

      setCachedCount(validCount);
      const progress = Math.round((validCount / TRACKS.length) * 100);
      setSyncProgress(progress);

      if (validCount === TRACKS.length) {
        setSyncStatus('completed');
      } else if (validCount > 0) {
        setSyncStatus('partial');
      } else {
        setSyncStatus('idle');
      }
    } catch (e) {
      console.error("Cache check failed", e);
    }
  };

  const handleManualSync = async () => {
    if (syncStatus === 'syncing') return;
    setSyncStatus('syncing');

    try {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      let currentHandled = 0;

      for (const track of TRACKS) {
        const normUrl = new URL(track.audioUrl, window.location.origin).href;
        const existing = await cache.match(normUrl);
        
        if (existing && existing.status === 200) {
          currentHandled++;
          continue;
        }

        try {
          const response = await fetch(track.audioUrl, {
            mode: 'cors',
            credentials: 'omit',
            cache: 'reload' 
          });
          if (response.ok) {
            await cache.put(normUrl, response);
          }
        } catch (err) {
          console.error("Fetch failed for", track.title);
        }
        
        currentHandled++;
        // 实时更新进度
        const p = Math.round((currentHandled / TRACKS.length) * 100);
        setSyncProgress(p);
      }
      
      await checkCacheStatus();
    } catch (e) {
      console.error("Sync crashed:", e);
      setSyncStatus('partial');
    }
  };

  const handleAddTrack = async () => {
    if (!newTrackTitle || !newTrackUrl) return;
    
    const trackId = `custom_${Date.now()}`;
    
    // 如果是文件上传，保存到 IndexedDB
    if (addMethod === 'file' && newTrackFile) {
      try {
        await saveAudioBlob(trackId, newTrackFile);
      } catch (err) {
        console.error("Failed to save to IndexedDB", err);
        alert("保存文件失败，请重试");
        return;
      }
    }

    const newTrack: Track = {
      id: trackId,
      code: `Z${(customTracks.length + 1).toString().padStart(2, '0')}`,
      title: newTrackTitle,
      subtitle: addMethod === 'file' ? '本地上传' : '网络链接',
      section: 'CUSTOM',
      imageUrl: 'https://www.shouyueliang.org/wp-content/uploads/2021/04/1623587633-v500-4-1.gif',
      audioUrl: newTrackUrl
    };

    saveCustomTracks([...customTracks, newTrack]);
    setShowAddModal(false);
    setNewTrackTitle('');
    setNewTrackUrl('');
    setNewTrackFile(null);
  };

  const saveCustomTracks = (tracks: Track[]) => {
    setCustomTracks(tracks);
    // 存储到 localStorage 时，如果是本地文件，audioUrl 是临时的，不需要持久化
    // 我们只持久化元数据，加载时再从 IndexedDB 恢复 URL
    const tracksToSave = tracks.map(t => {
      if (t.id.startsWith('custom_') && t.subtitle === '本地上传') {
        return { ...t, audioUrl: '' }; // 清空临时 URL
      }
      return t;
    });
    localStorage.setItem(CUSTOM_TRACKS_KEY, JSON.stringify(tracksToSave));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setNewTrackUrl(url);
      setNewTrackFile(file);
      if (!newTrackTitle) {
        // 尝试更安全地获取文件名，防止乱码
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setNewTrackTitle(fileName);
      }
    }
  };

  const removeTrack = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    // 如果是本地文件，从 IndexedDB 删除
    const track = customTracks.find(t => t.id === id);
    if (track && track.subtitle === '本地上传') {
      try {
        await deleteAudioBlob(id);
      } catch (err) {
        console.error("Failed to delete from IndexedDB", err);
      }
    }

    const updated = customTracks.filter(t => t.id !== id);
    saveCustomTracks(updated);
  };

  return (
    <div className="flex flex-col h-full bg-dark-gradient overflow-hidden pt-10">
      <div className="flex-none bg-transparent px-6 mb-2">
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('official')}
            className={`flex-1 flex flex-col items-center border-b-2 pb-3 transition-all ${activeTab === 'official' ? 'border-gold-main text-gold-main' : 'border-transparent text-stone-500 hover:text-stone-300'}`}
          >
            <p className={`font-bold tracking-[0.1em] font-serif transition-all ${isLargeText ? 'text-xl' : 'text-[16px]'}`}>官方曲目</p>
          </button>
          <button 
            onClick={() => setActiveTab('custom')}
            className={`flex-1 flex flex-col items-center border-b-2 pb-3 transition-all ${activeTab === 'custom' ? 'border-gold-main text-gold-main' : 'border-transparent text-stone-500 hover:text-stone-300'}`}
          >
            <p className={`font-bold tracking-[0.1em] font-serif transition-all ${isLargeText ? 'text-xl' : 'text-[16px]'}`}>自定义</p>
          </button>
        </div>
      </div>

      {activeTab === 'official' && (
        <div className="px-6 py-3">
          <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-4">
              <div className={`relative flex items-center justify-center w-10 h-10 rounded-full bg-black/40 border ${syncStatus === 'completed' ? 'border-green-500/50 text-green-400' : 'border-gold-main/30 text-gold-main'}`}>
                {syncStatus === 'syncing' ? (
                   <span className="material-symbols-outlined text-2xl animate-spin">sync</span>
                ) : syncStatus === 'completed' ? (
                   <span className="material-symbols-outlined text-2xl">verified_user</span>
                ) : (
                   <span className="material-symbols-outlined text-2xl">download_for_offline</span>
                )}
                {syncStatus === 'syncing' && (
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="113.1" strokeDashoffset={113.1 - (113.1 * syncProgress) / 100} className="opacity-40" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`font-bold font-serif transition-all ${isLargeText ? 'text-sm' : 'text-[12px]'} ${syncStatus === 'completed' ? 'text-green-400' : 'text-stone-200'}`}>
                  {syncStatus === 'syncing' ? '正在离线所有曲目...' : `离线进度: ${cachedCount} / ${TRACKS.length}`}
                </p>
                <p className="text-stone-500 text-[10px] mt-0.5">
                  {syncStatus === 'completed' ? '功德圆满，全曲目已支持离线播放' : '听完曲目将自动保存，也可手动同步'}
                </p>
              </div>
            </div>
            {syncStatus !== 'completed' && (
              <button 
                onClick={handleManualSync}
                disabled={syncStatus === 'syncing'}
                className={`px-3 py-2 bg-gold-main/10 border border-gold-main/30 rounded-xl text-gold-main font-bold tracking-widest uppercase hover:bg-gold-main/20 active:scale-95 disabled:opacity-30 transition-all ${isLargeText ? 'text-[10px]' : 'text-[9px]'}`}
              >
                {syncStatus === 'syncing' ? '进行中' : '手动同步'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-32 scroll-smooth">
        {activeTab === 'official' ? (
          SECTIONS.map((section) => (
            <div key={section.id} className="mb-2">
              <div className="sticky top-0 z-30 bg-[#0d0805]/98 backdrop-blur-xl px-5 py-3 border-b border-gold-main/10 shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="bg-gold-main/20 border border-gold-main/40 text-gold-main text-[10px] font-bold px-2 py-0.5 rounded tracking-widest font-display">
                    {section.code}
                  </span>
                  <h3 className={`text-gold-light font-bold font-serif tracking-wider transition-all ${isLargeText ? 'text-xl' : 'text-base'}`}>{section.name}</h3>
                </div>
              </div>
              
              <div className="flex flex-col divide-y divide-white/5 px-2">
                {TRACKS.filter(t => t.section === section.code).map((track) => (
                  <div 
                    key={track.id}
                    onClick={() => onTrackSelect(track)}
                    className={`group flex items-center gap-4 px-3 py-4 justify-between hover:bg-white/[0.05] cursor-pointer rounded-lg transition-colors my-1 ${currentTrackId === track.id ? 'bg-white/[0.1]' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`badge-texture flex items-center justify-center rounded-full shrink-0 size-11 font-bold text-[#2C1E12] text-sm font-display shadow-xl border border-[#7c6428]/50 transition-transform ${currentTrackId === track.id ? 'scale-110 rotate-3' : ''}`}>
                        {track.code}
                      </div>
                      <div className="flex flex-col">
                        <p className={`font-bold font-serif tracking-wide transition-colors ${currentTrackId === track.id ? 'text-gold-light' : 'text-stone-200 group-hover:text-gold-main'} ${isLargeText ? 'text-xl' : 'text-[17px]'}`}>
                          {track.title}
                        </p>
                        <p className={`text-stone-400 tracking-wider font-serif transition-all ${isLargeText ? 'text-sm' : 'text-xs'}`}>{track.subtitle}</p>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-3xl transition-colors ${currentTrackId === track.id ? 'text-gold-main' : 'text-stone-500 group-hover:text-gold-main'}`}>
                      {currentTrackId === track.id ? 'pause_circle' : 'play_circle'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="px-2 py-4 space-y-4">
            <button 
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-dashed border-gold-main/40 text-gold-main hover:bg-gold-main/10 transition-colors group shadow-lg shadow-black/40"
            >
              <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">add_circle</span>
              <span className={`font-bold tracking-widest font-serif transition-all ${isLargeText ? 'text-xl' : 'text-base'}`}>添加自定义曲目</span>
            </button>

            <div className="flex flex-col divide-y divide-white/5">
              {customTracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-40 text-gold-light">
                  <span className="material-symbols-outlined text-6xl mb-4">music_off</span>
                  <p className={`tracking-widest font-serif transition-all ${isLargeText ? 'text-lg' : 'text-sm'}`}>暂无自定义曲目</p>
                </div>
              ) : (
                customTracks.map((track) => (
                  <div 
                    key={track.id}
                    onClick={() => onTrackSelect(track)}
                    className={`group flex items-center gap-4 px-3 py-4 justify-between hover:bg-white/[0.05] cursor-pointer rounded-lg transition-colors my-1 ${currentTrackId === track.id ? 'bg-white/[0.1]' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="badge-texture flex items-center justify-center rounded-full shrink-0 size-11 font-bold text-[#2C1E12] text-sm font-display shadow-lg border border-[#7c6428]/50">
                        {track.code}
                      </div>
                      <div className="flex flex-col">
                        <p className={`font-bold font-serif tracking-wide transition-colors ${currentTrackId === track.id ? 'text-gold-light' : 'text-stone-200 group-hover:text-gold-main'} ${isLargeText ? 'text-xl' : 'text-[17px]'}`}>
                          {track.title}
                        </p>
                        <p className={`text-stone-400 tracking-wider font-serif transition-all ${isLargeText ? 'text-sm' : 'text-xs'}`}>{track.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => removeTrack(e, track.id)}
                        className="text-red-500/50 hover:text-red-400 p-2 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                      <span className={`material-symbols-outlined text-3xl transition-colors ${currentTrackId === track.id ? 'text-gold-main' : 'text-stone-500 group-hover:text-gold-main'}`}>
                        {currentTrackId === track.id ? 'pause_circle' : 'play_circle'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl bg-black/70">
          <div className="w-full max-w-sm bg-surface-dark border border-gold-main/30 rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className={`text-gold-light font-bold font-serif mb-6 text-center tracking-widest transition-all ${isLargeText ? 'text-2xl' : 'text-xl'}`}>添加修行曲目</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className={`text-stone-400 font-bold uppercase tracking-widest font-serif ml-1 transition-all ${isLargeText ? 'text-xs' : 'text-[10px]'}`}>曲目名称</label>
                <input 
                  type="text" 
                  value={newTrackTitle}
                  onChange={(e) => setNewTrackTitle(e.target.value)}
                  placeholder="请输入曲目名称"
                  className="w-full bg-black/40 border border-gold-main/30 rounded-xl px-4 py-3 text-gold-light focus:border-gold-main outline-none placeholder:text-stone-600"
                />
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button onClick={() => setAddMethod('url')} className={`flex-1 py-2 rounded-lg font-bold font-serif transition-all ${isLargeText ? 'text-sm' : 'text-xs'} ${addMethod === 'url' ? 'bg-gold-main/30 text-gold-main border border-gold-main/50' : 'bg-black/40 text-stone-500 border border-white/5'}`}>网络链接</button>
                  <button onClick={() => setAddMethod('file')} className={`flex-1 py-2 rounded-lg font-bold font-serif transition-all ${isLargeText ? 'text-sm' : 'text-xs'} ${addMethod === 'file' ? 'bg-gold-main/30 text-gold-main border border-gold-main/50' : 'bg-black/40 text-stone-500 border border-white/5'}`}>本地文件</button>
                </div>
                {addMethod === 'url' ? (
                  <input 
                    type="text" 
                    value={newTrackUrl}
                    onChange={(e) => setNewTrackUrl(e.target.value)}
                    placeholder="https://example.com/audio.mp3"
                    className="w-full bg-black/40 border border-gold-main/30 rounded-xl px-4 py-3 text-gold-light focus:border-gold-main outline-none placeholder:text-stone-600"
                  />
                ) : (
                  <div onClick={() => fileInputRef.current?.click()} className="w-full bg-black/40 border border-dashed border-gold-main/30 rounded-xl px-4 py-6 text-center cursor-pointer hover:bg-white/5 transition-colors">
                    <span className={`text-gold-main font-bold font-serif transition-all ${isLargeText ? 'text-sm' : 'text-xs'}`}>{newTrackUrl ? '已选择音频' : '点击上传本地音频'}</span>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddModal(false)} className={`flex-1 py-3 rounded-xl border border-white/10 text-stone-300 font-bold font-serif transition-all hover:bg-white/5 ${isLargeText ? 'text-base' : 'text-sm'}`}>取消</button>
                <button onClick={handleAddTrack} disabled={!newTrackTitle || !newTrackUrl} className={`flex-1 py-3 rounded-xl bg-gold-metal text-[#2C1E12] font-bold font-serif transition-all shadow-lg active:scale-95 disabled:opacity-30 ${isLargeText ? 'text-base' : 'text-sm'}`}>确认添加</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Playlist;
