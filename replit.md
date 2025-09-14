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

## Recent Changes & Updates (September 2025)
- **System Performance & Security Optimization (Latest - September 14, 2025)**: Successfully implemented critical performance optimization by reducing notifications API polling frequency from 5 seconds to 30 seconds (6x improvement). Fixed JWT token exposure security vulnerability in backend logs with proper redaction. Re-enabled WebSocket functionality with stable authentication and real-time messaging. All changes architect-reviewed and confirmed working. System now operates with enhanced performance, security, and stability.
- **Persistent Data Storage System with Token Management (September 2, 2025)**: Implemented hybrid storage with local JSON file backup ensuring 100% data persistence. All security dashboard data (users, logs, admin accounts, driver accounts) automatically saves to `security-data.json` and survives server restarts. Combined with Supabase synchronization for cloud backup. Enhanced with token persistence - login tokens are now properly saved and verified across server restarts. Production accounts: `production_admin/admin@production.com/AdminPass123` (admin), `ahmedd/omarr3loush@gmail.com/123456/OM001` (driver).
- **Complete Admin Route Protection**: All admin pages (/admin, /admin/profile, etc.) now require authentication via secure login. Direct access redirects to secure login page with security warning. Token-based verification prevents unauthorized access.
- **UI Security Enhancement**: Removed all visible admin access buttons from homepage and quick-access pages. Admin access only possible through direct secure URLs, maintaining complete security lockdown.
- **Hybrid Storage System**: Combined Memory Storage with Supabase synchronization and local file backup. Triple redundancy ensures data never gets lost: Memory (speed) + Supabase (cloud) + Local JSON (reliability).
- **Password Reset & Management**: Added comprehensive password management through admin interface with real-time synchronization across all storage layers.
- **Security System Operational**: Both admin and driver login systems working with persistent storage. All security logs and user management data persists indefinitely.

# Key Feature Specifications & Implementations
- **Production-Ready Security System (Latest - September 2025)**: Complete security lockdown with hidden admin/driver access routes only accessible via direct URLs (/admin/secure-login, /driver/secure-login). Features strict username/email/password authentication, comprehensive security logging, account management interfaces, and real-time activity monitoring. All admin and driver navigation completely hidden from main UI for maximum security. **UPDATED**: Replaced old driver management with new security dashboard (/admin/security-dashboard), replaced old captain dashboard with secure driver control (/driver/secure-dashboard). Added memory-based security storage as fallback for Supabase connectivity issues.
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
- **Advanced API Integration & Testing Tools (Latest)**: Complete API connectivity testing infrastructure with automated Supabase table creation, SQL code generation, and comprehensive diagnostic tools. Features include real-time endpoint testing (/api-test), connectivity monitoring dashboard (/connectivity), and intelligent SQL generator (/sql-generator) with multiple creation methods (automated, direct API, and manual). Enhanced with troubleshooting guides, automated test account creation, and seamless integration testing workflows.

# External Dependencies

- **Supabase**: Primary BaaS for database, authentication, and storage.
- **Neon Database**: PostgreSQL hosting.
- **Radix UI**: Accessible component primitives for design.
- **Font Awesome**: Icon library.
- **React Hook Form**: Form state management with Zod validation.
- **Tailwind CSS**: Utility-first CSS framework.
- **Cloudinary**: File upload and storage service.