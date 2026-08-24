import type { Profile } from '@/types/database';
import type { CachedProfile } from '@/lib/cache/ProfileCache';

export function mapProfileRow(row: Profile): CachedProfile {
  return {
    id: row.id,
    username: row.username,
    avatar_url: row.avatar_url,
    first_name: row.first_name,
    last_name: row.last_name,
    full_name: row.full_name ?? ([row.first_name, row.last_name].filter(Boolean).join(' ') || null),
    gender: row.gender,
    bio: row.bio,
    university: row.university,
    course: row.course,
    occupation: row.occupation,
    interests: row.interests,
    primary_goal: row.primary_goal,
    profile_completion_percentage: row.profile_completion_percentage ?? 0,
    notification_preferences: row.notification_preferences,
    onboarding_completed: row.onboarding_completed ?? false,
    saved_resources: row.saved_resources ?? [],
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}
