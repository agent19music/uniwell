# Platform-Specific Implementation Guide

This document explains how platform-specific exports are configured in the Uniwell Expo project to ensure optimal bundling and correct functionality across web, iOS, and Android platforms.

## Overview

Expo's Metro bundler supports automatic platform resolution through file extensions:
- `.web.{js,ts,tsx}` - Web-specific implementation
- `.native.{js,ts,tsx}` - Native implementation (iOS & Android)
- `.android.{js,ts,tsx}` - Android-specific implementation
- `.ios.{js,ts,tsx}` - iOS-specific implementation

## Current Platform-Specific Modules

### 1. Toast Notifications (`/lib/toast/`)

**Structure:**
```
lib/toast/
├── index.ts          # Conditional export (fallback)
├── index.web.ts      # Web implementation using react-hot-toast
├── index.android.ts  # Android implementation using burnt
└── index.ios.ts      # iOS implementation using burnt
```

**Usage:**
```typescript
import { toast } from '@/lib/toast';

// Works on all platforms
toast.success('Operation completed!');
```

### 2. Supabase Client (`/lib/supabase`)

**Structure:**
```
lib/
├── supabase.ts       # Conditional export (fallback)
├── supabase.web.ts   # Web client using localStorage
└── supabase.native.ts # Native client using AsyncStorage
```

**Key Differences:**
- **Web**: Uses browser's localStorage, enables URL detection
- **Native**: Uses AsyncStorage, manages AppState for token refresh

**Usage:**
```typescript
import { supabase } from '@/lib/supabase';

// Automatically uses the correct client
const { data } = await supabase.from('users').select();
```

### 3. Notification Handler (`/lib/NotificationHandler`)

**Structure:**
```
lib/
├── NotificationHandler.tsx       # Conditional export (fallback)
├── NotificationHandler.web.tsx   # Web notifications using browser API
└── NotificationHandler.native.tsx # Native using expo-notifications
```

**Key Differences:**
- **Web**: Uses browser Notification API, falls back to toast
- **Native**: Uses expo-notifications with push tokens

**Usage:**
```typescript
import { registerForPushNotificationsAsync } from '@/lib/NotificationHandler';

// Works across all platforms
await registerForPushNotificationsAsync();
```

## Implementation Patterns

### Pattern 1: File-System Aliasing (Recommended)

Create separate files with platform extensions:

```typescript
// component.web.tsx
export const MyComponent = () => {
  // Web-specific implementation
  return <div>Web Version</div>;
};

// component.native.tsx
export const MyComponent = () => {
  // Native implementation
  return <View><Text>Native Version</Text></View>;
};
```

### Pattern 2: Conditional Export (Fallback)

Use for environments that don't support platform extensions:

```typescript
// component.ts
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

let implementation: any;

if (isWeb) {
  implementation = require('./component.web');
} else {
  implementation = require('./component.native');
}

export const MyComponent = implementation.MyComponent;
```

## Best Practices

1. **Keep Interfaces Consistent**: All platform-specific implementations should export the same interface
   
2. **Minimize Duplication**: Share common logic in a base file when possible

3. **Test All Platforms**: Always test changes on web, iOS, and Android

4. **Bundle Size**: Platform-specific files ensure unused code isn't included in bundles

5. **Type Safety**: Use TypeScript interfaces to ensure consistency across implementations

## Adding New Platform-Specific Modules

1. Create the platform-specific files:
   ```
   module.web.ts    # Web implementation
   module.native.ts # Native implementation
   ```

2. (Optional) Create a fallback conditional export:
   ```typescript
   // module.ts
   import { Platform } from 'react-native';
   
   const module = Platform.OS === 'web' 
     ? require('./module.web')
     : require('./module.native');
   
   export default module;
   ```

3. Import normally in your code:
   ```typescript
   import module from './module';
   ```

## Testing Platform-Specific Code

```bash
# Test web build
npx expo export --platform web

# Test iOS build
npx expo run:ios

# Test Android build
npx expo run:android
```

## Troubleshooting

### Issue: Module not found
- Ensure file extensions are correct (.web.ts, .native.ts)
- Clear Metro cache: `npx expo start -c`

### Issue: Wrong implementation loaded
- Check Platform.OS is being evaluated correctly
- Verify Metro bundler configuration in metro.config.js

### Issue: TypeScript errors
- Ensure all platform variants export the same types
- Use a shared interface file if needed

## Benefits

1. **Optimized Bundles**: Each platform only includes its specific code
2. **Better Performance**: No runtime platform checks needed
3. **Cleaner Code**: Platform-specific logic is isolated
4. **Easier Maintenance**: Changes to one platform don't affect others
5. **Expo Compatibility**: Works seamlessly with Expo's build system
