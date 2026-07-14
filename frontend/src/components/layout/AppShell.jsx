import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import OfflineBanner from '../ui/OfflineBanner';

// ─── AppShell ─────────────────────────────────────────────────────────────────
// Root layout container: sidebar rail + vertical content stack.
// <Outlet /> is rendered inside the scrollable <main> area.

export default function AppShell() {
  return (
    <div className="bg-background text-on-surface font-sans overflow-hidden min-h-screen">
      <Header />
      <Sidebar />
      <OfflineBanner />
      <main className="ml-0 md:ml-64 mt-16 p-6 h-[calc(100vh-64px)] overflow-y-auto scroll-smooth">
        <div className="max-w-[1440px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
