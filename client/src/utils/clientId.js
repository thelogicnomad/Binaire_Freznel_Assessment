/**
 * Client Identity Manager
 * Ensures a persistent unique client ID (UUID) is stored in localStorage per browser session.
 */
const STORAGE_KEY = 'csv_queue_client_id';

/**
 * Generate standard RFC4122 v4 UUID
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Retrieve current client ID or create and persist a new one if not found.
 * @returns {string} UUID
 */
export function getClientId() {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = `client-${generateUUID()}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

/**
 * Reset client ID to simulate a brand-new user or machine.
 * @returns {string} New UUID
 */
export function resetClientId() {
  const newId = `client-${generateUUID()}`;
  localStorage.setItem(STORAGE_KEY, newId);
  return newId;
}

/**
 * Format a client ID for compact UI display
 * e.g. "client-7f3b8a...1c4d"
 */
export function formatClientId(id) {
  if (!id) return 'Unknown Client';
  const clean = id.replace(/^client-/, '');
  if (clean.length <= 12) return id;
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
}
