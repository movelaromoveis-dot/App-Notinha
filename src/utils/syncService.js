import offlineQueue from './offlineQueue';
import axios from 'axios';

let intervalId = null;
let isRunning = false;

export function startSync({ apiUrl, onStatusChange } = {}) {
  if (isRunning) return;
  isRunning = true;

  async function trySync() {
    try {
      const pending = await offlineQueue.getAllPending();
      if (!pending || pending.length === 0) {
        onStatusChange && onStatusChange({ online: true, syncing: false, pending: 0 });
        return;
      }

      // check server health
      const health = await axios.get(`${apiUrl}/` , { timeout: 5000 });
      if (!health || !health.data || !health.data.ok) {
        onStatusChange && onStatusChange({ online: false, syncing: false, pending: pending.length });
        return;
      }

      onStatusChange && onStatusChange({ online: true, syncing: true, pending: pending.length });

      // send in order
      for (const item of pending) {
        try {
          // assuming API accepts same note payload at POST /notes
          const res = await axios.post(`${apiUrl}/notes`, item.note, { timeout: 10000 });
          await offlineQueue.markAsSent(item.id, res.data);
        } catch (err) {
          // stop processing if network errors occur
          console.warn('Failed to send pending note', item.id, err.message || err);
          onStatusChange && onStatusChange({ online: false, syncing: false, pending: pending.length });
          break;
        }
      }

      // update status
      const remaining = await offlineQueue.getAllPending();
      onStatusChange && onStatusChange({ online: true, syncing: false, pending: remaining.length });
    } catch (err) {
      console.warn('SyncService error', err.message || err);
      onStatusChange && onStatusChange({ online: false, syncing: false, pending: await offlineQueue.countPending() });
    }
  }

  // run immediately and then interval
  trySync();
  intervalId = setInterval(trySync, 30 * 1000); // every 30s
}

export function stopSync() {
  if (!isRunning) return;
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
}
