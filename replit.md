# Overview

"اطبعلي" is a modern Arabic-localized printing and e-commerce platform with both web and mobile applications. The platform combines printing services, smart scanning with OCR, PDF manipulation tools, and an integrated marketplace for educational materials. Designed for students, teachers, and professionals in Arabic-speaking markets, it features a gamification system with bounty points and rewards to encourage user engagement.

## Platform Components
- **Web Application**: React/TypeScript/Vite-based responsive web app with Replit Auth integration
- **Mobile Application**: React Native (Expo) mobile app with comprehensive multi-provider authentication
- **Backend Services**: Express.js API with Supabase integration and secure session management

## Recent Authentication Enhancements
- **Multi-Provider Authentication**: Complete integration of Supabase, Replit Auth, Google, and Facebook OAuth
- **Secure Token Management**: Enhanced session handling with refresh tokens and remember me functionality
- **Mobile-First Auth Service**: Comprehensive authentication service supporting all providers with proper error handling
- **Password Reset Flow**: Complete forgot password functionality with email-based reset links
- **VIP User Experience**: Premium user highlights and gradient-based UI enhancements

## Comprehensive Order Tracking System (January 2025)
- **Complete Purchase Journey**: Full Talabat/Amazon-style cart, checkout, and delivery tracking
- **Database Schema**: Enhanced orders table with 40+ fields for complete tracking lifecycle
- **Order Timeline Tracking**: Real-time status updates from order placement to delivery
- **Driver Integration**: Live tracking, messaging, and interaction with delivery personnel
- **Post-Delivery Features**: Rating system, review submission, and invoice generation
- **Multiple Payment Methods**: Support for cash, card, Vodafone Cash, Paymob, PayTabs, and Fawry
- **Address Management**: Complete address selection with maps integration capability
- **Delivery Scheduling**: ASAP and scheduled delivery slots with time windows

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

### Web Application
- **React 18** with TypeScript for type safety and modern component patterns
- **Vite** as the build tool for fast development and optimized production builds
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **Tailwind CSS** with shadcn/ui components for consistent, accessible UI design
- **Arabic-first design** with RTL support and IBM Plex Sans Arabic font

### Mobile Application
- **React Native (Expo)** with TypeScript for cross-platform mobile development
- **Expo Router** for file-based navigation with type safety
- **React Native Reanimated** for smooth animations and gestures
- **Native-optimized UI** with platform-specific components and styling
- **Arabic RTL support** with mobile-optimized layouts and interactions

## Backend Architecture
- **Express.js** server with TypeScript for API endpoints
- **Drizzle ORM** for type-safe database operations with PostgreSQL
- **Supabase** as the primary Backend-as-a-Service for authentication, database, and real-time features
- **Server-side rendering** setup with Vite middleware for development

## Data Storage Solutions
- **PostgreSQL** database via Supabase with comprehensive schema including:
  - User management with gamification metrics (bounty points, levels, achievements)
  - Product catalog with Arabic/English localization
  - Print job tracking and queue management
  - Order and cart management
  - Rewards and challenges system
- **Supabase Storage** for file uploads and document management
- **Drizzle migrations** for schema version control

## Authentication and Authorization
- **Supabase Auth** for user authentication with email/password
- **Row Level Security (RLS)** policies for data access control
- **Custom user profiles** with teacher/student role differentiation
- **Session management** with automatic token refresh

## External Dependencies
- **Supabase**: Primary database, authentication, and storage provider
- **Neon Database**: PostgreSQL hosting (as indicated by connection string)
- **Radix UI**: Accessible component primitives for the design system
- **Font Awesome**: Icon library for Arabic-friendly iconography
- **React Hook Form**: Form state management with Zod validation
- **Tailwind CSS**: Utility-first CSS framework with custom Arabic design tokens

The architecture follows a modern full-stack pattern with strong typing throughout, optimized for Arabic content delivery and mobile-first responsive design. The application is structured for scalability with modular components and clear separation between client and server concerns.