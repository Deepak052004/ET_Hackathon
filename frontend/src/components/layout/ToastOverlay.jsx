import { useState, useEffect } from 'react';

export default function ToastOverlay() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message: e.detail }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };

    window.addEventListener('toast', handleToast);
    return () => window.removeEventListener('toast', handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className="bg-surface-container-highest border border-primary text-primary px-4 py-3 min-w-[250px] shadow-lg animate-in slide-in-from-bottom-5 fade-in flex items-center gap-3"
        >
          <span className="material-symbols-outlined text-sm">terminal</span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
