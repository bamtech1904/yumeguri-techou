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
npm run dev

# Build for web
npm run build:web

# Lint code
npm run lint
```

## Data Models

The core data structure is the `Visit` interface in `store/visitStore.ts`:
- Basic info: id, date, bathName, visitTime, rating, comment
- Extended features: address, facilities, photos, fee, repeatIntention
- Detailed ratings: cleanliness, crowdedness, service, comfort

## Key Features Implementation

- **Calendar View**: Users can view visits by month with visual indicators
- **Visit Recording**: Modal-based flow for adding/editing visits
- **Facility Search**: Mock data currently, designed for Google Places API integration
- **Local Storage**: All data persisted via AsyncStorage with auto-save
- **State Management**: Zustand store handles visits with CRUD operations

## Development Notes

- The app uses TypeScript with strict mode enabled
- Path alias `@/*` maps to root directory
- Currently uses mock data for facility search (ready for Google Places API)
- No backend integration yet - designed for Firebase/Firestore in future
- Japanese UI text throughout the application

## Future Integration Points

- Google Places API for real facility search
- Firebase for cloud sync and user authentication
- Google Maps integration for location services
- Image storage for visit photos