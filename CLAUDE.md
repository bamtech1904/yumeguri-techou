# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "湯めぐり手帳" (Yumeguri Techou) - a Japanese bath house (sento) visit tracking app built with React Native and Expo. The app allows users to record their visits to sento/onsen facilities using a calendar interface, track ratings and details, and discover new facilities through search and map functionality.

## Architecture

- **Framework**: React Native with Expo SDK 53
- **Navigation**: Expo Router with typed routes
- **State Management**: Zustand for global state
- **Storage**: AsyncStorage for local data persistence
- **UI Components**: Native components with Lucide React Native icons
- **Maps**: react-native-maps for location features
- **Calendar**: react-native-calendars for visit tracking

## Key Components Structure

- `app/`: Expo Router file-based routing
  - `(tabs)/`: Tab navigation with index (calendar), map, profile, settings
  - `_layout.tsx`: Root layout with Stack navigator
- `store/visitStore.ts`: Zustand store for visit data management
- `components/`: Reusable UI components (FacilitySearch, VisitCard)
- `hooks/`: Custom hooks (useFrameworkReady)

## Common Development Commands

```bash
# Start development server
pnpm dev

# Build for web
pnpm build:web

# Lint code
pnpm lint

# Install dependencies
pnpm install
```

## Data Models

The core data structure is the `Visit` interface in `store/visitStore.ts`:
- Basic info: id, date, bathName, visitTime, rating, comment
- Extended features: address, facilities, photos, fee, repeatIntention
- Detailed ratings: cleanliness, crowdedness, service, comfort

## Key Features Implementation

- **Calendar View**: Users can view visits by month with visual indicators
- **Visit Recording**: Modal-based flow for adding/editing visits with facility search integration
- **Facility Search**: Real-time Google Places API integration for bathhouse discovery
- **Google Maps Integration**: Interactive maps with facility markers and navigation
- **Location Services**: GPS-based nearby facility search with distance calculation
- **Local Storage**: All data persisted via AsyncStorage with auto-save
- **State Management**: Zustand store handles visits with CRUD operations

## Development Notes

- The app uses TypeScript with strict mode enabled
- Path alias `@/*` maps to root directory
- Google Places API integrated with caching and offline fallback
- Location permissions handled for iOS and Android
- Japanese UI text throughout the application
- ESLint configured with Expo rules for code quality

## API Integration

- **Google Places API**: Real facility search with ratings, photos, and details
- **Location Services**: GPS coordinates for distance calculation and navigation
- **Error Handling**: Graceful fallbacks for network and permission issues
- **Caching Strategy**: Local storage for API responses to reduce costs

## Environment Setup

### API Keys Setup
1. **Create .env file**: Copy from `.env.example` (already created)
2. **Get Google Places API key**: 
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Places API
   - Create API key with proper restrictions
   - See detailed setup: `docs/google-api-setup.md`
3. **Update .env file**:
   ```
   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_actual_api_key_here
   ```
4. **Restart development server** to load new environment variables

### Expo Configuration
The app is configured for Expo managed workflow with:
- **Expo Location**: GPS and location permissions for nearby facility search
- **Map Display**: Currently using placeholder view (ready for future MapView integration)
- **Location Permissions**: iOS/Android location access configured in app.json
- **Plugins**: expo-location, expo-router configured

### Known Issues & Solutions
- **react-native-maps**: Removed due to Expo managed workflow incompatibility
- **Map Display**: Currently shows location coordinates and facility count as placeholder
- **Cache Issues**: Run `pnpm dev --clear` if encountering route/component loading issues

### Development Commands
```bash
# Start Expo development server
pnpm dev

# Clear cache if needed
pnpm dev --clear

# Build for web
pnpm build:web
```

## Phase 1 (MVP) Status

✅ **Completed Features:**
- Google Places API integration for facility search
- Google Maps with interactive markers and callouts
- Location-based nearby facility discovery
- Real-time search with distance calculation
- Visit tracking with rich facility metadata
- Map/list toggle view with user location

🔄 **Ready for Phase 2:**
- Firebase integration for cloud sync
- Photo capture and storage
- Advanced statistics and analytics
- Badge system and gamification
- Push notifications