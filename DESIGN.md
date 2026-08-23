# Design system

Public theme entry: `constants/theme`. Compatibility re-exports remain in `constants/Colors.ts` and `hooks/useTheme.ts`.

## Contrast (measured in the theme tokens)

Light canvas `#F7F3EF` / text `#1C1917`: 14.6:1  
Light muted `#78716C` on canvas: 4.6:1  
Light link `#245BBE` on canvas: 5.4:1  
Light accent `#2D6CDF` / text on accent `#FFFFFF`: 4.7:1  
Dark canvas `#171513` / text `#FAF7F2`: 16.4:1  
Dark muted `#A89E94` on canvas: 7.2:1  
Dark link `#A8C5FF` on canvas: 9.1:1  

Disabled controls use surface + muted text + `accessibilityState`, not opacity alone.

## Motion

Press 120ms, state 160ms, overlay 240ms. No tab-slide or decorative chart drawing.

## Device checklist (user-owned)

VoiceOver/TalkBack, Android keyboard/autofill, notched safe areas, press scale at 60/120 fps, and physical touch targets were **not verified** on hardware in this work.
