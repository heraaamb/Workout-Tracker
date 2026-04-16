
  # Workout Tracker

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0.33-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A clean and intuitive workout tracker mobile app built with React Native and Expo. Log workouts, track progress, and monitor personal records with ease.

## Repository

[https://github.com/heraaamb/Workout-Tracker.git](https://github.com/heraaamb/Workout-Tracker.git)

## Demo

![App Demo](demo.gif)

*Placeholder for demo GIF - Add a short video showing the app in action.*

## Screenshots

| Home Screen | Add Workout | Progress View |
|-------------|-------------|---------------|
| ![Home](screenshots/home.png) | ![Add Workout](screenshots/add-workout.png) | ![Progress](screenshots/progress.png) |

*Placeholder for screenshots - Add actual images of key screens.*

## Features

### Core Functionality
- **Workout Logging**: Record sets, reps, and weight for exercises
- **Exercise Support**: Bodyweight and weighted exercises
- **Calendar Integration**: View workouts by date with muscle group indicators
- **Progress Tracking**: Personal records (PRs) and weight history
- **Charts & Analytics**: Visualize progress with interactive charts
- **Custom Exercises**: Add exercises beyond default muscle group lists

### User Experience
- **Clean Interface**: Minimal, distraction-free design
- **Smooth Navigation**: Seamless transitions between screens
- **Real-time Updates**: Instant feedback and data synchronization
- **Edit & Delete**: Swipe actions for quick modifications

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React Native (Expo) |
| Language | TypeScript |
| Storage | AsyncStorage |
| Navigation | React Navigation |
| Charts | react-native-chart-kit |
| Icons | @expo/vector-icons |

## Architecture Overview

```
User Interface (Screens)
    ├── HomeScreen (Calendar & Workout List)
    ├── AddWorkoutScreen (Exercise Selection & Logging)
    ├── EditWorkoutScreen (Modify Existing Workouts)
    ├── MuscleDetailScreen (Exercise History)
    └── MuscleProgressScreen (Analytics & Charts)

Data Layer (Utils)
    ├── storage.ts (AsyncStorage Operations)
    └── progressHelpers.ts (Calculations & Analytics)

Core Components
    ├── WorkoutCard (Workout Display)
    ├── FAB (Floating Action Button)
    └── Theme (Styling Constants)
```

## Folder Structure

```
Workout-Tracker/
├── assets/                 # Static assets (images, icons)
├── guidelines/             # Project guidelines
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── FAB.tsx
│   │   └── WorkoutCard.tsx
│   ├── screens/            # App screens
│   │   ├── AddWorkoutScreen.tsx
│   │   ├── EditWorkoutScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── MuscleDetailScreen.tsx
│   │   └── MuscleProgressScreen.tsx
│   ├── styles/
│   │   └── theme.ts        # Theme constants
│   ├── types.ts            # TypeScript type definitions
│   └── utils/              # Utility functions
│       ├── progressHelpers.ts
│       └── storage.ts
├── App.tsx                 # Main app component
├── app.json                # Expo configuration
├── babel.config.js         # Babel configuration
├── eas.json                # EAS build configuration
├── index.js                # Entry point
├── package.json            # Dependencies and scripts
├── pnpm-workspace.yaml     # PNPM workspace config
├── README.md               # This file
└── tsconfig.json           # TypeScript configuration
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- Expo CLI

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/heraaamb/Workout-Tracker.git
   cd Workout-Tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   pnpm start
   ```

## Run on Device

### Using Expo Go App
1. Install Expo Go on your iOS/Android device
2. Scan the QR code displayed in the terminal after running `npm start`
3. The app will load on your device

### Build for Production
```bash
npx eas build --platform android
# or
npx eas build --platform ios
```

## Known Issues

- Calendar performance may degrade with large workout histories
- AsyncStorage limitations on data size for extensive logs
- Chart rendering issues on older Android devices

## Roadmap

- [ ] Cloud sync with user accounts
- [ ] Social features (workout sharing, leaderboards)
- [ ] Advanced analytics (rest periods, workout duration)
- [ ] Integration with wearable devices
- [ ] Offline mode improvements
- [ ] Dark mode support

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Author

**heraaamb** - [GitHub Profile](https://github.com/heraaamb)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
  