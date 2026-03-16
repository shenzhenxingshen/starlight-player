
import React, { useState, useEffect, useRef } from 'react';
import { View, Track, PlaybackMode } from './types';
import { TRACKS } from './constants';
import BottomNav from './components/BottomNav';
import Player from './components/Player';
import Playlist from './components/Playlist';
import Settings from './components/Settings';
import Profile from './components/Profile';
import MeritAnimation from './components/MeritAnimation';
import ShareCard from './components/ShareCard';
import { getZenQuote, ZenQuote } from './services/zenQuoteService';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTaskPlayer } from './hooks/useTaskPlayer';

const STATS_KEY = 'zen_chant_user_stats';
const CONFIG_KEY = 'zen_chant_config';
const AUDIO_CACHE_NAME = 'zen-chant-audio';

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.PLAYER);
  const [currentTrack, setCurrentTrack] = useState<Track>(() => {
    try {
      const saved = localStorage.getItem('zen_chant_current_track');
      return saved ? JSON.parse(saved) : TRACKS[0];
    } catch {
      return TRACKS[0];
    }
  });

  useEffect(() => {
    localStorage.setItem('zen_chant_current_track', JSON.stringify(currentTrack));
  }, [currentTrack]);
  const [zenQuote, setZenQuote] = useState<ZenQuote>(getZenQuote());
  const [showMerit, setShowMerit] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const [isLargeText, setIsLargeText] = useState(() => {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      return saved ? JSON.parse(saved).isLargeText : false;
    } catch {
      return false;
    }
  });

  const {
    audioRef,
    isPlaying,
    setIsPlaying,
    currentTime,
    duration,
    volume,
    setVolume,
    playbackRate,
    setPlaybackRate,
    togglePlay,
    seek,
    handleTimeUpdate
  } = useAudioPlayer(currentTrack);

  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem(STATS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      installDate: new Date().toISOString(),
      totalCompletions: 0,
      dailyLogs: {}
    };
  });

  useEffect(() => {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  // Media Session API Integration
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: '念佛机',
        artwork: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play', () => {
        togglePlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        togglePlay();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        handlePrev();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        handleNext();
      });
    }
  }, [currentTrack, isPlaying, togglePlay]);

  const handleTrackSelect = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setView(View.PLAYER);
    stopTask();
  };

  const handlePrev = () => {
    const idx = TRACKS.findIndex(t => t.id === currentTrack.id);
    if (idx !== -1) {
      setCurrentTrack(TRACKS[(idx - 1 + TRACKS.length) % TRACKS.length]);
      setIsPlaying(true);
    }
  };

  const handleRefreshQuote = () => {
    setZenQuote(getZenQuote());
  };

  const recordCompletion = (track: Track) => {
    setStats(prev => ({
      ...prev,
      totalCompletions: prev.totalCompletions + 1,
      dailyLogs: {
        ...prev.dailyLogs,
        [new Date().toISOString().split('T')[0]]: (prev.dailyLogs[new Date().toISOString().split('T')[0]] || 0) + 1
      }
    }));
  };

  const handleNext = () => {
    const idx = TRACKS.findIndex(t => t.id === currentTrack.id);
    if (idx !== -1) {
      setCurrentTrack(TRACKS[(idx + 1) % TRACKS.length]);
      setIsPlaying(true);
    }
  };

  const {
    playbackMode,
    isTaskActive,
    taskProgress,
    taskTarget,
    setTaskTarget,
    setTaskProgress,
    stopTask,
    updateTaskTarget,
    recordCompletion: taskRecordCompletion,
    isSingleLoop,
    handleEnded
  } = useTaskPlayer(
    currentTrack, 
    () => audioRef.current, 
    setIsPlaying, 
    setShowMerit, 
    recordCompletion, 
    handleNext
  );

  const renderContent = () => {
    switch (view) {
      case View.PLAYER:
        return (
          <Player
            track={currentTrack}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onNext={handleNext}
            onPrev={handlePrev}
            onSeek={seek}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            setVolume={setVolume}
            playbackRate={playbackRate}
            setPlaybackRate={setPlaybackRate}
            isLargeText={isLargeText}
          />
        );
      case View.PLAYLIST:
        return (
          <Playlist
            currentTrackId={currentTrack.id}
            onTrackSelect={handleTrackSelect}
            isLargeText={isLargeText}
          />
        );
      case View.TIMER:
        return (
          <Settings
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onNext={handleNext}
            onPrev={handlePrev}
            onUpdateTarget={updateTaskTarget}
            onStopTask={stopTask}
            taskProgress={taskProgress}
            taskTarget={taskTarget}
            currentTime={currentTime}
            duration={duration}
            isLargeText={isLargeText}
          />
        );
      case View.PROFILE:
        return (
          <Profile
            stats={stats}
            zenQuote={zenQuote}
            onRefreshQuote={handleRefreshQuote}
            isLargeText={isLargeText}
            onToggleLargeText={() => setIsLargeText(!isLargeText)}
            onOpenShare={() => setShowShare(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto min-h-screen relative shadow-2xl bg-zen-dark overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-wood-grain mix-blend-overlay opacity-20"></div>
        <div className="absolute top-1/4 -left-1/4 w-[150%] h-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-[100px] animate-smoke-flow rotate-12"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-[150%] h-1/2 bg-gradient-to-l from-transparent via-gold-main/5 to-transparent blur-[80px] animate-smoke-flow -rotate-6 animation-delay-5000"></div>
      </div>

      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => console.error("Audio error:", e)}
        crossOrigin="anonymous"
        loop={playbackMode === PlaybackMode.SINGLE_LOOP || (isTaskActive && taskProgress < taskTarget)}
      />

      {renderContent()}

      <BottomNav activeView={view} onViewChange={setView} />

      {showMerit && <MeritAnimation onComplete={() => setShowMerit(false)} />}
      {showShare && <ShareCard quote={zenQuote} onClose={() => setShowShare(false)} />}
    </div>
  );
};

export default App;