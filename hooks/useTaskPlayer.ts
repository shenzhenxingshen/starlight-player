import { useState, useEffect, RefObject } from 'react';
import { PlaybackMode, Track } from '../types';

export const useTaskPlayer = (
  currentTrack: Track,
  getAudio: () => HTMLAudioElement | null,
  setIsPlaying: (playing: boolean) => void,
  setShowMerit: (show: boolean) => void,
  onRecordCompletion: (track: Track) => void,
  onNextTrack: () => void
) => {
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(() => {
    try {
      const saved = localStorage.getItem('zen_chant_playback_mode');
      return saved ? JSON.parse(saved) : PlaybackMode.SINGLE_LOOP;
    } catch {
      return PlaybackMode.SINGLE_LOOP;
    }
  });
  const [taskTarget, setTaskTarget] = useState(() => {
    try {
      const saved = localStorage.getItem('zen_chant_task_target');
      return saved ? JSON.parse(saved) : 0;
    } catch {
      return 0;
    }
  });
  const [taskProgress, setTaskProgress] = useState(() => {
    try {
      const saved = localStorage.getItem('zen_chant_task_progress');
      return saved ? JSON.parse(saved) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    localStorage.setItem('zen_chant_playback_mode', JSON.stringify(playbackMode));
  }, [playbackMode]);

  useEffect(() => {
    localStorage.setItem('zen_chant_task_target', JSON.stringify(taskTarget));
  }, [taskTarget]);

  useEffect(() => {
    localStorage.setItem('zen_chant_task_progress', JSON.stringify(taskProgress));
  }, [taskProgress]);

  const isTaskActive = playbackMode === PlaybackMode.TASK && taskTarget > 0;

  const updateTaskTarget = (
    target: number,
    startAtSec: number = 0,
    initialProgress: number = 1,
    autoplay: boolean = true
  ) => {
    setTaskTarget(target);
    setTaskProgress(initialProgress);
    setPlaybackMode(PlaybackMode.TASK);
    const audio = getAudio();
    if (audio) {
      audio.currentTime = Math.max(startAtSec, 0);
      if (autoplay) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    }
  };

  const stopTask = () => {
    setTaskTarget(0);
    setTaskProgress(0);
    setPlaybackMode(PlaybackMode.SINGLE_LOOP);
    const audio = getAudio();
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const handleEnded = () => {
    // 任务模式与单曲循环模式采用“回绕检测”计次，这里避免重复计数
    if (isTaskActive || playbackMode === PlaybackMode.SINGLE_LOOP) {
      return { taskCompleted: false };
    }

    if (playbackMode === PlaybackMode.SEQUENTIAL) {
      onRecordCompletion(currentTrack);
      onNextTrack();
      return { taskCompleted: false };
    }

    onRecordCompletion(currentTrack);
    return { taskCompleted: false };
  };

  const isSingleLoop = playbackMode === PlaybackMode.SINGLE_LOOP;

  const recordCompletion = () => {
    // Logic to record completion
  };

  return {
    playbackMode,
    setPlaybackMode,
    taskTarget,
    setTaskTarget,
    taskProgress,
    setTaskProgress,
    isTaskActive,
    updateTaskTarget,
    stopTask,
    handleEnded,
    recordCompletion,
    isSingleLoop
  };
};
