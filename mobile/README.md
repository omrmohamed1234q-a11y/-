# اطبعلي - React Native Mobile App

A modern, responsive React Native (Expo) mobile application for the "اطبعلي" (Print for Me) Arabic printing and digital services platform.

## Features

### Authentication System
- Email/password login and registration with full validation
- Social login with Google and Facebook integration
- Secure session management with auto-login
- Password reset functionality
- User profile management

### User Interface
- Modern, minimalist design with rounded corners and soft shadows
- Arabic-first RTL interface with proper localization
- Animated splash screen with logo
- Clean navigation with tab-based structure
- Responsive design optimized for mobile devices

### Core Functionality
- **Print Services**: Upload files, configure print settings, manage print jobs
- **Digital Store**: Browse and purchase educational materials and stationery
- **Rewards System**: Earn points through activities, redeem rewards, complete challenges
- **User Profile**: Manage account details, view statistics, access settings

### Technical Features
- Built with Expo for cross-platform development
- Supabase integration for backend services
- TypeScript for type safety
- React Native Reanimated for smooth animations
- Secure authentication with token management

## Project Structure

```
mobile/
├── app/                    # Expo Router file-based routing
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx      # Login screen
│   │   ├── signup.tsx     # Registration screen
│   │   └── forgot-password.tsx
│   ├── (tabs)/            # Main app tabs
│   │   ├── home.tsx       # Dashboard with quick actions
│   │   ├── print.tsx      # Print service interface
│   │   ├── store.tsx      # Digital marketplace
│   │   ├── rewards.tsx    # Gamification and rewards
│   │   └── profile.tsx    # User profile and settings
│   ├── splash.tsx         # Animated splash screen
│   └── _layout.tsx        # Root layout with auth provider
├── assets/                # Images and static assets
├── context/               # React contexts
│   └── AuthContext.tsx    # Authentication state management
├── lib/                   # Utility libraries
│   └── supabase.ts        # Supabase client configuration
├── services/              # Business logic services
│   └── auth.ts            # Authentication service
├── app.json              # Expo configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── babel.config.js       # Babel configuration
```

## Design System

### Colors
- Primary: #EF2D50 (Crimson Red)
- Secondary: #DC2626 (Dark Red)
- Background: #f8f9fa (Light Gray)
- Surface: #ffffff (White)
- Text: #1F2937 (Dark Gray)
- Subtle: #6B7280 (Medium Gray)

### Typography
- System font with Arabic support
- Right-to-left text alignment
- Proper font weights for hierarchy

### Components
- Rounded corners (8-16px radius)
- Soft shadows for depth
- Consistent spacing (12-24px)
- Touch-friendly sizing (minimum 44px)

## Development

### Prerequisites
- Node.js 18+
- Expo CLI
- React Native development environment

### Getting Started
1. Navigate to mobile directory: `cd mobile`
2. Install dependencies: `npm install`
3. Start development server: `npm start`
4. Run on device: `npm run ios` or `npm run android`

### Configuration
- Update Supabase credentials in `lib/supabase.ts`
- Configure social login providers in Supabase dashboard
- Customize app icon and splash screen in `assets/`

## Features Implementation Status

### ✅ Completed
- Authentication flow with social login options
- Splash screen with logo animation
- Main navigation structure
- Home dashboard with user stats
- Print service interface with file selection
- Store with product browsing and categories
- Rewards system with challenges and points
- User profile with settings and management

### 🔄 Next Steps
- File upload and camera integration
- Real-time print job tracking
- Payment integration
- Push notifications
- Offline functionality
- Performance optimizations

## Deployment

The app is configured for deployment to:
- iOS App Store (requires Apple Developer account)
- Google Play Store (requires Google Play Console account)
- Expo Application Services (EAS) for automated builds

## Support

For technical issues or questions about the mobile app implementation, refer to the main project documentation or contact the development team.