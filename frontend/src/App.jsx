import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import useSocket from './hooks/useSocket';

// ─── Lazy page imports ────────────────────────────────────────────────────────
const Dashboard    = React.lazy(() => import('./pages/Dashboard'));
const Investigation = React.lazy(() => import('./pages/Investigation'));
const Permits      = React.lazy(() => import('./pages/Permits'));
const Graph        = React.lazy(() => import('./pages/Graph'));
const Documents    = React.lazy(() => import('./pages/Documents'));
const Alerts       = React.lazy(() => import('./pages/Alerts'));
const Settings     = React.lazy(() => import('./pages/Settings'));
const NotFound     = React.lazy(() => import('./pages/NotFound'));

// ─── Full-screen dark loading fallback ───────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        {/* Pulsing shield logo mark */}
        <svg
          viewBox="0 0 48 48"
          className="h-10 w-10 animate-pulse text-cobalt"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M24 4L6 12v14c0 9.6 7.7 18.6 18 21 10.3-2.4 18-11.4 18-21V12L24 4z" />
        </svg>
        <span className="font-mono text-xs text-slate-500 tracking-widest uppercase">
          Loading Module…
        </span>
      </div>
    </div>
  );
}

// ─── Inner app — useSocket runs here, inside BrowserRouter ───────────────────
// This component is separate so that useSocket (which uses no router APIs)
// runs exactly once for the entire session.
function AppInner() {
  // Connects to socket and keeps Zustand store in sync for the whole session
  useSocket();

  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* All authenticated routes live inside AppShell */}
      <Route element={<AppShell />}>
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="/investigation"
          element={
            <Suspense fallback={<PageLoader />}>
              <Investigation />
            </Suspense>
          }
        />
        <Route
          path="/permits"
          element={
            <Suspense fallback={<PageLoader />}>
              <Permits />
            </Suspense>
          }
        />
        <Route
          path="/graph"
          element={
            <Suspense fallback={<PageLoader />}>
              <Graph />
            </Suspense>
          }
        />
        <Route
          path="/documents"
          element={
            <Suspense fallback={<PageLoader />}>
              <Documents />
            </Suspense>
          }
        />
        <Route
          path="/alerts"
          element={
            <Suspense fallback={<PageLoader />}>
              <Alerts />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<PageLoader />}>
              <Settings />
            </Suspense>
          }
        />
      </Route>

      {/* 404 catch-all */}
      <Route
        path="*"
        element={
          <Suspense fallback={<PageLoader />}>
            <NotFound />
          </Suspense>
        }
      />
    </Routes>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
