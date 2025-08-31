# Overview

"اطبعلي" is a modern Arabic-localized printing and e-commerce platform offering web and mobile applications. Its core purpose is to provide integrated printing services, smart scanning with OCR, PDF manipulation tools, and an educational materials marketplace. The platform targets students, teachers, and professionals in Arabic-speaking markets, featuring a gamification system to enhance user engagement. 

The platform now features production-ready security with completely hidden admin/driver access routes and strict authentication system. Key capabilities include comprehensive inquiry/quotation management, advanced admin and teacher profile management, robust driver management system, and secure account management with complete access control.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

### Web Application
- **Technology Stack**: React 18 with TypeScript, Vite for build processes, Wouter for routing, and TanStack Query for state management.
- **UI/UX**: Tailwind CSS with shadcn/ui components for consistent and accessible design. Features Arabic-first design with RTL support and IBM Plex Sans Arabic font.

### Mobile Application
- **Technology Stack**: React Native (Expo) with TypeScript for cross-platform development, Expo Router for navigation, and React Native Reanimated for animations.
- **UI/UX**: Native-optimized UI with platform-specific components, Arabic RTL support, and mobile-optimized layouts.

## Backend Architecture
- **Technology Stack**: Express.js server with TypeScript for API endpoints.
- **Database ORM**: Drizzle ORM for type-safe PostgreSQL operations.
- **BaaS**: Supabase is the primary Backend-as-a-Service for authentication, database, and real-time features.
- **Rendering**: Server-side rendering setup with Vite middleware for development.

## Data Storage Solutions
- **Database**: PostgreSQL via Supabase, storing user management data (gamification, points, levels), product catalog (Arabic/English localization), print job tracking, order and cart management, rewards, and challenges.
- **File Storage**: Supabase Storage for file uploads and document management.
- **Schema Management**: Drizzle migrations for database schema version control.

## Authentication and Authorization
- **Authentication**: Supabase Auth for user authentication (email/password).
- **Authorization**: Row Level Security (RLS) policies for data access control and custom user profiles with role differentiation (teacher/student).
- **Session Management**: Automated token refresh.

## Key Feature Specifications & Implementations
- **Production-Ready Security System (Latest)**: Complete security lockdown with hidden admin/driver access routes only accessible via direct URLs (/admin/secure-login, /driver/secure-login). Features strict username/email/password authentication, comprehensive security logging, account management interfaces, and real-time activity monitoring. All admin and driver navigation completely hidden from main UI for maximum security.
- **Advanced Account Management**: Secure admin can create and manage other admin accounts and driver accounts through dedicated security management interface. Features role-based permissions, account status control, and detailed user activity tracking.
- **Security Monitoring & Logging**: Real-time security event tracking including login attempts (successful/failed), account creation, and administrative actions. Complete audit trail with IP addresses, user agents, and detailed error logging for security analysis.
- **Announcements & Articles System**: Complete homepage announcement display with smart priority-based ordering that prevents conflicts, beautiful UI with image overlays, category badges, and responsive grid layout. Admin interface for creating/managing announcements with homepage visibility controls, intelligent priority management, and dedicated article content pages with full navigation support. Features automatic priority conflict resolution and cache invalidation for real-time updates.
- **Inquiry/Quotation Management**: Admin interface for communication, customer targeting (all, new, existing, grade-based), real-time Supabase Auth integration, and API endpoints for creation and response tracking.
- **Admin & Teacher Management**: Comprehensive profile systems with role-based access control, detailed educational background tracking for teachers, phone number validation, and CRUD operations.
- **Driver Management**: Complete driver authentication system with username-based login, status tracking (online/offline/busy), order-to-driver assignment, and performance metrics. Enhanced with secure authentication and centralized account management.
- **Cloudinary Integration**: Primary file storage for all uploads, user account tracking, premium PDF processing (300 DPI), and server-side activity logging.
- **Cart & Order Tracking**: Integrated cart tracking with order status badges, quick order creation, active order display, and inline tracking buttons. Enhanced orders table with 40+ fields for lifecycle tracking.
- **Product Management**: Comprehensive ProductForm with educational metadata fields (categories, subjects, grade levels, product types) and Cloudinary integration for product images.
- **Coupon & Notification System**: Customer targeting (specific users, segments), per-customer usage limits, automated push notifications, and location-based targeting.
- **Currency Standardization**: All currency references converted to Egyptian Pounds ("جنيه") across the platform, including payment forms, carts, checkout, and admin interfaces.

# External Dependencies

- **Supabase**: Primary BaaS for database, authentication, and storage.
- **Neon Database**: PostgreSQL hosting.
- **Radix UI**: Accessible component primitives for design.
- **Font Awesome**: Icon library.
- **React Hook Form**: Form state management with Zod validation.
- **Tailwind CSS**: Utility-first CSS framework.
- **Cloudinary**: File upload and storage service.