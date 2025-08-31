# Overview

This is an enterprise-grade business loan evaluation platform that provides comprehensive, banker-quality analysis for lending decisions. The system performs detailed financial analysis, risk assessment, industry evaluation, and management assessment using sophisticated AI-powered research. It generates institutional-quality reports with specific recommendations, risk factors, and detailed rationale that match professional underwriting standards.

## Key Features
- **Comprehensive Financial Analysis**: Deep dive into cash flow patterns, profitability trends, debt capacity, and financial stability
- **Risk Assessment Matrix**: Multi-dimensional risk evaluation including industry, operational, financial, and management risks
- **Regulatory Compliance Check**: Automated verification against lending regulations and compliance requirements
- **Market Analysis**: Industry positioning, competitive landscape, and market opportunity assessment
- **Management Evaluation**: Leadership track record, experience analysis, and succession planning assessment
- **Collateral Analysis**: Detailed asset evaluation with liquidation scenarios and recovery estimates

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development and building
- **UI Library**: Radix UI components with Tailwind CSS for styling using the "new-york" style variant
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Real-time Updates**: WebSocket connection for progress tracking during loan evaluation

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **File Processing**: Multer for handling file uploads with PDF parsing capabilities
- **AI Integration**: Multi-agent research system using both OpenAI GPT-4o and Anthropic Claude models
- **Document Analysis**: Automated extraction and analysis of financial documents using AI
- **PDF Generation**: PDFKit for creating comprehensive loan assessment reports
- **Real-time Communication**: WebSocket server for progress updates during evaluation

## Scoring System
- **Multi-Component Scoring**: 9 weighted scoring components including revenue growth, EBITDA margin, debt service coverage ratio, and industry risk assessment
- **Grade Assignment**: Numerical scores (0-100) mapped to letter grades (A+ through C-) with specific thresholds
- **Deep Research Integration**: AI-powered company and owner background research affects overall scoring
- **Document Analysis**: Automated financial document processing influences final evaluation

## Data Storage Solutions
- **Primary Database**: PostgreSQL for persistent data storage with connection pooling via Neon Database
- **In-Memory Storage**: Fallback memory storage implementation for development environments
- **File Storage**: Temporary file handling for uploaded documents during processing
- **Encryption**: AES-256-GCM encryption for sensitive financial data with authentication tags

## Authentication and Security
- **Data Encryption**: Sensitive information encrypted using industry-standard AES-256-GCM
- **Privacy Controls**: Explicit user consent required for document analysis with external AI services
- **Input Validation**: Comprehensive Zod schema validation for all user inputs
- **File Security**: PDF file type validation and secure temporary storage during processing

# External Dependencies

## AI Services
- **OpenAI API**: GPT-4o model for document analysis and company research
- **Anthropic API**: Claude-3-5-Sonnet model for enhanced deep research and verification
- **Multi-Agent System**: Specialized AI agents for business analysis, legal research, financial auditing, and industry assessment

## Database Services
- **Neon Database**: Managed PostgreSQL hosting with serverless scaling
- **Drizzle Kit**: Database migration and schema management tools

## Third-Party Libraries
- **Chart.js**: Data visualization for scoring components and financial metrics
- **PDFKit**: Server-side PDF generation for loan assessment reports
- **Multer**: File upload handling middleware for Express.js
- **React Hook Form**: Form state management with validation
- **TanStack React Query**: Server state synchronization and caching

## Development Tools
- **Vite**: Fast build tool with hot module replacement for development
- **TypeScript**: Type safety across both frontend and backend
- **Tailwind CSS**: Utility-first CSS framework for consistent styling
- **ESBuild**: Fast JavaScript bundler for production builds