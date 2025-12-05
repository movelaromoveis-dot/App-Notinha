import { openDB } from 'idb';

const DB_NAME = 'notafacil_offline_db';
const STORE_NAME = 'pending_notes';
const DB_VERSION = 1;

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export async function enqueueNote(note) {
  const db = await getDb();
  const item = {
    id: note.temp_id || `t_${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
    created_at: new Date().toISOString(),
    note,
    status: 'pending',
  };
  await db.put(STORE_NAME, item);
  return item;
}

export async function getAllPending() {
  const db = await getDb();
  return (await db.getAll(STORE_NAME)).filter(i=>i.status==='pending');
}

export async function markAsSent(id, serverResponse) {
  const db = await getDb();
  const rec = await db.get(STORE_NAME, id);
  if (!rec) return;
  rec.status = 'sent';
  rec.sent_at = new Date().toISOString();
  rec.serverResponse = serverResponse || null;
  await db.put(STORE_NAME, rec);
}

export async function removeRecord(id) {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}

export async function countPending() {
  const db = await getDb();
  const all = await db.getAll(STORE_NAME);
  return all.filter(i=>i.status==='pending').length;
}

export default {
  enqueueNote,
  getAllPending,
  markAsSent,
  removeRecord,
  countPending,
};
