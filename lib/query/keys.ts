export const queryKeys = {
  session: ['session'] as const,
  profile: (userId: string) => ['profile', userId] as const,
  routines: (userId: string) => ['routines', userId] as const,
  streaks: (userId: string) => ['streaks', userId] as const,
  journals: (userId: string) => ['journals', userId] as const,
  mood: (userId: string) => ['mood', userId] as const,
  sleep: (userId: string) => ['sleep', userId] as const,
  community: {
    feed: (cursor?: string) => ['community', 'feed', cursor ?? 'head'] as const,
    post: (id: string) => ['community', 'post', id] as const,
  },
  semester: (userId: string) => ['semester', userId] as const,
};
