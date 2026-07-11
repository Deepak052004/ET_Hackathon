import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import OfflineBanner from '../ui/OfflineBanner';

// ─── AppShell ─────────────────────────────────────────────────────────────────
// Root layout container: sidebar rail + vertical content stack.
// <Outlet /> is rendered inside the scrollable <main> area.

export default function AppShell() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Left navigation rail */}
      <Sidebar />

      {/* Right content column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <OfflineBanner />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-950 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
