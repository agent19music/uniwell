export const mockStreak = {
  id: '1',
  title: 'Daily Meditation',
  color: '#007AFF',
  icon: 'leaf',
  currentStreak: 7,
  longestStreak: 14,
  targetCount: 30,
  notes: 'Remember to meditate for at least 10 minutes every morning.',
  type: 'build',
  status: 'active',
  startDate: '2024-05-01',
  lastCheckIn: '2024-05-07'
};

export const mockStats = {
  completedDays: 42,
  totalDays: 50,
  startedDate: '2024-05-01',
  lastCheckInDate: '2024-05-07'
};

export const mockCheckIns = [
  '2024-05-01', '2024-05-02', '2024-05-03', '2024-05-04', '2024-05-05', 
  '2024-05-06', '2024-05-07', '2024-05-08', '2024-05-09', '2024-05-10'
].map(date => ({
  id: date,
  streakId: '1',
  checkDate: date,
  notes: null,
  createdAt: date
}));