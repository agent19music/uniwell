/**
 * Profile Cache Service
 * 
 * Caches user profile data including avatar, username, preferences
 */

import { BaseCacheService } from './BaseCacheService';
import { CACHE_CONFIGS } from './types';

export interface CachedProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  full_name: string | null;
  bio: string | null;
  university: string | null;
  occupation: string | null;
  interests: string[] | null;
  primary_goal: string | null;
  profile_completion_percentage: number;
  notification_preferences: any;
  onboarding_completed: boolean;
  saved_resources: string[];
  updated_at: string;
}

class ProfileCacheService extends BaseCacheService<CachedProfile> {
  constructor() {
    super('@uniwell:profile', CACHE_CONFIGS.profile);
  }

  /**
   * Get profile by user ID
   */
  async getProfile(userId: string): Promise<CachedProfile | null> {
    return this.get(userId);
  }

  /**
   * Set profile for user ID
   */
  async setProfile(userId: string, profile: CachedProfile): Promise<void> {
    return this.set(profile, userId);
  }

  /**
   * Update specific fields
   */
  async updateFields(userId: string, fields: Partial<CachedProfile>): Promise<void> {
    await this.update(
      (existing) => {
        if (!existing) return fields as CachedProfile;
        return { ...existing, ...fields, updated_at: new Date().toISOString() };
      },
      userId
    );
  }

  /**
   * Add saved resource
   */
  async addSavedResource(userId: string, resourceId: string): Promise<void> {
    await this.update(
      (existing) => {
        if (!existing) return null as any;
        const saved_resources = [...(existing.saved_resources || [])];
        if (!saved_resources.includes(resourceId)) {
          saved_resources.push(resourceId);
        }
        return { ...existing, saved_resources };
      },
      userId
    );
  }

  /**
   * Remove saved resource
   */
  async removeSavedResource(userId: string, resourceId: string): Promise<void> {
    await this.update(
      (existing) => {
        if (!existing) return null as any;
        const saved_resources = (existing.saved_resources || []).filter(id => id !== resourceId);
        return { ...existing, saved_resources };
      },
      userId
    );
  }
}

export const profileCache = new ProfileCacheService();
