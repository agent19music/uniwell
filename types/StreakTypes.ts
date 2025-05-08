export interface Streak {
  id: string;
  title: string;
  type: string;
  status: 'active' | 'broken';
  startDate: string;
  startTime: string;
  currentStreak: number;
  longestStreak: number;
  targetCount: number;
  color: string;
  icon: string;
} 