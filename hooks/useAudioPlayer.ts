import { useState, useEffect, useRef } from 'react';
import { Track } from '../types';

const PLAY_RETRY_MAX_ATTEMPTS = 3;
const PLAY_RETRY_DELAY_MS = 800;

export const useAudioPlayer = (currentTrack: Track) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playRetryTimerRef = useRef<number | null>(null);
  const playRetryCountRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem('zen_chant_volume');
      return saved ? JSON.parse(saved) : 0.65;
    } catch {
      return 0.65;
    }
  });
  const [playbackRate, setPlaybackRate] = useState(() => {
    try {
      const saved = localStorage.getItem('zen_chant_playback_rate');
      return saved ? JSON.parse(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });

  const clearPlayRetryTimer = () => {
    if (playRetryTimerRef.current !== null) {
      window.clearTimeout(playRetryTimerRef.current);
      playRetryTimerRef.current = null;
    }
  };

  const resetPlayRetryState = () => {
    clearPlayRetryTimer();
    playRetryCountRef.current = 0;
  };

  const attemptPlayWithRetry = (attempt: number = 0) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused === false) {
      resetPlayRetryState();
      return;
    }

    audio.play().then(() => {
      resetPlayRetryState();
    }).catch(() => {
      if (attempt >= PLAY_RETRY_MAX_ATTEMPTS) {
        resetPlayRetryState();
        setIsPlaying(false);
        return;
      }

      playRetryCountRef.current = attempt + 1;
      clearPlayRetryTimer();
      playRetryTimerRef.current = window.setTimeout(() => {
        playRetryTimerRef.current = null;
        if (!audioRef.current || !isPlaying) return;
        attemptPlayWithRetry(attempt + 1);
      }, PLAY_RETRY_DELAY_MS);
    });
  };

  useEffect(() => {
    localStorage.setItem('zen_chant_volume', JSON.stringify(volume));
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('zen_chant_playback_rate', JSON.stringify(playbackRate));
  }, [playbackRate]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      attemptPlayWithRetry(0);
    } else {
      resetPlayRetryState();
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      if (isPlaying) {
        resetPlayRetryState();
        attemptPlayWithRetry(0);
      }
      audioRef.current.playbackRate = playbackRate;
    }
  }, [currentTrack.id]);

  useEffect(() => {
    return () => {
      resetPlayRetryState();
    };
  }, []);

  const togglePlay = () => setIsPlaying(prev => !prev);

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  return {
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
  };
};
