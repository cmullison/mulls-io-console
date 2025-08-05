# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Please see .cursor/rules/ for a comprehensive overview of this project and its stack

## Project Overview

**Mulls.io Console** - Full-stack Next.js SaaS running on Cloudflare Workers with OpenNext. Multi-tenant architecture with teams, role-based permissions, and credit-based billing.

**Live demo**: https://dev.mulls.io  
**Based on**: https://github.com/LubomirGeorgiev/cloudflare-workers-nextjs-saas-template

## Development Commands

```bash
# Development
pnpm dev                    # Start Next.js dev server
pnpm build                  # Build for production
pnpm deploy                 # Deploy to Cloudflare Workers
pnpm preview                # Preview production build locally

# Database
pnpm db:generate [NAME]     # Generate migration (never write SQL manually)
pnpm db:migrate:dev         # Apply migrations locally
pnpm db:migrate:prod        # Apply migrations to production

# Type Generation
pnpm cf-typegen             # Generate Cloudflare types after updating wrangler.jsonc

# Testing & Linting
pnpm lint                   # Run Next.js linter
pnpm build:analyze          # Analyze bundle size

# Email Development
pnpm email:dev              # Start email template dev server on :3001
```

## Architecture & Key Files

### Entry Points
- **Worker**: `agents-worker.js` - Custom worker combining OpenNext + Agents routing
- **Config**: `wrangler.jsonc` - Cloudflare Workers configuration with all bindings
- **Build Output**: `.open-next/worker.js` - Generated OpenNext worker

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React Server Components, TypeScript, Tailwind CSS v4, Shadcn UI
- **Backend**: Cloudflare Workers, D1 (SQLite), KV (sessions), R2 (file storage), Durable Objects
- **Auth**: Lucia Auth with WebAuthn/Passkeys, Google OAuth, email/password
- **ORM**: DrizzleORM with D1 adapter
- **Payments**: Stripe (credit-based, not subscription)
- **AI**: OpenAI and Anthropic via Cloudflare AI Gateway

### Code Conventions

**TypeScript & Imports**:
- Function parameters: When >1 parameter, pass as named object
- Add `import "server-only"` for server-only files (except page.tsx)
- Global types go in `custom-env.d.ts` (not `cloudflare-env.d.ts`)
- Use interfaces over types, avoid enums
- Prefer functional programming, avoid classes

**Authentication**:
- Server components: Use `getSessionFromCookie` from `src/utils/auth.ts`
- Client components: Use `useSessionStore()` from `src/state/session.ts`
- Server actions: Use `import { useServerAction } from "zsa-react"`

**Database**:
- No transactions (D1 limitation)
- Never pass ID when inserting (auto-generated)
- Schema location: `src/db/schema.ts`

**Performance**:
- Minimize client components, favor React Server Components
- Use `'use client'` sparingly
- Wrap client components with Suspense boundaries
- Use dynamic imports for non-critical components

**Package Management**:
- Always use `pnpm` for dependencies
- Run `pnpm cf-typegen` after adding new Cloudflare primitives

## AI Agents Implementation

**✅ COMPLETED: Cloudflare Agents Integration**

### Architecture Overview

This project implements AI agents using Cloudflare's Agents SDK with Durable Objects for persistent, real-time WebSocket communication. The implementation supports both development (Next.js API routes) and production (Cloudflare Workers with Durable Objects).

### Key Components

#### 1. **Worker Entry Point**

- **File**: `agents-worker.js` (referenced in `wrangler.jsonc`)
- **Purpose**: Custom worker that combines OpenNext (Next.js) with Cloudflare Agents routing
- **Functionality**:
  - Routes WebSocket requests to `/agents/*` paths to Durable Objects
  - Falls back to OpenNext worker for all other requests
  - Exports all agent Durable Object classes

#### 2. **Agent Durable Objects**

- **Location**: Defined inline in `agents-worker.js`
- **Classes**: Sequential, Routing, Parallel, Orchestrator, Evaluator
- **Features**:
  - WebSocket-based real-time communication
  - Persistent state across browser sessions
  - Integrated with OpenAI via Cloudflare AI Gateway
  - Toast notifications and status updates

#### 3. **Frontend Integration**

- **File**: `src/app/(dashboard)/dashboard/agents/page.tsx`
- **Hook**: Uses `useAgent` from `agents/react` package
- **UI**: Modern Shadcn components with real-time status updates
- **Communication**: WebSocket connections to Durable Objects

#### 4. **Environment Variables**

Required for production deployment:

```
OPENAI_API_KEY=your_openai_key
AI_GATEWAY_ACCOUNT_ID=your_cloudflare_account_id
AI_GATEWAY_ID=your_gateway_id
AI_GATEWAY_TOKEN=your_gateway_token
```

#### 5. **Durable Object Configuration**

- **File**: `wrangler.jsonc`
- **Bindings**: Sequential, Routing, Parallel, Orchestrator, Evaluator
- **Migration**: v2 tag for agent classes deployment

### Agent Patterns Implemented

1. **Sequential (Prompt Chaining)**: Decomposes tasks into sequential steps with quality checks
2. **Routing**: Classifies input and routes to specialized handlers
3. **Parallel**: Runs multiple reviews (security, performance, maintainability) concurrently
4. **Orchestrator**: Dynamically breaks down complex tasks into worker LLMs
5. **Evaluator**: Iterative translation with quality evaluation and improvement loops

### Deployment Architecture

**Development**:

- Next.js dev server with API routes at `/api/agents/*`
- HTTP-based communication for local testing

**Production**:

- Cloudflare Workers with Durable Objects
- WebSocket-based real-time communication
- Global edge deployment with persistent state

### Technical Benefits

- **Real-time Updates**: WebSocket streaming of agent progress
- **Persistent State**: Agents survive browser refreshes
- **Global Scale**: Edge deployment with low latency
- **Cost Effective**: Pay-per-use compute model
- **Memory Isolation**: Each agent runs independently

This implementation follows Anthropic's research on building effective agents while leveraging Cloudflare's infrastructure for production-grade deployment.

### Agent Repurposing Architecture

**✅ HIGHLY REPURPOSABLE** - The agents use a flexible factory pattern that allows complete workflow customization without touching Durable Objects:

#### **Generic Agent Factory**
```javascript
function createAgent(name, workflow) {
  return class extends Agent {
    // Base functionality is standardized
    // Only the workflow function changes
  }
}
```

#### **What Can Be Changed Without DO Modifications:**
- **Prompts** - Complete prompt rewrites
- **Input schemas** - Different input parameters  
- **Output formats** - Different return structures
- **Model selection** - Switch between GPT-4, Claude, etc.
- **Workflow logic** - Completely different processing steps
- **AI provider usage** - Mix and match OpenAI/Anthropic calls

#### **Available Agent Patterns:**
1. **Sequential** - Multi-step workflows (e.g., blog writing → SEO → polish)
2. **Routing** - Classification → specialized action
3. **Parallel** - Multi-perspective analysis (e.g., legal, technical, marketing views)
4. **Orchestrator** - Complex project breakdown → delegation → synthesis
5. **Evaluator** - Iterative improvement loops
6. **SequentialBuilder** - Landing page creation workflow
7. **ParallelSections** - Parallel content generation with consistency
8. **EvaluatorOptimizer** - Copy optimization with A/B testing

#### **Repurposing Process:**
1. Keep existing DO bindings in `wrangler.jsonc`
2. Keep base agent infrastructure in `agents-worker.js`
3. Only modify workflow functions (lines 96-323)
4. Update frontend forms to match new input requirements

The agents are essentially **configurable workflow engines** - you're just changing the "recipe" they follow, not the underlying infrastructure.

## File Storage (R2 Integration)

- **Browser**: `/src/app/(dashboard)/dashboard/files/`
- **API**: `/src/app/api/r2/buckets/[bucket]/[...key]/route.ts`
- **Buckets**: documents, images, videos, chum, sd-chat
- **Features**: Upload, preview, folder navigation, file management

## Analytics

- **Dashboard**: `/src/app/(dashboard)/dashboard/analytics/`
- **Backend**: Cloudflare Analytics Engine integration
- **Features**: Time-series charts, paginated tables, search/filter

## Billing System

- **Model**: Credit-based (not subscription)
- **Credits**: Monthly refresh, 2-year expiration
- **Integration**: Stripe for payment processing
- **Location**: `/src/app/(dashboard)/dashboard/billing/`

## To Do

- ✅ Upgrade to tailwind 4 (COMPLETED)
- ✅ AI Agents with Cloudflare Durable Objects (COMPLETED)
- ✅ R2 file explorer integration (COMPLETED)
- Add pagination to R2 file browser for large buckets (use R2's `maxKeys` parameter and implement next/previous navigation to improve performance on directories with many files)
- Create a new dashboard page for text-to-image generation. this will be the only entry point to text-to-image generation, so it will need to be dynamic in that the model can be configured, and thus configurations for the user to choose from will also need to be dynamic. however, given that this is mainly intended to be for non-technical users, we may opt for doing the heavy lifting there on the users' behalf. let's discuss.
- I also want a general prompt repository, so we'll have to incorporate d1 database somehow into that. I have a UI in mind for the prompt repo already, so remind me to grab that for you when we get to this step
- Repurpose settings page/subpages for notifications