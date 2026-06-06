# Rwive Product Roadmap (roadmap.md)

This document tracks the phased development plan for Rwive. The primary focus is achieving a rock-solid, privacy-first, activity-driven MVP.

---

## 📅 Phase 1: MVP (Version 0.1) — Core Focus
The goal of the MVP is to establish the fundamental loop: **Speak/Type Activity → Log to Memory → Update Project Health/Timeline → Reflect in Check-Ins.**

### 1. Features In-Scope
* **User Authentication**: Secure user login and workspace isolation.
* **Life Areas**: Establish the core categories (Family, Health, Career, Business, Learning, Creative, Finance, Relationships).
* **Projects**:
  * Create and manage projects associated with Life Areas.
  * Deterministic health status (Green: updated 0-7 days ago, Yellow: 8-30 days ago, Red: 31+ days ago).
  * Project Timeline: Capture milestones (Idea Created, Research Started, Design Completed, Paused, Resumed, Completed).
* **Activity Engine**:
  * Record activities with natural language.
  * Structured output extraction (via server-side AIService) to classify the activity, relate it to a project, and log timestamp/details.
* **Daily Check-Ins**:
  * **Morning Brief**: Today's priorities, active projects, neglected projects, upcoming commitments.
  * **Evening Review**: Ask "What did you work on today?" and log responses directly into activities.
* **Basic Voice Interaction**:
  * Push-to-Talk (hold to record voice transcript using Browser Speech Recognition).
  * Text-to-Speech responses (Browser Speech Synthesis).
* **Memory Abstraction**:
  * Implementation of `MemoryService` and a `LocalStorageProvider` for rapid, zero-cost, local-first prototyping.

### 2. Strict Out-of-Scope (Forbidden in MVP)
* Social features or sharing.
* Shared workspaces, teams, or collaborative projects.
* Marketplace or third-party plugins.
* Calendar synchronization (Google/Outlook).
* Email integrations.
* Complex workflows or automations.

---

## 📅 Phase 2: Vector Memory & Advanced Realtime Voice
* **Vector Memory Integration**:
  * Transition from basic JSON queries to a semantic Vector Memory Store.
  * Allow the AI to retrieve contextually similar past activities or decisions from months ago.
* **Gemini Live / OpenAI Realtime integration**:
  * Upgrade the Push-to-Talk transcribing interface to a continuous, low-latency, bidirectional audio dialogue.

---

## 📅 Phase 3: Local Models & Telephony Integration
* **Local LLM Support**:
  * Option to route `AIService` tasks to local models (via Ollama running Llama, Qwen, Gemma) for 100% offline and private deployment.
* **Telephony Integration**:
  * Enable Rwive to call the user's phone for check-ins or accept incoming phone calls, acting as a true personal voice assistant.
