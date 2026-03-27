# Broker IA Mobile

React Native mobile app for the Broker IA trading signal platform.

## Features

- Cross-platform (iOS and Android)
- User authentication with JWT
- Real-time trading signals
- DCA simulator
- Performance dashboard
- Persistent local storage with AsyncStorage
- Push notifications support
- Dark theme optimized for trading

## Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Xcode (for iOS development)
- Android Studio (for Android development)

## Installation

```bash
npm install
```

## Environment Setup

```bash
cp .env.example .env
```

Update `.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

## Running the Application

### Development

```bash
npm start
```

This will open the Expo DevTools.

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Web
```bash
npm run web
```

## Navigation Structure

```
Root
├── LoginScreen (Auth Stack)
└── MainTabs (when logged in)
    ├── Dashboard
    ├── Signals
    ├── Simulator
    └── Profile
```

## Screens

- **LoginScreen** - User authentication
- **DashboardScreen** - Stats and recent signals
- **SignalsScreen** - Signal list with filtering
- **SignalDetailScreen** - Signal details and analysis
- **SimulatorScreen** - DCA simulator
- **ProfileScreen** - User profile and settings

## State Management

- React hooks for local state
- AsyncStorage for persistent data
- Axios for API calls

## Styling

- React Native StyleSheet
- Dark theme (Slate colors)
- Responsive layouts
- Platform-specific styles

## API Integration

Communicates with backend at `EXPO_PUBLIC_API_URL`.

Authentication uses JWT tokens stored in AsyncStorage.

## Building for Production

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

## Deployment

### App Store (iOS)
```bash
eas submit --platform ios
```

### Google Play (Android)
```bash
eas submit --platform android
```

## Troubleshooting

- Clear cache: `expo start -c`
- Reset modules: `npm install`
- Check server connection in `.env`
- Enable developer mode on device

## Performance Tips

- Use FlatList for large lists
- Memoize expensive computations
- Lazy load images
- Optimize re-renders

## License

MIT
