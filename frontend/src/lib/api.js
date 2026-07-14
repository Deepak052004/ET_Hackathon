import { API_BASE_URL } from './config';

// ─── Fetch wrapper ────────────────────────────────────────────────────────────
// Every REST call goes through here.
// - 8000ms AbortController timeout on every request (per spec)
// - On timeout → throws { timeout: true, message: '...' }
// - On non-2xx → throws { status, message }
// - Never throws raw network errors — always wraps them

const DEFAULT_TIMEOUT = 30000;

async function request(method, path, body, timeoutMs = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const options = {
      method,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body !== undefined) options.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE_URL}${path}`, options);
    clearTimeout(timer);

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const err = await response.json();
        message = err.detail || err.message || message;
      } catch (_) { /* ignore parse error */ }
      throw { status: response.status, message };
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw { timeout: true, message: 'Network Timeout: Core Industrial Brain Unreachable. Check Local Node Routing Status.' };
    }
    // Re-throw structured errors as-is, wrap unknown network errors
    if (err.status || err.timeout) throw err;
    throw { status: 0, message: err.message || 'Network error' };
  }
}

export const api = {
  get:  (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
};
