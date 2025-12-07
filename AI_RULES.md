# AI Rules & Tech Stack Guidelines

## Tech Stack Overview

• **Frontend**: React 18 with TypeScript, Vite build tool, and React Router for navigation
• **UI Framework**: Tailwind CSS with shadcn/ui components for consistent, accessible UI
• **State Management**: React Context API for global state, React Query for server state
• **Backend**: Supabase for authentication, database, storage, and edge functions
• **AI Integration**: External AI services connected via webhooks (Make.com, n8n)
• **Internationalization**: i18next with language detection and translation support
• **Deployment**: Lovable.dev platform with automatic CI/CD
• **Code Quality**: ESLint with TypeScript rules, Prettier formatting
• **Component Architecture**: File-based routing with dedicated component and page folders
• **Styling**: CSS-in-JS with Tailwind utility classes and custom design tokens

## AI Implementation Rules

### 1. AI Service Integration
- All AI processing must happen through external services (no local AI models)
- Use webhooks to connect with AI services (Make.com, n8n workflows)
- Never store API keys in client-side code
- Always use environment variables for service credentials
- Implement proper error handling for AI service timeouts and failures

### 2. Data Processing
- Raw AI responses must be normalized before storing in database
- Always validate and sanitize AI-generated content before display
- Implement deduplication logic for AI-processed candidate data
- Store original AI responses in database for debugging purposes
- Use consistent data structures across different AI service integrations

### 3. Credit System
- All AI operations must check and consume credits before processing
- Implement idempotency keys to prevent duplicate credit consumption
- Display clear credit costs to users before AI operations
- Handle credit deduction failures gracefully with user notifications
- Log all credit operations for debugging and analytics

### 4. User Experience
- Provide clear loading states during AI processing
- Show progress indicators for long-running AI operations
- Display AI confidence scores with appropriate visual indicators
- Allow users to understand why AI made certain decisions
- Provide fallback options when AI services are unavailable

### 5. Data Privacy
- Never send personally identifiable information (PII) to external AI services without consent
- Implement data retention policies for AI-processed information
- Allow users to delete their AI-processed data
- Comply with GDPR and other data protection regulations
- Encrypt sensitive data both in transit and at rest

## Library Usage Rules

### Authentication & User Management
- **Supabase Auth**: For all authentication needs (login, signup, password reset)
- **React Context**: For managing authentication state throughout the application

### UI Components
- **shadcn/ui**: For all UI components (buttons, cards, forms, etc.)
- **Tailwind CSS**: For all styling needs
- **Lucide React**: For icons only
- **Recharts**: For data visualization components only

### State Management
- **React Context API**: For global application state
- **React Query**: For server state management and caching
- **Zustand** (if needed): For complex local component state

### Data Handling
- **Supabase Client**: For database operations, storage, and real-time subscriptions
- **Zod**: For all data validation and schema definition
- **React Hook Form**: For form handling and validation

### AI & External Services
- **Fetch API**: For calling external webhooks
- **Supabase Functions**: For secure server-side operations
- **Make.com/n8n**: For workflow automation and AI service integration

### Utilities
- **date-fns**: For all date manipulation and formatting
- **i18next**: For internationalization
- **clsx/tailwind-merge**: For conditional CSS class handling
- **pdf-parse**: For PDF text extraction only

### Routing
- **React Router**: For all application routing needs

## Prohibited Libraries
- No additional component libraries beyond shadcn/ui
- No additional icon libraries beyond Lucide React
- No additional date libraries beyond date-fns
- No additional form libraries beyond React Hook Form
- No additional state management libraries beyond what's specified
- No direct AI/ML libraries (all AI processing must be external)