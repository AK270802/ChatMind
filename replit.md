# Overview

This is a full-stack trade journaling and coaching application built with React, Express.js, and PostgreSQL. The application allows traders to log and analyze their trades, receive AI-powered insights, and interact with trading coaches. It features a modern UI with charts, user management, subscription handling, and a complete coaching admin panel.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: TailwindCSS with shadcn/ui component library for consistent, modern UI
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form validation
- **Charts**: Chart.js for data visualization (P&L charts, performance metrics, risk-reward analysis)
- **Theme**: Dark mode support with a professional trading-focused design

## Backend Architecture
- **Framework**: Express.js with TypeScript in ESM mode
- **Authentication**: Passport.js with local strategy using session-based authentication
- **Session Management**: Express sessions with PostgreSQL session store
- **File Upload**: Multer for handling CSV/Excel trade uploads
- **API Design**: RESTful endpoints with proper error handling and request logging
- **Password Security**: Scrypt hashing with salt for secure password storage

## Database Layer
- **ORM**: Drizzle ORM with PostgreSQL driver (Neon serverless)
- **Schema Design**: Comprehensive schema with users, trades, feedback, AI analysis reports, and coach-student relationships
- **Data Types**: Proper use of UUIDs, timestamps, decimals for financial data, and JSONB for flexible metadata

## Authentication & Authorization
- **Session-based Authentication**: Secure session management with PostgreSQL store
- **Role-based Access Control**: User roles (user, coach, admin) with appropriate route protection
- **Password Security**: Industry-standard password hashing and validation

## File Processing
- **CSV/Excel Import**: Robust trade data parsing with flexible header mapping
- **File Validation**: Type and size restrictions for uploaded files
- **Error Handling**: Comprehensive validation and user-friendly error messages

## Mock Services
- **AI Analysis**: Mock implementation ready for OpenAI API integration
- **Payment Processing**: Mock subscription system designed for Stripe integration
- **Email Notifications**: Placeholder for email service integration

# External Dependencies

## Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection for Neon hosting
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **passport**: Authentication middleware with session support
- **multer**: File upload handling for trade data imports

## UI & Styling
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library built on Radix UI
- **lucide-react**: Modern icon library

## Charts & Visualization
- **chart.js**: Powerful charting library for financial data visualization
- **react-chartjs-2**: React wrapper for Chart.js integration

## Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production builds
- **vite**: Modern build tool with HMR for development

## Session & Security
- **connect-pg-simple**: PostgreSQL session store
- **express-session**: Session management middleware

## Validation
- **zod**: TypeScript-first schema validation
- **@hookform/resolvers**: React Hook Form integration with Zod

The application is designed to run completely on Replit without external API keys, using mock implementations for services that would typically require external APIs (OpenAI, Stripe, email services). All mock services are structured to allow easy integration of real APIs when available.