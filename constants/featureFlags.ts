export const FEATURE_FLAGS_STORAGE_KEY = 'starlight_feature_flags_override';

export interface FeatureFlags {
  FORCE_SYNC_MODE: boolean;
  LOCK_TIMELINE: boolean;
  HIDE_SYNC_LOCK_TIP: boolean;
  HIDE_LYRICS: boolean;
  HIDE_COVER_TOGGLE: boolean;
  HIDE_MODE_SWITCH: boolean;
  HIDE_PLAYBACK_RATE: boolean;
  HIDE_VOLUME_CONTROL: boolean;
  HIDE_CUSTOM_TRACKS: boolean;
  HIDE_PLAYLIST_TOP_HEADER: boolean;
  HIDE_TIMER_NAV: boolean;
  HIDE_PROFILE_HEADER: boolean;
  HIDE_PROFILE_QUOTE: boolean;
  PLAYER_MAIN_BUTTON_SCALE: number;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  FORCE_SYNC_MODE: true,
  LOCK_TIMELINE: true,
  HIDE_SYNC_LOCK_TIP: true,
  HIDE_LYRICS: true,
  HIDE_COVER_TOGGLE: true,
  HIDE_MODE_SWITCH: true,
  HIDE_PLAYBACK_RATE: true,
  HIDE_VOLUME_CONTROL: true,
  HIDE_CUSTOM_TRACKS: true,
  HIDE_PLAYLIST_TOP_HEADER: true,
  HIDE_TIMER_NAV: true,
  HIDE_PROFILE_HEADER: true,
  HIDE_PROFILE_QUOTE: true,
  PLAYER_MAIN_BUTTON_SCALE: 1.5,
};

const BOOLEAN_FLAG_KEYS: (keyof Omit<FeatureFlags, 'PLAYER_MAIN_BUTTON_SCALE'>)[] = [
  'FORCE_SYNC_MODE',
  'LOCK_TIMELINE',
  'HIDE_SYNC_LOCK_TIP',
  'HIDE_LYRICS',
  'HIDE_COVER_TOGGLE',
  'HIDE_MODE_SWITCH',
  'HIDE_PLAYBACK_RATE',
  'HIDE_VOLUME_CONTROL',
  'HIDE_CUSTOM_TRACKS',
  'HIDE_PLAYLIST_TOP_HEADER',
  'HIDE_TIMER_NAV',
  'HIDE_PROFILE_HEADER',
  'HIDE_PROFILE_QUOTE',
];

const parseOverride = (raw: string | null): Partial<FeatureFlags> => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: Partial<FeatureFlags> = {};

    for (const key of BOOLEAN_FLAG_KEYS) {
      if (typeof parsed[key] === 'boolean') {
        result[key] = parsed[key] as FeatureFlags[typeof key];
      }
    }

    if (typeof parsed.PLAYER_MAIN_BUTTON_SCALE === 'number' && Number.isFinite(parsed.PLAYER_MAIN_BUTTON_SCALE)) {
      result.PLAYER_MAIN_BUTTON_SCALE = Math.max(1, Math.min(2.5, parsed.PLAYER_MAIN_BUTTON_SCALE));
    }

    return result;
  } catch {
    return {};
  }
};

export const getFeatureFlags = (): FeatureFlags => {
  if (typeof window === 'undefined') {
    return DEFAULT_FEATURE_FLAGS;
  }

  const override = parseOverride(window.localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY));
  return {
    ...DEFAULT_FEATURE_FLAGS,
    ...override,
  };
};

export const FEATURE_FLAGS = getFeatureFlags();