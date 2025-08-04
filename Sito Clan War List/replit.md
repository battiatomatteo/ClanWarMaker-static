# CWL Manager

## Overview

CWL Manager is a comprehensive web application designed to manage Clan War League (CWL) registrations and operations for Clash of Clans. The system allows players to register for CWL events, enables administrators to create and manage multiple clans, assign players to different clan lists, and generate CWL messages with PDF export functionality. The application features a modern React frontend with a Node.js/Express backend and SQLite database for data persistence.

## Recent Changes (January 2025)

✓ **Complete CWL Management System**: Implemented full CWL list creation and management functionality
✓ **Multi-Clan Support**: Added ability to create and manage multiple clans with different leagues and participant counts
✓ **Player Assignment System**: Built drag-and-drop functionality to assign players between clans
✓ **CWL Message Generation**: Automated message creation for different clan configurations
✓ **PDF Export**: Integrated pdfkit for exporting CWL messages as downloadable PDFs
✓ **Clash of Clans API Integration**: Added functionality to search and import player data from clan tags
✓ **Advanced Admin Interface**: Created tabbed interface with separate sections for players, clans, lists, and content management
✓ **Database Schema Enhancement**: Extended SQLite schema with clans, cwl_lists, and player_assignments tables

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Single-page application built using React 18 with TypeScript for type safety
- **Vite Build System**: Modern build tool for fast development and optimized production builds
- **Component Library**: Shadcn/ui components built on Radix UI primitives for consistent UI patterns
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and API caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form validation
- **Client-side Routing**: Simple tab-based navigation without traditional routing

### Backend Architecture
- **Express.js Server**: RESTful API server handling CRUD operations for players and content
- **TypeScript**: Full TypeScript implementation for type safety across the stack
- **Modular Design**: Separated concerns with dedicated modules for routes, storage, and server setup
- **Middleware**: Custom logging middleware for API request monitoring
- **Error Handling**: Centralized error handling with structured error responses

### Database Design
- **SQLite with Better-SQLite3**: Local file-based database for simplicity and portability
- **Drizzle ORM**: Type-safe database operations with schema-first approach
- **Five Main Tables**:
  - `players`: Stores player registrations with name, Town Hall level, and timestamps
  - `content`: Stores editable content for the home page (clan name, description, rules)
  - `clans`: Stores clan configurations with name, participant count, and league information
  - `cwl_lists`: Stores generated CWL message lists with metadata
  - `player_assignments`: Junction table for assigning players to specific clans with position tracking
- **Schema Validation**: Zod schemas shared between frontend and backend for consistent validation
- **Relational Integrity**: Foreign key constraints ensure data consistency across player assignments

### API Structure
- **RESTful Endpoints**:
  - `GET/POST/DELETE /api/players`: Player registration and management
  - `GET/POST/DELETE /api/clans`: Clan creation and management
  - `GET/POST /api/cwl-lists`: CWL list creation and retrieval
  - `GET /api/clans-with-players`: Get clan configurations with assigned players
  - `POST /api/assign-player`: Assign players to specific clans
  - `POST /api/move-player`: Move players between clans
  - `POST /api/generate-cwl-message`: Generate formatted CWL messages
  - `POST /api/export-pdf`: Export messages as PDF documents
  - `GET /api/clash-players/:clanTag`: Fetch player data from Clash of Clans API
  - `GET/PUT /api/content`: Editable content management
  - `GET /api/stats`: Dashboard statistics
- **Validation**: Server-side validation using shared Zod schemas
- **Response Format**: Consistent JSON responses with proper HTTP status codes
- **File Export**: Support for both CSV and PDF export formats

### Development Workflow
- **Monorepo Structure**: Client and server code in same repository with shared schemas
- **Hot Reload**: Vite development server with HMR for frontend, tsx for backend development
- **Build Process**: Separate build steps for client (Vite) and server (esbuild)
- **Type Safety**: Shared TypeScript types between frontend and backend

### Security & Validation
- **Input Validation**: Zod schemas for all user inputs with Town Hall minimum requirements
- **CORS Handling**: Proper CORS configuration for API access
- **SQL Injection Prevention**: Parameterized queries through Drizzle ORM
- **Client-side Validation**: Form validation with user-friendly error messages

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver (configured but using SQLite locally)
- **drizzle-orm & drizzle-kit**: Type-safe ORM and database toolkit
- **better-sqlite3**: High-performance SQLite driver for Node.js
- **express**: Web application framework for Node.js
- **zod**: Runtime type validation and schema validation
- **pdfkit**: PDF generation library for CWL message exports

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **@hookform/resolvers**: React Hook Form integration with validation libraries
- **@radix-ui/***: Headless UI component primitives including tabs, select, and badges
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Utility for creating variant-based component APIs
- **date-fns**: Date utility library
- **lucide-react**: Icon library with comprehensive icon set for admin interface

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Static type checking
- **tsx**: TypeScript execution for Node.js
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **postcss & autoprefixer**: CSS processing tools

### Session Management
- **connect-pg-simple**: PostgreSQL session store (configured for future use)

## Key Features

### Player Management
- Player registration with Town Hall level validation
- Advanced search and filtering capabilities
- Bulk operations for player management
- Integration with Clash of Clans API for player data import

### Clan Management
- Multi-clan configuration with different leagues (Crystal, Master, Champion)
- Flexible participant counts (15 or 30 players)
- Clan deletion and bulk management operations

### CWL List Creation
- Automated player distribution across configured clans
- Drag-and-drop interface for manual player assignment
- Position management within clan lists
- Real-time updates and validation

### Message Generation & Export
- Automated CWL message formatting with clan details
- PDF export functionality with professional formatting
- CSV export for player data analysis
- Template-based message generation

### Administrative Interface
- Tabbed interface for organized management (Players, Clans, Lists, Content)
- Real-time statistics and analytics
- Clash of Clans API integration for external data import
- Content management for home page customization

### External Integrations
- **Clash of Clans API**: Real-time player and clan data retrieval
- **PDF Generation**: Professional document export capabilities
- **Environment Variables**: Secure API key management

The application is designed to be easily deployable on Replit with potential for scaling to PostgreSQL when needed, while maintaining development simplicity with SQLite. The modular architecture supports future enhancements and integrations.