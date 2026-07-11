import { io } from 'socket.io-client';
import { API_BASE_URL } from './config';

// ─── Singleton Socket.io client ───────────────────────────────────────────────
// Backend: python-socketio ASGI mounted at /socket.io/
// Frontend usage: import { socket } from '@/lib/socket'
//
// Reconnection strategy:
//   - Starts at 1s delay, doubles each retry, caps at 30s (exponential backoff)
//   - randomizationFactor adds ±50% jitter to prevent thundering-herd
//   - reconnectionAttempts: Infinity → keeps trying until backend is back
//
// Confirmed events emitted by server (from main.py):
//   initial-state  → once on connect
//   sensor-data    → every 3s
//   risk-updates   → every 9s
//   worker-locations → every 9s (payload: workers: [])
//   alerts         → every 15s
//
// Confirmed client → server:
//   ping → server responds pong

export const socket = io(API_BASE_URL, {
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
  randomizationFactor: 0.5,
  transports: ['websocket', 'polling'],
  autoConnect: true,
});
