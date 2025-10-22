import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from './supabase'

// Environment variables
const SEGMENT_WRITE_KEY = process.env.EXPO_PUBLIC_SEGMENT_WRITE_KEY

// Persist and reuse an anonymousId for client analytics
const ANON_ID_STORAGE_KEY = 'analytics_anon_id'

async function getAnonymousId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(ANON_ID_STORAGE_KEY)
    if (existing) return existing
    const id = uuidv4()
    await AsyncStorage.setItem(ANON_ID_STORAGE_KEY, id)
    return id
  } catch {
    // Fallback to volatile UUID if storage fails
    return uuidv4()
  }
}

async function sendToSegment(event: string, properties: Record<string, any>) {
  if (!SEGMENT_WRITE_KEY) return
  const anonymousId = await getAnonymousId()

  const body = {
    anonymousId,
    event,
    properties: {
      platform: Platform.OS,
      ...properties,
    },
  }

  try {
    await fetch('https://api.segment.io/v1/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa(`${SEGMENT_WRITE_KEY}:`),
      },
      body: JSON.stringify(body),
    })
  } catch (e) {
    // Swallow network errors
  }
}

async function sendToSupabase(event: string, properties: Record<string, any>) {
  // Optional: attempt to insert into a table if it exists with permissive RLS
  // Table suggestion: client_events(event text, properties jsonb, created_at timestamptz default now())
  try {
    // Best-effort; ignore failures if table/RLS not configured
    await supabase.from('client_events').insert({
      event,
      properties,
    })
  } catch (e) {
    // Ignore if table doesn't exist or RLS denies
  }
}

export async function track(event: string, properties: Record<string, any> = {}) {
  // Fire-and-forget to both backends where possible
  void sendToSegment(event, properties)
  void sendToSupabase(event, properties)
}
