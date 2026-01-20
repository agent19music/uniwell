# Uniwell Brand Design Guide

> Student Mental Wellness — Mobile-First, Lean, Beautiful

---

## 🎯 Brand Identity

### Mission
Uniwell is a **student-focused mental wellness companion** — helping university students build healthy habits, track their emotional journey, and access resources that support their wellbeing.

### Design Philosophy
- **Warm Minimalism**: Clean interfaces with warm, inviting tones
- **Mobile-First**: Every decision optimized for mobile experience
- **Predictable & Pretty**: Consistent patterns that feel intuitive and premium
- **Student-Centric**: Features and language designed for university life

---

## 🎨 Color System

### Light Mode
| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#F5EDE8` | Warm beige — main background |
| `surface` | `#FFFFFF` | Cards, elevated elements |
| `primary` | `#1A1A1A` | Headers, key actions, primary text |
| `textPrimary` | `#1A1A1A` | Body text |
| `textSecondary` | `#9E9289` | Secondary/muted text |
| `textTertiary` | `#C8BCB3` | Placeholder, disabled states |
| `border` | `#E8DDD6` | Subtle borders, dividers |
| `success` | `#A8B896` | Sage green — positive states |
| `warning` | `#E89B8E` | Coral — warnings, alerts |
| `error` | `#DC2626` | Critical errors |

### Dark Mode
| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#1A1A1A` | Near black — main background |
| `surface` | `#2A2A2A` | Cards, elevated elements |
| `primary` | `#FFFFFF` | Headers, key actions |
| `textPrimary` | `#FFFFFF` | Body text |
| `textSecondary` | `#C8BCB3` | Secondary/muted text |
| `textTertiary` | `#9E9289` | Placeholder, disabled states |
| `border` | `#3A3A3A` | Subtle borders |

### Overlay Pattern
```tsx
// Standard mesh background with overlay
<ImageBackground
  source={isDark ? require('../assets/mesh-99dark.png') : require('../assets/mesh-99.png')}
  style={StyleSheet.absoluteFillObject}
  resizeMode="cover"
>
  <View style={{
    ...StyleSheet.absoluteFillObject,
    backgroundColor: isDark ? 'rgba(28, 24, 21, 0.85)' : 'rgba(254, 253, 251, 0.85)'
  }} />
</ImageBackground>
```

---

## 🔤 Typography

### Font Families
| Name | Usage | Import |
|------|-------|--------|
| `Vercetti-Regular` | Headers, titles, display text | `SFUIText-Regular.ttf` |
| `SF-Regular` | Body text, labels, inputs | `SFUIText-Regular.ttf` |

### Type Scale
| Style | Size | Weight | Font | Usage |
|-------|------|--------|------|-------|
| Display | 34-38px | 700 | Vercetti | Welcome screens, hero text |
| Title | 20-28px | 600 | Vercetti | Section headers, page titles |
| Body | 15-17px | 400 | SF-Regular | Paragraphs, descriptions |
| Caption | 12-14px | 500 | SF-Regular | Labels, hints, metadata |

### Examples
```tsx
// Display/Hero Title
<Text style={{
  fontSize: 34,
  fontWeight: '700',
  fontFamily: 'Vercetti-Regular',
  letterSpacing: -0.5,
  color: colors.textPrimary
}}>
  Welcome to Uniwell
</Text>

// Section Title
<Text style={{
  fontSize: 20,
  fontWeight: '600',
  fontFamily: 'Vercetti-Regular',
  color: colors.textPrimary
}}>
  Your Progress
</Text>

// Body Text
<Text style={{
  fontSize: 16,
  fontFamily: 'SF-Regular',
  lineHeight: 24,
  color: colors.textSecondary
}}>
  Start your wellness journey today
</Text>
```

---

## 📐 Spacing & Layout

### Spacing Scale (theme.space equivalent)
| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight gaps |
| `sm` | 8px | Icon gaps, inline spacing |
| `md` | 12px | Inner padding |
| `lg` | 16px | Card padding, section gaps |
| `xl` | 24px | Screen padding, major sections |
| `xxl` | 32px | Hero spacing, visual breaks |

### Screen Layout Pattern
```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
  <ScrollView 
    style={{ flex: 1 }}
    contentContainerStyle={{ 
      paddingHorizontal: 24,  // xl
      paddingBottom: 100 
    }}
    showsVerticalScrollIndicator={false}
  >
    {/* Content */}
  </ScrollView>
</SafeAreaView>
```

---

## 🧩 Components

### Card
Standard elevated container with 24px border radius:
```tsx
<View style={{
  backgroundColor: colors.card,
  borderRadius: 24,
  padding: 20,
  shadowColor: colors.shadow.medium,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 1,
}}>
  {/* Card content */}
</View>
```

### Input Field
```tsx
<View style={{
  flexDirection: 'row',
  alignItems: 'center',
  height: 56,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.surface,
  paddingHorizontal: 16,
  gap: 12,
}}>
  <Icon size={20} color={colors.textSecondary} />
  <TextInput
    style={{ flex: 1, fontSize: 16, fontFamily: 'SF-Regular', color: colors.textPrimary }}
    placeholderTextColor={colors.textTertiary}
  />
</View>
```

### Primary Button
```tsx
<TouchableOpacity style={{
  height: 56,
  borderRadius: 16,
  backgroundColor: colors.primary,
  alignItems: 'center',
  justifyContent: 'center',
}}>
  <Text style={{
    color: isDark ? colors.background : '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF-Regular',
  }}>
    Get Started
  </Text>
</TouchableOpacity>
```

### Secondary/Ghost Button
```tsx
<TouchableOpacity style={{
  height: 56,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.surface,
  alignItems: 'center',
  justifyContent: 'center',
}}>
  <Text style={{
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'SF-Regular',
  }}>
    I already have an account
  </Text>
</TouchableOpacity>
```

### Back Button (Circular)
```tsx
<TouchableOpacity style={{
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: colors.surface,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
}}>
  <ArrowLeft size={24} color={colors.textPrimary} />
</TouchableOpacity>
```

---

## ✨ Animation Patterns

### Entrance Animation
Standard fade + slide for screen content:
```tsx
const fadeAnim = useRef(new Animated.Value(0)).current;
const slideAnim = useRef(new Animated.Value(30)).current;

useEffect(() => {
  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }),
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }),
  ]).start();
}, []);

// Apply to view
<Animated.View style={{
  opacity: fadeAnim,
  transform: [{ translateY: slideAnim }]
}}>
```

---

## 🎯 Icons

### Library
Use **Phosphor React Native** for all icons:
```tsx
import { ArrowLeft, Envelope, LockSimple, User, Eye, EyeSlash } from 'phosphor-react-native';

<ArrowLeft size={24} color={colors.textPrimary} weight="regular" />
<Envelope size={20} color={colors.textSecondary} />
```

### Weights
- `regular` — Default for most UI
- `fill` — Selected/active states
- `bold` — Emphasis, headers

---

## 📱 Screen Patterns

### Start Screen (Landing)
- Full mesh background with overlay
- Centered logo + app name
- Tagline describing the app
- Two primary CTAs: "Sign Up" and "Log In"
- Optional: social login divider

### Auth Screens (Login/Signup)
- Back button top-left
- Large title + subtitle
- Form with labeled inputs
- Primary action button
- Divider with "or" text
- Google/social login option
- Footer link to alternate auth flow

### Onboarding Flow
- Horizontal paging FlatList
- Each slide: icon, title, description
- Progress dots or pagination
- "Continue" button advances
- Final slide completes onboarding

### Home Dashboard
- Avatar + notifications in header
- Greeting with user's first name
- Daily prompt/reflection input
- Mood selector card
- Progress metrics
- Feature cards (2x2 grid, 48% width)

---

## 🚫 What NOT to Include

- No web-specific layouts or `Platform.OS === 'web'` branches
- No therapist/admin UI (separate app)
- No complex gradients (keep minimal)
- No device frames around content
- No placeholder images (use generated assets)

---

## ✅ Quality Checklist

- [ ] All text uses correct font family
- [ ] Colors from theme, not hardcoded
- [ ] 24px border radius on cards
- [ ] 16px border radius on buttons/inputs
- [ ] 56px height for primary actions
- [ ] Phosphor icons, appropriate weight
- [ ] Fade + slide entrance animations
- [ ] SafeAreaView with proper edges
- [ ] KeyboardAvoidingView for forms
- [ ] Dark mode supported via `useTheme()`
