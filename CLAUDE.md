Please see .cursor/rules/ for a comprehensive overview of this project and its stack

The entry point to this worker is at .open-next/worker.js

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

To do:

- ✅ Upgrade to tailwind 4 (COMPLETED)
- ✅ AI Agents with Cloudflare Durable Objects (COMPLETED)
- Update the color palette in `src/app/globals.css`
