# Implementation Plan: ContentOS

## Overview

This implementation plan breaks down the ContentOS platform into discrete, incremental coding tasks. The approach follows the content lifecycle workflow, building core infrastructure first, then implementing each module in the order creators will use them. Each task builds on previous work, with checkpoints to ensure stability before proceeding.

The implementation uses TypeScript for both frontend (React) and backend (Node.js/Express), with PostgreSQL for relational data and Redis for caching.

## Tasks

- [ ] 1. Set up project infrastructure and core services
  - Initialize monorepo with frontend and backend workspaces
  - Configure TypeScript, ESLint, Prettier
  - Set up PostgreSQL database with migrations
  - Set up Redis for caching
  - Configure environment variables and secrets management
  - Create base API structure with Express
  - Set up React application with routing
  - Configure testing frameworks (Jest, fast-check)
  - _Requirements: All (foundational)_

- [ ] 2. Implement authentication system
  - [ ] 2.1 Create User model and database schema
    - Define User interface with id, email, passwordHash, name, preferences
    - Create users table migration
    - Implement password hashing with bcrypt
    - _Requirements: 1.1_

  - [ ]* 2.2 Write property test for user registration
    - **Property 1: User Registration Creates Valid Accounts**
    - **Validates: Requirements 1.1**

  - [ ] 2.3 Implement registration endpoint
    - POST /api/auth/register with email validation
    - Hash passwords before storage
    - Return JWT token on successful registration
    - _Requirements: 1.1_

  - [ ] 2.4 Implement login endpoint
    - POST /api/auth/login with credential validation
    - Compare hashed passwords
    - Generate and return JWT token
    - _Requirements: 1.2, 1.3_

  - [ ]* 2.5 Write property test for authentication correctness
    - **Property 2: Authentication Correctness**
    - **Validates: Requirements 1.2, 1.3**

  - [ ] 2.6 Implement password reset flow
    - POST /api/auth/reset-request to generate reset token
    - Store reset token with expiration in database
    - POST /api/auth/reset-password to update password
    - _Requirements: 1.4_

  - [ ]* 2.7 Write property test for password reset tokens
    - **Property 3: Password Reset Token Generation**
    - **Validates: Requirements 1.4**

  - [ ] 2.8 Implement JWT middleware for protected routes
    - Verify JWT tokens on protected endpoints
    - Check token expiration
    - Attach user context to requests
    - _Requirements: 1.5_

  - [ ]* 2.9 Write property test for session expiration
    - **Property 4: Session Expiration Enforcement**
    - **Validates: Requirements 1.5**

- [ ] 3. Checkpoint - Authentication complete
  - Ensure all authentication tests pass
  - Verify user registration, login, and password reset flows work end-to-end
  - Ask the user if questions arise

- [ ] 4. Implement project management
  - [ ] 4.1 Create Project model and database schema
    - Define Project interface with id, userId, name, description, timestamps
    - Create projects table migration with foreign key to users
    - Add indexes for userId and updatedAt
    - _Requirements: 2.1_

  - [ ] 4.2 Implement project CRUD endpoints
    - POST /api/projects to create new project
    - GET /api/projects to list user's projects (ordered by updatedAt DESC)
    - PUT /api/projects/:id to update project metadata
    - DELETE /api/projects/:id to delete project
    - POST /api/projects/:id/archive to archive project
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 4.3 Write property tests for project operations
    - **Property 5: Project Creation Completeness**
    - **Property 6: Project Ordering by Modification Date**
    - **Property 7: Cascade Deletion of Projects**
    - **Property 8: Project Archival Preserves Content**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.5**

- [ ] 5. Implement content data models and storage
  - [ ] 5.1 Create Content model and database schema
    - Define Content interface with all fields from design
    - Create content table migration with foreign keys
    - Add indexes for projectId, userId, stage
    - _Requirements: 2.1, 9.3_

  - [ ] 5.2 Create Ideas table and model
    - Define Idea interface
    - Create ideas table migration
    - _Requirements: 3.1_

  - [ ] 5.3 Create Feedback and PerformanceMetrics tables
    - Define Feedback and PerformanceMetrics interfaces
    - Create migrations for both tables
    - _Requirements: 4.5, 8.2_

  - [ ]* 5.4 Write property test for data persistence
    - **Property 13: Data Persistence Round Trip**
    - **Validates: Requirements 2.4, 4.5, 7.5, 8.2, 12.2**

- [ ] 6. Implement AI Copilot service foundation
  - [ ] 6.1 Set up LLM API client
    - Configure OpenAI or Anthropic API client
    - Implement rate limiting and retry logic
    - Add circuit breaker for fault tolerance
    - _Requirements: 11.5_

  - [ ] 6.2 Create prompt orchestration system
    - Implement PromptBuilder class for constructing prompts
    - Create prompt templates for each operation type
    - Add context injection for user history and preferences
    - _Requirements: 3.1, 4.2, 5.2_

  - [ ] 6.3 Implement Redis caching for prompts and responses
    - Cache system prompts and user context
    - Cache similar AI responses to reduce API calls
    - Set appropriate TTLs for different cache types
    - _Requirements: API constraints_

  - [ ]* 6.4 Write property test for error handling
    - **Property 26: Error Handling with Retry**
    - **Validates: Requirements 11.5, 12.3**

- [ ] 7. Checkpoint - Core infrastructure complete
  - Ensure all database models are created and tested
  - Verify AI service can connect and make basic requests
  - Ensure caching is working correctly
  - Ask the user if questions arise

- [ ] 8. Implement idea generation module
  - [ ] 8.1 Create idea generation service
    - Implement generateIdeas function with LLM integration
    - Build prompt with user context and topic
    - Parse LLM response into Idea objects
    - Store ideas in database with embeddings
    - _Requirements: 3.1, 3.2_

  - [ ] 8.2 Create idea API endpoints
    - POST /api/ideas/generate with topic and context
    - GET /api/ideas/:projectId to list ideas
    - POST /api/ideas/:ideaId/select to create content from idea
    - _Requirements: 3.1, 3.3_

  - [ ]* 8.3 Write property tests for idea generation
    - **Property 9: Idea Generation Count and Relevance**
    - **Property 10: Idea Selection Creates Content**
    - **Property 11: AI Explainability for All Suggestions**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [ ] 9. Implement content creation studio
  - [ ] 9.1 Create content CRUD service
    - Implement createContent, updateContent, getContent functions
    - Add auto-save functionality with debouncing
    - Implement version tracking
    - _Requirements: 4.1, 12.1, 12.2_

  - [ ] 9.2 Create content API endpoints
    - POST /api/content to create new content
    - GET /api/content/:id to retrieve content
    - PUT /api/content/:id to update content
    - GET /api/content/project/:projectId to list project content
    - _Requirements: 4.1_

  - [ ] 9.3 Implement AI suggestion service
    - Create suggestion endpoint POST /api/content/:id/suggest
    - Support actions: expand, refine, rephrase
    - Build prompts with content context and user preferences
    - Return suggestions with explanations
    - _Requirements: 4.2, 4.3_

  - [ ] 9.4 Implement tone control
    - Create ToneProfile definitions for 5 presets
    - Add tone parameter to suggestion prompts
    - Validate tone consistency in responses
    - _Requirements: 4.4_

  - [ ]* 9.5 Write property tests for content operations
    - **Property 12: Tone Consistency in AI Operations**
    - **Property 27: State Restoration Round Trip**
    - **Validates: Requirements 4.2, 4.4, 12.5**

- [ ] 10. Implement repurposing engine
  - [ ] 10.1 Define platform format configurations
    - Create PlatformFormat definitions for blog, Twitter, LinkedIn
    - Define maxLength, structure, and conventions for each
    - _Requirements: 5.1_

  - [ ] 10.2 Create repurposing service
    - Implement repurposeContent function
    - Build prompts with platform constraints
    - Track transformations and changes
    - Maintain sourceContentId link
    - _Requirements: 5.2, 5.3, 5.5_

  - [ ] 10.3 Create repurposing API endpoints
    - GET /api/repurpose/formats to list available formats
    - POST /api/repurpose/:contentId with targetFormat
    - Return repurposed content with change explanations
    - _Requirements: 5.1, 5.2, 5.4_

  - [ ]* 10.4 Write property tests for repurposing
    - **Property 14: Repurposing Platform Constraints**
    - **Validates: Requirements 5.2, 5.3, 5.5**

- [ ] 11. Checkpoint - Content creation workflow complete
  - Ensure idea generation, content creation, and repurposing work end-to-end
  - Verify AI suggestions are generated with explanations
  - Test repurposing across all three platform formats
  - Ask the user if questions arise

- [ ] 12. Implement optimization layer
  - [ ] 12.1 Create scoring algorithms
    - Implement calculateClarityScore function
    - Implement calculateStructureScore function
    - Implement calculateReadabilityScore (Flesch)
    - Implement calculatePlatformFitScore function
    - _Requirements: 6.1, 6.4_

  - [ ] 12.2 Implement tone consistency scoring
    - Create calculateToneConsistencyScore with LLM evaluation
    - Cache tone evaluations to reduce API calls
    - _Requirements: 6.4_

  - [ ] 12.3 Create overall engagement score calculator
    - Combine all component scores with weights
    - Return score breakdown with all components
    - Ensure score is always 0-100
    - _Requirements: 6.1, 6.4_

  - [ ] 12.4 Implement suggestion generator
    - Analyze score breakdown to identify weak areas
    - Generate specific, actionable suggestions
    - Provide explanations for each suggestion
    - Rank suggestions by impact
    - _Requirements: 6.2, 6.5_

  - [ ] 12.5 Create optimization API endpoints
    - POST /api/optimize/:contentId/score to calculate score
    - POST /api/optimize/:contentId/apply to apply suggestion
    - Return updated content and new score after application
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 12.6 Write property tests for optimization
    - **Property 15: Engagement Score Bounds and Breakdown**
    - **Property 16: Optimization Suggestions Are Actionable**
    - **Property 17: Score Recalculation After Optimization**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [ ] 13. Implement publishing interface
  - [ ] 13.1 Create publishing service
    - Implement publishContent function to update stage and timestamp
    - Record publication event in database
    - _Requirements: 7.1, 7.5_

  - [ ] 13.2 Create export formatters
    - Implement formatters for plain text, markdown, HTML
    - Preserve all formatting and metadata
    - _Requirements: 7.2, 7.3_

  - [ ] 13.3 Create publishing API endpoints
    - POST /api/publish/:contentId to mark as published
    - GET /api/publish/:contentId/export with format parameter
    - Return formatted content with appropriate MIME type
    - _Requirements: 7.1, 7.2_

  - [ ]* 13.4 Write property tests for publishing
    - **Property 18: Publishing State Transition**
    - **Property 19: Export Format Correctness**
    - **Property 20: Publishing Preserves Data**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5**

- [ ] 14. Implement analytics and feedback loop
  - [ ] 14.1 Create analytics service
    - Implement functions to store performance metrics
    - Create queries to retrieve metrics by content/project
    - _Requirements: 8.1, 8.2_

  - [ ] 14.2 Create analytics API endpoints
    - GET /api/analytics/:projectId for project metrics
    - POST /api/analytics/:contentId/feedback to submit metrics
    - Return performance data and basic insights
    - _Requirements: 8.1, 8.2_

  - [ ] 14.3 Implement basic pattern recognition
    - Query high-performing content from database
    - Extract common characteristics (tone, length, structure)
    - Store insights for future reference
    - _Requirements: 8.4_

  - [ ]* 14.4 Write property tests for analytics
    - **Property 21: Analytics Data Association**
    - **Property 22: Analytics Retrieval for Published Content**
    - **Validates: Requirements 8.1, 8.2**

- [ ] 15. Implement workflow orchestrator
  - [ ] 15.1 Create workflow service
    - Implement getWorkflowStatus function
    - Track completed stages for each content piece
    - Define valid stage transitions
    - _Requirements: 9.1, 9.3_

  - [ ] 15.2 Implement next step suggester
    - Create logic to suggest next stage based on current stage
    - Follow lifecycle progression: idea → draft → refine → optimize → repurpose → publish → analyze
    - _Requirements: 9.2_

  - [ ] 15.3 Create workflow API endpoints
    - GET /api/workflow/:contentId/status for current stage and suggestions
    - POST /api/workflow/:contentId/advance to move to next stage
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 15.4 Write property tests for workflow
    - **Property 23: Workflow Stage Tracking**
    - **Property 24: Workflow Stage Transitions Preserve Content**
    - **Property 25: Next Stage Suggestion Correctness**
    - **Validates: Requirements 9.2, 9.3, 9.4**

- [ ] 16. Checkpoint - Backend complete
  - Ensure all API endpoints are implemented and tested
  - Verify complete workflow from idea to analytics works
  - Test error handling and edge cases
  - Ask the user if questions arise

- [ ] 17. Implement frontend authentication UI
  - [ ] 17.1 Create authentication pages
    - Build registration form with validation
    - Build login form with error handling
    - Build password reset request and confirmation pages
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 17.2 Implement authentication state management
    - Set up Redux store for auth state
    - Create actions for login, logout, register
    - Store JWT token in localStorage
    - Add axios interceptor for auth headers
    - _Requirements: 1.2, 1.5_

  - [ ] 17.3 Create protected route wrapper
    - Implement ProtectedRoute component
    - Redirect to login if not authenticated
    - Check token expiration
    - _Requirements: 1.5_

- [ ] 18. Implement frontend project management UI
  - [ ] 18.1 Create project list view
    - Display projects in cards/list format
    - Show project name, description, content count
    - Order by last modified date
    - Add create, archive, delete actions
    - _Requirements: 2.2, 2.3, 2.5_

  - [ ] 18.2 Create project creation modal
    - Form with name and description fields
    - Validation for required fields
    - Call POST /api/projects on submit
    - _Requirements: 2.1_

  - [ ] 18.3 Implement project state management
    - Redux store for projects
    - Actions for CRUD operations
    - Optimistic updates for better UX
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 19. Implement frontend idea generation UI
  - [ ] 19.1 Create idea generation interface
    - Input field for topic/context
    - Generate button with loading state
    - Display generated ideas in cards
    - Show rationale for each idea
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ] 19.2 Implement idea selection flow
    - Add select button to each idea card
    - Create content from selected idea
    - Navigate to content editor
    - _Requirements: 3.3_

  - [ ] 19.3 Add feedback mechanism for ideas
    - Like/dislike buttons on ideas
    - Submit feedback to backend
    - _Requirements: 3.5_

- [ ] 20. Implement frontend content editor
  - [ ] 20.1 Create rich text editor component
    - Integrate rich text editor library (e.g., TipTap, Slate)
    - Support basic formatting (bold, italic, headings, lists)
    - Implement auto-save with debouncing
    - _Requirements: 4.1, 12.1_

  - [ ] 20.2 Add AI suggestion panel
    - Sidebar with suggestion actions (expand, refine, rephrase)
    - Display suggestions with explanations
    - Apply suggestion button to update content
    - _Requirements: 4.2, 4.3_

  - [ ] 20.3 Implement tone selector
    - Dropdown with 5 tone presets
    - Update content metadata on selection
    - Pass tone to AI suggestion requests
    - _Requirements: 4.4_

  - [ ] 20.4 Add content metadata display
    - Show word count, reading time
    - Display current lifecycle stage
    - Show last saved timestamp
    - _Requirements: 9.3_

- [ ] 21. Implement frontend repurposing UI
  - [ ] 21.1 Create repurposing interface
    - Display available platform formats
    - Show format constraints (length, structure)
    - Repurpose button for each format
    - _Requirements: 5.1_

  - [ ] 21.2 Display repurposed content
    - Show original and repurposed content side-by-side
    - Highlight changes made
    - Display explanation for transformations
    - Allow editing of repurposed content
    - _Requirements: 5.2, 5.3, 5.4_

- [ ] 22. Implement frontend optimization UI
  - [ ] 22.1 Create optimization dashboard
    - Display overall engagement score with visual indicator
    - Show score breakdown in chart/bars
    - List optimization suggestions with impact levels
    - _Requirements: 6.1, 6.4_

  - [ ] 22.2 Implement suggestion application
    - Apply button for each suggestion
    - Show before/after preview
    - Display new score after application
    - _Requirements: 6.3_

  - [ ] 22.3 Add explanation tooltips
    - Hover tooltips for score components
    - Detailed explanations for suggestions
    - _Requirements: 6.5, 10.1_

- [ ] 23. Implement frontend publishing UI
  - [ ] 23.1 Create publishing interface
    - Publish button with confirmation modal
    - Export format selector (plain, markdown, HTML)
    - Copy-to-clipboard functionality
    - _Requirements: 7.1, 7.2_

  - [ ] 23.2 Display published content
    - Show published timestamp
    - Provide export/download options
    - Link to analytics for published content
    - _Requirements: 7.1, 7.5_

- [ ] 24. Implement frontend analytics UI
  - [ ] 24.1 Create analytics dashboard
    - Display performance metrics (views, engagement, conversions)
    - Show engagement rate calculation
    - List published content with metrics
    - _Requirements: 8.1_

  - [ ] 24.2 Create feedback input form
    - Form to manually input performance data
    - Fields for views, engagement, conversions, qualitative feedback
    - Submit to POST /api/analytics/:contentId/feedback
    - _Requirements: 8.2_

  - [ ] 24.3 Display insights and patterns
    - Show identified success patterns
    - Display recommendations based on past performance
    - _Requirements: 8.4_

- [ ] 25. Implement frontend workflow guidance
  - [ ] 25.1 Create workflow progress indicator
    - Visual stepper showing lifecycle stages
    - Highlight current stage
    - Show completed stages
    - _Requirements: 9.1, 9.3_

  - [ ] 25.2 Add next step suggestions
    - Display suggested next action
    - Quick action button to advance stage
    - Contextual help for each stage
    - _Requirements: 9.2_

  - [ ] 25.3 Implement stage navigation
    - Allow manual stage transitions
    - Preserve content when changing stages
    - Update workflow status on backend
    - _Requirements: 9.4_

- [ ] 26. Checkpoint - Frontend complete
  - Ensure all UI components are implemented and styled
  - Verify complete user workflow from registration to analytics
  - Test responsive design on different screen sizes
  - Ask the user if questions arise

- [ ] 27. Integration and polish
  - [ ] 27.1 Implement error handling UI
    - Toast notifications for errors
    - User-friendly error messages
    - Retry buttons for failed operations
    - _Requirements: 11.5, 13.4_

  - [ ]* 27.2 Write property test for error messages
    - **Property 28: Helpful Error Messages**
    - **Validates: Requirements 13.4**

  - [ ] 27.3 Add loading states and skeletons
    - Loading spinners for async operations
    - Skeleton screens for data fetching
    - Progress indicators for AI operations
    - _Requirements: 11.2_

  - [ ] 27.4 Implement responsive design
    - Mobile-friendly layouts
    - Tablet optimizations
    - Desktop full-width layouts
    - _Requirements: 13.1_

  - [ ] 27.5 Add onboarding flow
    - Optional guided tour for new users
    - Contextual tooltips for features
    - Sample project with example content
    - _Requirements: 13.1, 13.2_

- [ ] 28. Testing and quality assurance
  - [ ]* 28.1 Run all property-based tests
    - Execute all property tests with 100 iterations
    - Verify all properties pass
    - Fix any failures discovered

  - [ ]* 28.2 Run integration tests
    - Test all API endpoints
    - Test database transactions
    - Test authentication flows

  - [ ]* 28.3 Run end-to-end tests
    - Test complete user workflows
    - Test error scenarios
    - Test edge cases

  - [ ] 28.4 Performance testing
    - Test with large content pieces
    - Test with many projects/content items
    - Verify response times meet requirements
    - _Requirements: 11.3, 11.4_

- [ ] 29. Deployment preparation
  - [ ] 29.1 Set up production environment
    - Configure production database
    - Set up Redis instance
    - Configure environment variables
    - Set up SSL certificates

  - [ ] 29.2 Create deployment scripts
    - Database migration scripts
    - Build and deploy scripts
    - Health check endpoints

  - [ ] 29.3 Set up monitoring and logging
    - Configure error tracking (e.g., Sentry)
    - Set up application logging
    - Create monitoring dashboards

- [ ] 30. Final checkpoint - MVP complete
  - Ensure all core features are working
  - Verify all success metrics can be measured
  - Test complete workflow end-to-end
  - Document any known issues or limitations
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- Property tests validate universal correctness properties from the design document
- The implementation follows the content lifecycle workflow to ensure a cohesive user experience
- AI operations use mocked responses in tests for deterministic behavior
- All property tests run with minimum 100 iterations as specified in the testing strategy
