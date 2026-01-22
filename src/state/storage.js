import { APP } from "../config.js";

export function loadStorage() {
  try {
    const raw = localStorage.getItem(APP.storageKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStorage(obj) {
  try {
    localStorage.setItem(APP.storageKey, JSON.stringify(obj));
  } catch {
    // 失敗してもゲーム進行は止めない
  }
}

export function clearStorage() {
  try {
    localStorage.removeItem(APP.storageKey);
  } catch {
    // noop
  }
}
