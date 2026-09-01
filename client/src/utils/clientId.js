const STORAGE_KEY = 'csv_queue_client_id';

function genUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getClientId() {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = `client-${genUuid()}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function resetClientId() {
  const newId = `client-${genUuid()}`;
  localStorage.setItem(STORAGE_KEY, newId);
  return newId;
}

export function formatClientId(id) {
  if (!id) return 'Unknown Client';
  const clean = id.replace(/^client-/, '');
  if (clean.length <= 12) return id;
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
}
