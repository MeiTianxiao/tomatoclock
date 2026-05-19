export type RankLevel =
  | 'intern'
  | 'staff'
  | 'deputy_chief_staff'
  | 'chief_staff'
  | 'deputy_section_chief'
  | 'section_chief'
  | 'deputy_director'
  | 'director'
  | 'deputy_bureau_chief'
  | 'bureau_chief';

export interface Rank {
  id: RankLevel;
  name: string;
  points: number;
  image: string;
  color: string;
}

export interface FocusSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  category: FocusCategory;
  points: number;
  mode: 'strict' | 'gentle';
  completed: boolean;
  interrupted: boolean;
}

export type FocusCategory = 'study' | 'work' | 'exam' | 'reading' | 'exercise' | 'other';

export interface UserProfile {
  id: string;
  nickname: string;
  avatar: string;
  currentRank: RankLevel;
  dailyPoints: number;
  totalMinutes: number;
  achievements: Achievement[];
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'business' | 'simple' | 'dark' | 'orange';
  soundEnabled: boolean;
  promotionSoundEnabled: boolean;
  whiteNoiseEnabled: boolean;
  whiteNoiseType: 'office' | 'library' | 'cafe' | 'rain' | 'piano';
  privacyMode: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  avatar: string;
  rank: RankLevel;
  minutes: number;
  position: number;
}
