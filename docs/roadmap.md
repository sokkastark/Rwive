# Rwive Product Roadmap (roadmap.md)

This document tracks the phased development plan for Rwive. The primary focus is achieving a rock-solid, privacy-first, activity-driven personal life companion.

---

## 📅 Phase 1: MVP Bootstrap (Version 0.1) — Complete
* **Companion-First UI**: Conversational check-in card with onboarding alerts, suggested focus card, and collapsible details panels.
* **Memory Core**: `MemoryService` executing activities, projects, relationships, and calculating trail statuses.
* **Deterministic Rules**: Project inactivity, relationship overdue, and momentum streaks evaluated dynamically.
* **Journey Feed**: Milepost timeline showing history of check-ins and registrations.
* **Local Storage & PWA**: Direct `localStorage` caching and Progressive Web App installability configuration with a cache-busting "Hard Refresh System."

---

## 📅 Phase 1.5: Core Companion OS (Version 1.1) — Next Focus
Based on real-world testing, we are delaying advanced AI features to ensure the core memory, commitments, habits, and notifications loop is rock-solid.

### 1. Cloud Sync (Supabase Integration)
* **Single Hardcoded User**: Bypass OAuth authentication flow complexities during validation. Bind data to owner ID `"stark"`.
* **Realtime Sync**: Synced databases between phone (PWA) and desktop browser.
* **Supabase JSONB / Tables**: Synchronize projects, people, activities, commitments, and habits.

### 2. First-Class Memory Types
Move from project-only logging to structured life actions:
* **Commitment**: One-off tasks with a due timestamp (e.g. *"Fix scooty in 1 hour"*), category, and status (`pending` | `completed` | `skipped`).
* **Habit**: Recurring actions with frequency (daily, weekly) and period (morning, evening) (e.g. *"Drink ash gourd juice daily"*).

### 3. Proactive Reminder Engine (No AI)
* **Status Watcher**: Checks pending commitments and active habits every minute.
* **Browser / Push Notifications**: Triggers system notifications when a commitment is due or a habit check-in is pending.
* **Interactive Actions**: Direct check-in responses from the notification itself (e.g. `✓ Done`, `⏰ Later`, `✗ Not Done`).

### 4. Today Dashboard Focus
Shift the homepage display hierarchy from raw list details to a daily focus feed:
* **Today List**: Display active habits, pending commitments, and suggeted relationship follow-ups due today.
* **Recent Journey**: The trail steps log.
* **Details Accordion**: Keeps raw Projects and People lists hidden.

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
  * Enable Rwive to call the user's phone for check-in briefs or accept incoming phone calls.
