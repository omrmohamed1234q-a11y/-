# Overview

"اطبعلي" is a modern Arabic-localized printing and e-commerce platform built with React, TypeScript, and Supabase. The application combines printing services, smart scanning with OCR, PDF manipulation tools, and an integrated marketplace for educational materials. Designed for students, teachers, and professionals in Arabic-speaking markets, it features a gamification system with bounty points and rewards to encourage user engagement.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 18** with TypeScript for type safety and modern component patterns
- **Vite** as the build tool for fast development and optimized production builds
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **Tailwind CSS** with shadcn/ui components for consistent, accessible UI design
- **Arabic-first design** with RTL support and IBM Plex Sans Arabic font

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