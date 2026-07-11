import { useEffect } from 'react';
import { socket } from '../lib/socket';
import { useStore } from '../lib/store';
import { MOCK_SENSORS, MOCK_ZONES, MOCK_ALERTS } from '../lib/mockData';

// ─── useSocket ────────────────────────────────────────────────────────────────
// Subscribes to all Socket.io events and syncs them into the Zustand store.
// Falls back to mock data whenever the socket is disconnected / errored.
// Run this hook exactly once at the App level (inside <BrowserRouter>).

export default function useSocket() {
  const setSocketStatus  = useStore((s) => s.setSocketStatus);
  const setLastHeartbeat = useStore((s) => s.setLastHeartbeat);
  const setSensors       = useStore((s) => s.setSensors);
  const setZones         = useStore((s) => s.setZones);
  const setLiveAlerts    = useStore((s) => s.setLiveAlerts);
  const setWorkers       = useStore((s) => s.setWorkers);

  useEffect(() => {
    // ── Helper: load mock data when offline ──────────────────────────────────
    function loadMockFallback() {
      // INTEGRATION POINT: replace with real API call when backend is stable
      setSensors(MOCK_SENSORS);
      setZones(MOCK_ZONES);
      setLiveAlerts(MOCK_ALERTS);
    }

    // ── Connection lifecycle ─────────────────────────────────────────────────
    function handleConnect() {
      setSocketStatus('online');
      setLastHeartbeat(new Date());
    }

    function handleDisconnect() {
      setSocketStatus('offline');
      loadMockFallback();
    }

    function handleConnectError() {
      setSocketStatus('offline');
      loadMockFallback();
    }

    // ── Data events ──────────────────────────────────────────────────────────
    // Backend emits 'initial-state' once on connect with the full snapshot
    function handleInitialState(payload) {
      const { sensors, zones, alerts } = payload || {};
      if (sensors) setSensors(sensors);
      if (zones)   setZones(zones);
      if (alerts)  setLiveAlerts(alerts);
      setLastHeartbeat(new Date());
    }

    // Backend emits 'sensor-data' every ~3 seconds
    function handleSensorData(payload) {
      const { sensors } = payload || {};
      if (sensors) setSensors(sensors);
      setLastHeartbeat(new Date());
    }

    // Backend emits 'risk-updates' every ~9 seconds
    function handleRiskUpdates(payload) {
      const { zones } = payload || {};
      if (zones) setZones(zones);
    }

    // Backend emits 'worker-locations' every ~9 seconds (currently always [])
    function handleWorkerLocations(payload) {
      const { workers } = payload || {};
      if (Array.isArray(workers)) setWorkers(workers);
    }

    // Backend emits 'alerts' every ~15 seconds
    function handleAlerts(payload) {
      const { alerts } = payload || {};
      if (alerts) setLiveAlerts(alerts);
    }

    // ── Register all listeners ───────────────────────────────────────────────
    socket.on('connect',          handleConnect);
    socket.on('disconnect',       handleDisconnect);
    socket.on('connect_error',    handleConnectError);
    socket.on('initial-state',    handleInitialState);
    socket.on('sensor-data',      handleSensorData);
    socket.on('risk-updates',     handleRiskUpdates);
    socket.on('worker-locations', handleWorkerLocations);
    socket.on('alerts',           handleAlerts);

    // If the socket is already connected when this effect runs (e.g. HMR reload)
    // immediately flip to online status.
    if (socket.connected) {
      setSocketStatus('online');
      setLastHeartbeat(new Date());
    }

    // ── Periodic ping every 30 s ─────────────────────────────────────────────
    // Keeps the heartbeat timestamp fresh and helps detect silent drops.
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
        setLastHeartbeat(new Date());
      }
    }, 30_000);

    // ── Cleanup on unmount ───────────────────────────────────────────────────
    return () => {
      socket.off('connect',          handleConnect);
      socket.off('disconnect',       handleDisconnect);
      socket.off('connect_error',    handleConnectError);
      socket.off('initial-state',    handleInitialState);
      socket.off('sensor-data',      handleSensorData);
      socket.off('risk-updates',     handleRiskUpdates);
      socket.off('worker-locations', handleWorkerLocations);
      socket.off('alerts',           handleAlerts);
      clearInterval(pingInterval);
    };
  }, [
    setSocketStatus,
    setLastHeartbeat,
    setSensors,
    setZones,
    setLiveAlerts,
    setWorkers,
  ]);
}
