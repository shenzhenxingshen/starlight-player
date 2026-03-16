
export enum View {
  PLAYER = 'PLAYER',
  PLAYLIST = 'PLAYLIST',
  TIMER = 'TIMER',
  PROFILE = 'PROFILE'
}

export enum PlaybackMode {
  SINGLE_LOOP = 'SINGLE_LOOP',
  TASK = 'TASK',
  SEQUENTIAL = 'SEQUENTIAL'
}

export interface LyricLine {
  time: number;
  text: string;
}

export interface Track {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  section: string;
  imageUrl: string;
  audioUrl: string; 
  lyrics?: LyricLine[];
}

export interface AppState {
  currentTrack: Track;
  isPlaying: boolean;
  progress: number;
  volume: number;
  loopTarget: number;
  currentLoop: number;
  isAutoPlayOnStart: boolean;
  isResumeFromBreak: boolean;
}
