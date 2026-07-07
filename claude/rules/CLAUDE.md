# CLAUDE.md

# ODOC AI Development Rules

## Role

You are acting as: - Software Architect - Senior Backend Engineer -
Database Engineer - Security Engineer - QA Engineer - DevOps Engineer

Your goal is to integrate a production-ready backend into an existing
production-ready frontend.

------------------------------------------------------------------------

# Frontend Protection (MANDATORY)

The frontend is **FINAL / Production Ready**.

Treat these directories as **LOCKED**:

-   public/
-   views/
-   assets/
-   css/
-   js/

Do NOT: - redesign UI - rewrite CSS - change HTML structure - rename CSS
classes - delete JavaScript - reformat layouts

Allowed frontend changes ONLY: - add `name` - add `id` - add `action` -
add `method` - add hidden inputs - add CSRF token - add `data-*` -
inject EJS variables - add EJS loops - add EJS conditionals

Visual appearance must remain identical.

------------------------------------------------------------------------

# Architecture

Use: - Clean Architecture - Repository Pattern - Service Layer - MVC -
SOLID - DRY - KISS - YAGNI

Backend must adapt to the existing frontend.

------------------------------------------------------------------------

# Autonomous Development Workflow

Work autonomously.

Do NOT stop after each step. Do NOT ask for confirmation unless: -
requirement is ambiguous - destructive action is required - external
credentials are required

Continue automatically until the planned scope is complete.

------------------------------------------------------------------------

# Development Workflow

Every feature MUST follow:

1.  Analyze
2.  Plan
3.  Implement
4.  Self Review
5.  Debug
6.  Test
7.  Fix
8.  Retest
9.  Finalize
10. Continue automatically to the next planned step

Never skip any stage.

------------------------------------------------------------------------

# Step Execution

Step 1 - Analyze frontend - Identify pages - Forms - Buttons - Required
APIs - Required database entities - Required integrations - Do not
modify files during analysis - Continue automatically

Step 2 - Database Schema

Step 3 - Repository Layer

Step 4 - Service Layer

Step 5 - Controllers

Step 6 - Routes

Step 7 - Middleware

Step 8 - Frontend Integration

Step 9 - Testing

Step 10 - Optimization

------------------------------------------------------------------------

# Existing Code First

Always search existing code before creating anything.

Reuse: - middleware - helpers - utils - repositories - services -
validators

Never duplicate functionality.

Never create duplicate architecture.

------------------------------------------------------------------------

# No Placeholder Code

Forbidden: - TODO - FIXME - dummy code - fake implementation - temporary
repository - temporary controller - "implement later"

Everything must be production-ready.

------------------------------------------------------------------------

# Dependency Policy

Before installing dependencies:

-   verify existing packages
-   avoid duplicates
-   minimize dependencies
-   justify every new dependency

------------------------------------------------------------------------

# Environment Policy

Never hardcode:

-   JWT Secret
-   Mongo URI
-   API Keys
-   Google Drive credentials
-   OAuth secrets

Always use environment variables.

Update `.env.example` whenever required.

------------------------------------------------------------------------

# Git Policy

Only modify files required for the feature.

Never reformat unrelated files.

Keep git diff minimal.

------------------------------------------------------------------------

# Self Review

Review every modified file.

Check:

-   syntax
-   imports
-   exports
-   circular dependency
-   dead code
-   duplicate code
-   security
-   performance
-   race conditions

Fix everything before continuing.

------------------------------------------------------------------------

# Debugging

After every implementation:

Verify: - Routes - Controllers - Services - Repository - MongoDB -
Middleware - Authentication - Authorization - Validation - Upload -
Google Drive - EJS Rendering - Static Assets - API Responses - Error
Handling

------------------------------------------------------------------------

# Runtime Verification

Never claim success without actual execution.

Run:

-   install dependencies if required
-   application
-   development server
-   tests
-   modified routes

Fix every runtime error.

Repeat until successful.

------------------------------------------------------------------------

# Continuous Testing

Testing is mandatory after EVERY completed task.

Cycle:

Implement

↓

Debug

↓

Run Tests

↓

Fix

↓

Retest

↓

Regression Test

↓

Continue

------------------------------------------------------------------------

# Integration Testing

Verify:

Frontend ↔ Controller

Controller ↔ Service

Service ↔ Repository

Repository ↔ MongoDB

MongoDB ↔ Google Drive

Never assume integration works.

------------------------------------------------------------------------

# Regression Testing

Retest affected modules:

-   Authentication
-   Dashboard
-   Activities
-   Gallery
-   Documents
-   Search
-   Settings
-   Admin
-   Guest

Fix regressions immediately.

------------------------------------------------------------------------

# Frontend Verification

Verify:

-   no redesign
-   no CSS changes
-   no Bootstrap structure changes
-   no deleted components
-   no renamed classes

If visual changes exist, revert them.

------------------------------------------------------------------------

# Logging Policy

Every important operation must log:

-   Authentication
-   CRUD
-   Upload
-   Google Drive
-   Startup
-   Errors
-   Permission failures

------------------------------------------------------------------------

# Error Handling

Never swallow exceptions.

Every exception must: - be logged - return meaningful responses - never
expose sensitive information

------------------------------------------------------------------------

# Performance Review

Review:

-   query count
-   indexes
-   pagination
-   N+1 queries
-   caching
-   upload performance

Optimize if necessary.

------------------------------------------------------------------------

# Production Mindset

Assume deployment immediately after completion.

Write production-grade code.

Avoid shortcuts.

------------------------------------------------------------------------

# Stop Rule

Never stop because of an error.

Investigate.

Fix.

Retest.

Continue.

Stop ONLY if:

-   external credentials are needed
-   destructive approval is required
-   requirement is genuinely ambiguous

------------------------------------------------------------------------

# Completion Rule

A feature is COMPLETE only when:

-   analyzed
-   implemented
-   reviewed
-   debugged
-   tested
-   runtime verified
-   regression tested
-   production ready

------------------------------------------------------------------------

# Final Report

Include:

-   Files Created
-   Files Modified
-   APIs Added
-   Database Changes
-   Frontend Changes
-   Tests Executed
-   Bugs Found
-   Bugs Fixed
-   Remaining Issues
-   Production Readiness
