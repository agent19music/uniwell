import { z } from 'zod';

export const publicEnvSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: z.string().min(1).optional(),
  EXPO_PUBLIC_PROJECT_ID: z.string().min(1).optional(),
  EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY: z.string().min(1).optional(),
  EXPO_PUBLIC_YOUTUBE_API_KEY: z.string().min(1).optional(),
  EXPO_PUBLIC_NEWS_API_KEY: z.string().min(1).optional(),
  EXPO_PUBLIC_SPOTIFY_CLIENT_ID: z.string().min(1).optional(),
  EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET: z.string().min(1).optional(),
  EXPO_PUBLIC_SEGMENT_WRITE_KEY: z.string().min(1).optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function readPublicEnv(source: NodeJS.ProcessEnv = process.env): PublicEnv {
  return publicEnvSchema.parse({
    EXPO_PUBLIC_SUPABASE_URL: source.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: source.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: source.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    EXPO_PUBLIC_PROJECT_ID: source.EXPO_PUBLIC_PROJECT_ID,
    EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY: source.EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY,
    EXPO_PUBLIC_YOUTUBE_API_KEY: source.EXPO_PUBLIC_YOUTUBE_API_KEY,
    EXPO_PUBLIC_NEWS_API_KEY: source.EXPO_PUBLIC_NEWS_API_KEY,
    EXPO_PUBLIC_SPOTIFY_CLIENT_ID: source.EXPO_PUBLIC_SPOTIFY_CLIENT_ID,
    EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET: source.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET,
    EXPO_PUBLIC_SEGMENT_WRITE_KEY: source.EXPO_PUBLIC_SEGMENT_WRITE_KEY,
  });
}

export function getSupabaseEnv(source: NodeJS.ProcessEnv = process.env) {
  const url = source.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = source.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }
  return publicEnvSchema
    .pick({ EXPO_PUBLIC_SUPABASE_URL: true, EXPO_PUBLIC_SUPABASE_ANON_KEY: true })
    .parse({
      EXPO_PUBLIC_SUPABASE_URL: url,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    });
}
