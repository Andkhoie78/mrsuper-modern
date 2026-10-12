import {api} from './client';

const PREFIX = 'mrsuper:public:';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export function readPublicCache(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writePublicCache(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Cache failure must never block the UI.
  }
}

export async function publicGet(url, config = {}) {
  try {
    return await api.get(url, {...config, timeout: 8000});
  } catch (error) {
    const status = error?.response?.status;

    if (status && ![502, 503, 504].includes(status)) {
      throw error;
    }

    // One short retry for transient upstream failures; never block the UI for 8 seconds.
    await wait(450);

    return api.get(url, {...config, timeout: 8000});
  }
}