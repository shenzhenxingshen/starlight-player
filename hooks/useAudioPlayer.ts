import { useState, useEffect, useRef } from 'react';
import { Track } from '../types';

export const useAudioPlayer = (currentTrack: Track) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  useEffect(() => {
    localStorage.setItem('zen_chant_volume', JSON.stringify(volume));
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('zen_chant_playback_rate', JSON.stringify(playbackRate));
  }, [playbackRate]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
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
        audioRef.current.play().catch(() => {});
      }
      audioRef.current.playbackRate = playbackRate;
    }
  }, [currentTrack.id]);

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
