# 06. Core Logic & Algorithms

## 6.1 The "Director" Pattern (Voice Orchestration)

The "Director" is the logic that governs the AI's behavior during a voice session. It prevents the AI from being a passive listener or a hallucinating storyteller.

**Algorithm:**
1.  **Input:** User Audio -> STT -> Text.
2.  **Context Assembly:**
    -   Fetch last 5 turns of conversation.
    -   Fetch related memories from Vector Store (RAG).
    -   Fetch current "Session Goal" (e.g., "Explore Childhood").
3.  **Strategy Selection (LLM):**
    -   Analyze User Input for Sentiment (Joy, Sadness, Hesitation).
    -   Select Strategy: `Deepen` (ask more), `Pivot` (change topic), `Validate` (empathize), `WrapUp`.
4.  **Response Generation:**
    -   Generate text based on Strategy.
    -   Inject `[emotion]` tags for TTS.
5.  **Execution:** Send to TTS.

---

## 6.2 Atom of Thoughts (AoT) Chapter Generation

We use a decomposition-synthesis approach to generate high-quality biographies, avoiding the "context window mush" of standard LLM calls.

**Phase 1: Decomposition (The Atoms)**
The transcript is fed into parallel "Atomic Agents":
1.  **Narrative Arc Agent:** Extracts the spine of the story in 1 sentence.
2.  **Quote Agent:** Extracts 2-3 verbatim quotes that are emotionally resonant.
3.  **Sensory Agent:** Extracts sights, sounds, smells ("smell of motor oil").
4.  **Fact Agent:** Extracts entities (Names, Dates, Locations).

**Phase 2: Synthesis (The Writer)**
The "Writer Agent" receives *only* the outputs of the Atomic Agents (not the full raw transcript, to prevent hallucination).
-   *Prompt:* "Write a chapter titled {NarrativeArc}. Include these quotes: {Quotes}. Weave in these sensory details: {Sensory}. Tone: {Tone}."

---

## 6.3 Proustian Trigger (Image Analysis)

**Logic:**
1.  User uploads Image.
2.  **Vision Model (Gemini Pro Vision):**
    -   Describe scene.
    -   Identify "Punctum" (the emotionally piercing detail).
3.  **Trigger Generation:**
    -   Instead of "What is this?", generate: "I see a blue bicycle. Was that your first bike?"
4.  **Session Priming:**
    -   The generated question becomes the `first_message` of the voice session.

---

## 6.4 Safety Monitor

**Logic:**
1.  **Regex Scan:** Fast pass for obvious keywords (suicide, kill, emergency).
2.  **LLM Classification:** Asynchronous pass. "Does this text indicate immediate risk of harm?"
3.  **Action:**
    -   If Risk > Threshold:
        -   Flag Session in DB.
        -   Send Email to Emergency Contact.
        -   (Optional) UI Warning: "If you need help, please call 911."
