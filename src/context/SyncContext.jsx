import React, { createContext, useState, useEffect } from 'react';
import { startSync, stopSync } from '../utils/syncService';
import offlineQueue from '../utils/offlineQueue';

export const SyncContext = createContext();

export function SyncProvider({ children }) {
  const [status, setStatus] = useState({ online: true, syncing: false, pending: 0 });

  useEffect(() => {
    let mounted = true;
    const onStatusChange = async (s) => {
      if (!mounted) return;
      const pending = typeof s.pending === 'number' ? s.pending : await offlineQueue.countPending();
      setStatus({ online: !!s.online, syncing: !!s.syncing, pending });
    };

    startSync({ apiUrl: (import.meta.env?.VITE_API_URL || 'http://localhost:4001'), onStatusChange });

    // ensure initial pending count
    (async () => {
      const p = await offlineQueue.countPending();
      setStatus((st) => ({ ...st, pending: p }));
    })();

    return () => { mounted = false; stopSync(); };
  }, []);

  return (
    <SyncContext.Provider value={{ status }}>
      {children}
    </SyncContext.Provider>
  );
}
