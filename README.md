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

# UniWell — student wellness companion

UniWell helps students track mood, routines, journals, sleep, and campus schedules. Insights are observations, not diagnoses. If you are in crisis, contact local emergency services or a trusted support line.

## Core Features
- Mood check-ins and daily reflection journaling
- Routines, streaks, and streak-related progress tracking
- Journals with text + voice/video entries
- Academic timetable: semesters + class schedule (day/week view)
- Mind games: breathing exercises and relaxing sound loops
- Wellness dashboards: monthly progress + sleep stats
- Community: a “Wellness Hub” feed with post creation
- Personalized library: YouTube / Spotify / News content recommendations

## 🛠 Tech Stack

- **React Native** (v0.81.4)
- **TypeScript** (v5.9.2)
- **Expo** (v54.0.10) with Router
- **Expo Audio/Video** for multimedia features
- **Supabase** for backend and authentication
- **React Query** for data fetching and caching
- **Reanimated** for smooth animations
- **Async Storage** for local data persistence

## Environment Variables

Copy `.env.example` to `.env` and set the values below.

Required:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_PROJECT_ID`

Optional (used by specific features):
- `EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY` (chat/AI features)
- `EXPO_PUBLIC_YOUTUBE_API_KEY` (library resources)
- `EXPO_PUBLIC_NEWS_API_KEY` (library resources)
- `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` / `EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET` (library resources)
- `EXPO_PUBLIC_SEGMENT_WRITE_KEY` (analytics)

## 📦 Prerequisites

- Node.js (v16+)
- pnpm
- Expo CLI
- Smartphone or Emulator (iOS/Android)

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/agent19music/uniwell.git
cd uniwell
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm expo start
```

## 📱 Running the App

- **iOS**: Press `i` in the terminal or scan QR code with Camera app
- **Android**: Press `a` in the terminal or use Expo Go app to scan QR code
- **Web**: Press `w` for web preview

## 🧩 Project Structure

```
uniwell/
├── app/                 # Expo Router screens/routes
├── components/          # Reusable UI components
├── contexts/            # Global app state (Auth, Mood, Routine, Semester, Community)
├── lib/                 # Supabase client + services, caching, toast helpers
├── modals/              # Create/edit flows
├── scripts/             # Resource + scheduler scripts
└── __tests__/          # Jest tests
```

## Development Notes
- Toasts: use `lib/toast` for cross-platform notifications.
- Reads: prefer the caching layer in `lib/cache` before hitting Supabase.

## Development commands

```sh
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test --runInBand
pnpm doctor
```

`package.json` stays `"private": true` so the app is not published to npm. The GitHub repository is the contribution surface.

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [DESIGN.md](DESIGN.md).

## Architecture

Screens talk to feature query hooks. Auth, theme, and toast stay in small contexts. Offline writes go through `lib/sync`. Database row types come from `types/database.ts`.

## Scripts

- `pnpm update-resources`: refreshes library resources
- `pnpm start-scheduler`: scheduled resource updates

## 📞 Support

Encountering issues? Please file an issue on our GitHub repository or contact seanmotanya@gmail.com.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

An Uzski Corp Product

