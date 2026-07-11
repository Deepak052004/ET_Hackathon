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
      const isTimeout = err?.timeout === true;

      // 5a. Timeout error message
      // 5b. Generic error message
      const errorMsg = {
        id:         thinkingId,
        role:       'bot',
        content: isTimeout
          ? 'Network Timeout: Core Industrial Brain Unreachable. Check Local Node Routing Status.'
          : err?.message || 'An unexpected error occurred while processing your query. Please try again.',
        confidence: null,
        sources:    null,
        isThinking: false,
        isTimeout:  isTimeout,
        isError:    !isTimeout,
        timestamp:  new Date(),
      };

      setMessages((prev) =>
        prev.map((m) => (m.id === thinkingId ? errorMsg : m))
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
