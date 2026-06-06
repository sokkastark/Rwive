<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Rwive Developer & Agent Guidelines (agents.md)

This document defines the non-negotiable architectural principles, folder structures, and coding rules for Rwive. All AI agents and developers working on this project must strictly adhere to these guidelines.

---

## 1. Technical Stack & UI Constraints
* **Framework**: Next.js (App Router), TypeScript.
* **Styling**: Tailwind CSS, ShadCN UI Components, Vanilla CSS.
* **Aesthetics**: Premium modern design system, harmonious color palettes, smooth hover effects, micro-animations. Avoid default colors or basic layouts.
* **Code Size Restriction**: No source file (components, services, hooks, utilities, styles) may exceed **250 lines**. 
  * If a file approaches 250 lines, it must be split (e.g., extract sub-components, move business logic to hooks, extract utility functions).
  * Single Responsibility Principle (SRP) is strictly mandatory.

---

## 2. Memory-First Architecture
* **Memory is the Product, AI is a Feature**: The AI is a processor and advisor; it is NOT the memory store.
* **Memory Ownership**: All user memory (projects, goals, activities, relationships, habits, decisions, milestones, reminders, life areas) must be represented as structured, portable, human-readable JSON objects.
* **Access Control**:
  * The UI and AI components must **never** directly access or write to database tables or physical storage.
  * All memory operations must flow through `MemoryService` to be validated and executed.
  * The `MemoryService` delegates physical persistence to a `MemoryProvider` interface.
  * Physical storage for Phase 1 is limited to **Browser Local Storage** or **Supabase JSONB** (configured via provider). Writing direct local files on disk is prohibited due to Vercel/serverless runtime limits.

```text
UI / Voice Component
       ↓
 MemoryService (Operation validation)
       ↓
 MemoryProvider (Interface)
       ↓
Storage (Browser Local Storage or Supabase JSONB)
```

---

## 3. Strict Abstraction Rules

### A. AI Abstraction (AIService)
* The UI must never import LLM SDKs or communicate directly with model providers (OpenAI, Gemini, etc.).
* All AI requests must go through `AIService`.
* `AIService` runs **Server-Only** (Next.js API routes or Server Actions) to protect API keys.
* Model providers must be swappable via configuration:
  * Phase 1: OpenAI
  * Phase 2: Gemini
  * Phase 3: Local Models (Ollama, Llama, Qwen, Gemma)

### B. Voice Abstraction (VoiceService)
* `VoiceService` runs **Client-Only** (browser speech recognition and synthesis APIs).
* Interaction flow:
  1. Client captures voice input (Push-to-Talk: hold to speak, release to submit).
  2. Browser transcribes audio to text client-side.
  3. Text transcript is sent to a server-side route for execution.
* Speech synthesis (text-to-speech) runs client-side.
* Speech synthesis defaults: rate: `1.0`, pitch: `1.0`, language: `en-IN`.

---

## 4. Activity Processing & Validation
* **Structured Output Only**: Natural language inputs (voice transcripts/text chat) must be processed by the LLM using **Structured Outputs** (JSON schemas). Regex parsing is strictly prohibited.
* **Execution Flow**:
  1. User speaks: *"Worked on ZenRide dashboard today."*
  2. `AIService` parses and outputs a structured operation:
     ```json
     {
       "operation": "LOG_ACTIVITY",
       "project": "ZenRide",
       "activity": "Dashboard Development",
       "date": "2026-06-06"
     }
     ```
  3. The operation JSON is sent to `MemoryService` which validates the project, creates the activity log, updates project metadata, and persists the JSON.
  4. The AI must **never** modify memory directly.

---

## 5. Deterministic Momentum & Health
* **Code Calculates, AI Advises**: The AI does not decide project health or status, as LLM outputs are non-deterministic.
* **Health Calculations**: Project health must be computed in code based on the time elapsed since the last logged activity:
  * **Green (Healthy)**: Activity updated in the last `0` to `7` days.
  * **Yellow (At Risk)**: Activity updated in the last `8` to `30` days.
  * **Red (Neglected)**: No activity in the last `31+` days.
* **AI Role**: The AI analyzes the calculated metrics and provides context-aware guidance (e.g., *"ZenRide has drifted to Yellow because there has been no activity for 10 days. Would you like to schedule a small task today?"*).

---

## 6. Directory Layout (ISO-Compliant)
Keep the project organized strictly within these directories under `src/`:
```text
src/
├── app/          # Next.js App Router pages and API routes
├── components/   # UI components grouped by feature area
│   ├── common/
│   ├── dashboard/
│   ├── projects/
│   ├── activities/
│   ├── voice/
│   └── companion/
├── hooks/        # Reusable React hooks
├── services/     # Services (AIService, VoiceService, MemoryService)
├── memory/       # MemoryProviders and schema validation logic
├── lib/          # Third-party wrappers (Supabase clients, etc.)
├── types/        # TypeScript type definitions
├── store/        # State management (Zustand or context providers)
├── styles/       # Tailwind and global CSS files
├── prompts/      # System prompts and structured JSON templates
└── utils/        # General helper functions
```

---

## 7. No Mock Data Rule
* **No Mock Data Allowed**: Do not introduce mock data structures, fake logs, dummy projects, or mock databases into the project source code.
* **Use Real Data Only**: If you require realistic data or sample records to test features, verify components, or run scenarios, you **MUST** ask the user directly for real-world data to use. 
* **Prevention of Regression**: Standardizing on real data ensures schemas align with actual production usage and prevents regressions when moving from local storage to database providers.

---

## 8. Testing & Business Logic Rule
* **Service Test Requirement**: Every service must have a matching test file.
* **Service Verification**: Services may not be merged or considered complete without passing tests.
* **Separation of Concerns**: Business logic must never exist only inside UI components. Move computations and logic to services, hooks, or utility functions.

---

## 9. Observation Factuality Rule
* **Factual Observations Only**: All observations generated by the system (rules-based or AI-based) must be strictly factual and traceable to stored data.
* **No Speculation**: Observations must not infer the user's emotional states, motivations, or intentions. (e.g. State "No activity recorded for 60 days" instead of "You have lost interest in the project"). Staying objective and non-judgmental is critical to preserving user trust.

---

## 10. Briefing & Dialogue Factuality Rule
* **No Fact Hallucination**: Briefings and summaries may prioritize, summarize, or suggest actions, but they must **never** create new facts. All statements must be strictly traceable to stored memory or active observations.
* **Traceable Suggestions**: Recommendations must be objective, helpful actions derived directly from rule configurations, avoiding speculative psychological assertions.
* **Briefing Abstraction Rule**: The `BriefingEngine` may only consume structured memory (projects, activities, relationships) and `Observations`. It must never query AI providers directly.




