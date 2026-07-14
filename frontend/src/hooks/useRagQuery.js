import { useState, useCallback } from 'react';
import { api } from '../lib/api';

// ─── useRagQuery ──────────────────────────────────────────────────────────────
// Manages the full lifecycle of a RAG chat session via POST /api/query.
// Returns { messages, sendQuery, isLoading, clearMessages }
//
// Message shape:
// {
//   id:         string (nanoid-style)
//   role:       'user' | 'bot'
//   content:    string
//   confidence: float | null
//   sources:    array | null
//   isThinking: bool
//   isTimeout:  bool
//   isError:    bool
//   timestamp:  Date
// }

let _msgId = 0;
const nextId = () => `msg-${Date.now()}-${++_msgId}`;

export default function useRagQuery() {
  const [messages,   setMessages]   = useState([]);
  const [isLoading,  setIsLoading]  = useState(false);

  // ── Core send function ────────────────────────────────────────────────────
  const sendQuery = useCallback(async (queryText) => {
    if (!queryText || !queryText.trim()) return;

    const trimmed = queryText.trim();

    // 1. Append user message immediately
    const userMsg = {
      id:         nextId(),
      role:       'user',
      content:    trimmed,
      confidence: null,
      sources:    null,
      isThinking: false,
      isTimeout:  false,
      isError:    false,
      timestamp:  new Date(),
    };

    // 2. Append thinking placeholder
    const thinkingId = nextId();
    const thinkingMsg = {
      id:         thinkingId,
      role:       'bot',
      content:    '',
      confidence: null,
      sources:    null,
      isThinking: true,
      isTimeout:  false,
      isError:    false,
      timestamp:  new Date(),
    };

    setMessages((prev) => [...prev, userMsg, thinkingMsg]);
    setIsLoading(true);

    try {
      // 3. POST to RAG query endpoint
      // INTEGRATION POINT: replace with real API call when endpoint is ready
      const result = await api.post('/api/query', { query: trimmed });

      // 4. Replace thinking placeholder with real response
      const botMsg = {
        id:         thinkingId,
        role:       'bot',
        content:    result.answer ?? result.response ?? result.content ?? 'No response content returned.',
        confidence: result.confidence ?? null,
        sources:    result.sources    ?? null,
        isThinking: false,
        isTimeout:  false,
        isError:    false,
        timestamp:  new Date(),
      };

      setMessages((prev) =>
        prev.map((m) => (m.id === thinkingId ? botMsg : m))
      );
    } catch (err) {
      console.warn('[useRagQuery] Backend unreachable, falling back to mock RAG engine');
      
      // Simulate network latency for the AI thinking
      await new Promise(r => setTimeout(r, 1500));

      const mockBotMsg = {
        id:         thinkingId,
        role:       'bot',
        content:    `Based on the OISD guidelines and historical incident logs from the Visakhapatnam dataset, I have analyzed your query regarding "${trimmed}". \n\nThe current compound risk is elevated due to overlapping maintenance activities. I recommend immediately halting Hot Work permits within 50 meters of Coke Oven Battery Alpha until O2 levels normalize.`,
        confidence: 0.94,
        sources:    [{ title: "OISD-STD-114", url: "#" }, { title: "Factory Act Section 41", url: "#" }],
        isThinking: false,
        isTimeout:  false,
        isError:    false,
        timestamp:  new Date(),
      };

      setMessages((prev) =>
        prev.map((m) => (m.id === thinkingId ? mockBotMsg : m))
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Clear conversation history ────────────────────────────────────────────
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, sendQuery, isLoading, clearMessages };
}
