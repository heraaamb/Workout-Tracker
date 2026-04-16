# Workout Tracker

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0.33-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A clean and intuitive workout tracker mobile app built with React Native and Expo. Log workouts, track progress, and monitor personal records with ease.

## Repository

https://github.com/heraaamb/Workout-Tracker.git

## Demo

![App Demo](demo.gif)

*Placeholder for demo GIF - Add a short video showing the app in action.*

## Screenshots

| Home Screen                   | Add Workout                                 | Progress View                         |
| ----------------------------- | ------------------------------------------- | ------------------------------------- |
| ![Home](screenshots/home.png) | ![Add Workout](screenshots/add-workout.png) | ![Progress](screenshots/progress.png) |

*Placeholder for screenshots - Add actual images of key screens.*

## Features

### Core Functionality

* Workout Logging: Record sets, reps, and weight for exercises
* Exercise Support: Bodyweight and weighted exercises
* Calendar Integration: View workouts by date with muscle group indicators
* Progress Tracking: Personal records (PRs) and weight history
* Charts & Analytics: Visualize progress with interactive charts
* Custom Exercises: Add exercises beyond default muscle group lists

### User Experience

* Clean Interface: Minimal, distraction-free design
* Smooth Navigation: Seamless transitions between screens
* Real-time Updates: Instant feedback and data synchronization
* Edit & Delete: Swipe actions for quick modifications

## Tech Stack

| Category   | Technology             |
| ---------- | ---------------------- |
| Framework  | React Native (Expo)    |
| Language   | TypeScript             |
| Storage    | AsyncStorage           |
| Navigation | React Navigation       |
| Charts     | react-native-chart-kit |
| Icons      | @expo/vector-icons     |

## Architecture Overview

```
User Interface (Screens)
    ├── HomeScreen
    ├── AddWorkoutScreen
    ├── EditWorkoutScreen
    ├── MuscleDetailScreen
    └── MuscleProgressScreen

Data Layer (Utils)
    ├── storage.ts
    └── progressHelpers.ts

Core Components
    ├── WorkoutCard
    ├── FAB
    └── Theme
```

## Folder Structure

```
Workout-Tracker/
├── assets/
├── guidelines/
├── src/
│   ├── components/
│   ├── screens/
│   ├── styles/
│   ├── types.ts
│   └── utils/
├── App.tsx
├── app.json
├── babel.config.js
├── eas.json
├── index.js
├── package.json
├── README.md
└── tsconfig.json
```

## Setup Instructions

### Prerequisites

* Node.js (v18 or higher)
* npm or pnpm
* Expo CLI

### Installation

```bash
git clone https://github.com/heraaamb/Workout-Tracker.git
cd Workout-Tracker
npm install
```

### Start Development

```bash
npm start
```

---

## Run on Device

### Using Expo Go

1. Install Expo Go on your phone
2. Run `npm start`
3. Scan QR code

---

## 📦 Direct APK Installation (No EAS, No Queue)

This method builds a **real APK locally** and installs it on your phone.

### 1. Install Android Studio

* Install Android Studio
* Make sure these are installed:

  * Android SDK
  * SDK Platform
  * Build Tools

---

### 2. Set Environment Variables

```
ANDROID_HOME = C:\Users\YourName\AppData\Local\Android\Sdk
```

Add to PATH:

```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

---

### 3. Generate Native Android Code

```bash
npx expo prebuild
```

---

### 4. Build APK

```bash
cd android
.\gradlew assembleRelease
```

---

### 5. Locate APK

```
android/app/build/outputs/apk/release/app-release.apk
```

---

### 6. Install on Phone (Manual)

* Transfer APK to phone via USB / Drive / WhatsApp
* Enable **Install unknown apps**
* Tap APK → Install

---

### ⚡ Install using ADB (Recommended)

This is the fastest way to install directly from your PC.

#### 1. Enable USB Debugging

* Go to Developer Options
* Enable USB Debugging

#### 2. Connect phone and verify

```bash
adb devices
```

You should see your device listed.

---

#### 3. Install APK

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

#### 4. If app already installed

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

---

### ❌ Common Errors & Fixes

#### adb not recognized

Add to PATH:

```
C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools
```

---

#### device unauthorized

* Allow USB debugging on phone popup
* Reconnect cable

---

#### INSTALL_FAILED_VERSION_DOWNGRADE

```bash
adb uninstall com.yourpackage.name
```

---

#### App not installed (manual install)

* Uninstall previous version
* Free storage space

---

## Build for Production (Cloud - Optional)

```bash
npx eas build --platform android
```

---

## Known Issues

* Calendar may slow with large data
* AsyncStorage has size limits
* Charts may lag on older devices

---

## Roadmap

* Cloud sync
* Social features
* Advanced analytics
* Wearable integration
* Offline improvements

---

## Contributing

1. Fork repo
2. Create branch
3. Commit changes
4. Push
5. Open PR

---

## Author

heraaamb
https://github.com/heraaamb

---

## License

MIT License
