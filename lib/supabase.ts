/**
 * Supabase Client Module
 * 
 * This module provides platform-specific Supabase client implementations.
 * Expo's metro bundler will automatically select the correct version:
 * - supabase.web.ts for web platform
 * - supabase.native.ts for iOS and Android
 * 
 * This file serves as a fallback for environments that don't support
 * platform-specific extensions.
 */

import { Platform } from 'react-native';

// Conditionally import based on platform
const isWeb = Platform.OS === 'web';

// Use dynamic imports to ensure proper bundling
let supabaseModule;

if (isWeb) {
  // Web implementation - uses localStorage
  supabaseModule = require('./supabase.web');
} else {
  // Native implementation - uses AsyncStorage
  supabaseModule = require('./supabase.native');
}

export const supabase = supabaseModule.supabase;
