import { create } from 'zustand';

// ─── Zustand Global Store ─────────────────────────────────────────────────────
// Shape populated by:
//   - useSocket hook (socket events)
//   - Individual data hooks (REST calls)

export const useStore = create((set, get) => ({
  // ── Socket connection state ──────────────────────────────────────────────
  socketStatus: 'connecting',  // 'connecting' | 'online' | 'offline'
  lastHeartbeat: null,

  // ── Live data from socket events ─────────────────────────────────────────
  // sensor-data + initial-state → array of sensor objects
  sensors: [],
  // risk-updates + initial-state → array of zone objects
  zones: [],
  // alerts socket event + initial-state → top 10 active alerts
  liveAlerts: [],
  // worker-locations → currently empty array per backend (Phase 3 placeholder)
  workers: [],

  // ── UI State ─────────────────────────────────────────────────────────────
  activeModal: null, // 'terminal' | 'settings' | 'notifications' | 'emergency' | 'logs' | null

  // ── Actions ──────────────────────────────────────────────────────────────
  setSocketStatus: (status) => set({ socketStatus: status }),
  setLastHeartbeat: (ts) => set({ lastHeartbeat: ts }),
  setSensors: (sensors) => set({ sensors }),
  setZones: (zones) => set({ zones }),
  setLiveAlerts: (alerts) => set({ liveAlerts: alerts }),
  setWorkers: (workers) => set({ workers }),
  
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
}));
