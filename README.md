<em>UniWell app screenshots</em>

<table>
  <tr>
    <td align="center">
      <img src="https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/gh-readme/2-UniWell.png" width="240" alt="UniWell screenshot 1" />
    </td>
    <td align="center">
      <img src="https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/gh-readme/6-UniWell.png" width="240" alt="UniWell screenshot 2" />
    </td>
    <td align="center">
      <img src="https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/gh-readme/5-UniWell.png" width="240" alt="UniWell screenshot 3" />
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/gh-readme/1-UniWell.png" width="240" alt="UniWell screenshot 4" />
    </td>
    <td align="center">
      <img src="https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/gh-readme/4-UniWell.png" width="240" alt="UniWell screenshot 5" />
    </td>
    <td align="center">
      <img src="https://pub-abe4a6405e724602a7fac9bf761e290c.r2.dev/gh-readme/3-UniWell.png" width="240" alt="UniWell screenshot 6" />
    </td>
  </tr>
</table>

# UniWell 🌟 - Your Personal Wellness Companion

## 🏆 Project Overview

UniWell is a comprehensive wellness tracking and self-improvement mobile application designed to help users enhance their daily routines, monitor personal growth, and maintain consistent healthy habits. Built with modern mobile development technologies, UniWell offers an intuitive and engaging platform for personal wellness management.

## ✨ Key Features

- 📅 **Smart Semester Planning**: Organize your academic life with intelligent semester tracking
- 📚 **Study Resources**: Access curated educational content from YouTube, Spotify podcasts, and news articles  
- 📝 **Digital Journaling**: Text and voice journaling with audio recording capabilities
- 🧘 **Mindfulness Games**: Breathing exercises, nature sounds, and coloring activities
- 📊 **Progress Tracking**: Visual analytics and streak monitoring for personal growth
- 🔐 **Secure Data**: Safe authentication with Supabase backend

## 🛠 Tech Stack

- **React Native** (v0.81.4)
- **TypeScript** (v5.9.2)
- **Expo** (v54.0.10) with Router
- **Expo Audio/Video** for multimedia features
- **Supabase** for backend and authentication
- **React Query** for data fetching and caching
- **Reanimated** for smooth animations
- **Async Storage** for local data persistence

## 📦 Prerequisites

- Node.js (v16+)
- npm or Yarn
- Expo CLI
- Smartphone or Emulator (iOS/Android)

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/seanmotanya/uniwell.git
cd uniwell
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npx expo start
```

## 📱 Running the App

- **iOS**: Press `i` in the terminal or scan QR code with Camera app
- **Android**: Press `a` in the terminal or use Expo Go app to scan QR code
- **Web**: Press `w` for web preview

## 🧩 Project Structure

```
uniwelll/
├── app/                 # Expo Router screens
│   └── (tabs)/          # Tab navigation screens
├── components/          # Reusable UI components
├── assets/              # Images, sounds, and static files
├── lib/                 # Utility functions (Supabase, resources)
├── contexts/            # React contexts for state management
├── types/               # TypeScript type definitions
├── scripts/             # Build and utility scripts
└── __tests__/           # Test files
```

## 🔔 Toast Notifications

UniWell uses a unified toast notification system that works seamlessly across all platforms (iOS, Android, and Web).

### Quick Usage

```tsx
// Always import from @/lib/toast - no platform-specific imports needed!
import { toast } from '@/lib/toast';

// Simple notifications
toast('Hello World!');
toast.success('Profile saved!');
toast.error('Something went wrong');

// With options
toast('Operation complete', {
  preset: 'done',
  duration: 3000  // Web only
});

// Handle async operations
await toast.promise(saveProfile(), {
  loading: 'Saving...',
  success: 'Profile saved!',
  error: 'Failed to save'
});
```

### Key Points

- ✅ **Always import from `@/lib/toast`** - The module automatically handles platform differences
- ✅ **No platform-specific code needed** - Write once, run everywhere
- ✅ **Fully typed** - TypeScript support included
- ✅ **Zero configuration** - Works out of the box

### Customization

Customize toast behavior with options:

```tsx
toast('Custom toast', {
  preset: 'done',        // 'done' | 'error' | 'none' | 'custom' | 'heart'
  duration: 5000,        // Duration in ms (Web only)
  position: 'top-right', // Position (Web only)
  haptic: 'success'      // Haptic feedback (Native only)
});
```

For more details, see the [full toast documentation](./lib/toast/README.md).

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📋 Todo List

- [ ] Implement more detailed analytics
- [ ] Add more customization options
- [ ] Develop cloud sync functionality
- [ ] Create more comprehensive testing suite

## 📞 Support

Encountering issues? Please file an issue on our GitHub repository or contact seanmotanya@gmail.com.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Made with ❤️ by the UniWell Team

