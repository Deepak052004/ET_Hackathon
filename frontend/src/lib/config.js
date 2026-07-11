// ─── API Configuration ────────────────────────────────────────────────────────
// Source: VITE_API_URL from .env (set to http://localhost:8000 for local dev)
// Never hardcode URLs — always use this constant.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
