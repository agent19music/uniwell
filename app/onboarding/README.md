# Mental Wellness App Onboarding Module

This module provides a modern, professionally-designed onboarding experience for the mental wellness app. It's designed to detect the platform (web or mobile) and render an appropriate onboarding experience.

## Features

### Core Features
- Platform detection (web vs mobile)
- Responsive layouts for different screen sizes
- AsyncStorage integration to track first-time users
- Smooth animations with Reanimated 2

### Mobile Experience
- Edge-to-edge swipable onboarding screens
- Professional animations and transitions between slides
- Progress indicators showing current position
- Gesture handling for intuitive navigation (swipe left/right)
- Skip/continue buttons with clear calls-to-action

### Web Experience
- Modern hero section with mobile screen mockups
- Animated entrance of UI elements
- Clear calls-to-action for web signup
- Responsive design for various screen sizes

## Content Areas

The onboarding covers these four key pillars of the app:

1. **Productivity Tools** - Study timers, focus sessions, and goal tracking
2. **Professional Support** - Booking system for counseling appointments
3. **Student Community** - Peer support networks and discussion forums
4. **Self-Help Learning Resources** - Guided meditation and mindfulness exercises

## Technical Implementation

- Built with React Native and Expo SDK
- Uses Reanimated 2 for smooth, performant animations
- Implemented with AsyncStorage for tracking first-time user status
- Follows modern iOS 18 design principles with clean, minimal interfaces

## Usage

### Basic Usage

The onboarding module is designed to be used at the root level of your app. It will automatically detect if the user is a first-time visitor and show the appropriate onboarding experience.

```tsx
// In your app's root component
import OnboardingRoot from './onboarding';

function App() {
  return (
    <OnboardingRoot>
      {/* Your app content */}
    </OnboardingRoot>
  );
}
```

### Manual Navigation

You can also navigate to the onboarding screen programmatically:

```tsx
import { router } from 'expo-router';

// Navigate to onboarding
router.push('/onboarding');
```

## Customization

To customize the onboarding content, edit the `slidesData.ts` file in the onboarding directory. You can modify the slides, images, colors, and text to match your application's branding.

## Accessibility

The onboarding module follows accessibility best practices:
- All interactive elements are properly labeled
- Color contrast meets WCAG standards
- Supports screen readers
- Supports dynamic text sizing

## Performance Optimization

- Images are optimized for fast loading
- Animations are hardware-accelerated
- Minimal rerenders with memo and useCallback
- Lazy loading of assets

## Extension

The module is designed to be easily extended. Some possible extensions:
- Add more slides
- Implement user preferences collection during onboarding
- Add language selection
- Integrate with analytics to track completion rates 