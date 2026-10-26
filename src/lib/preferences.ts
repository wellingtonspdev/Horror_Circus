export function readPreference(key: string, fallback: string) {
  try {
    return localStorage.getItem(`astro-change.${key}`) ?? fallback;
  } catch {
    return fallback;
  }
}
export function savePreference(key: string, value: string) {
  try {
    localStorage.setItem(`astro-change.${key}`, value);
  } catch {
    /* Private browsing may disallow persistence. */
  }
}
export function sessionValue(key: string) {
  try {
    return sessionStorage.getItem(`astro-change.${key}`);
  } catch {
    return null;
  }
}
export function markSession(key: string) {
  try {
    sessionStorage.setItem(`astro-change.${key}`, "yes");
  } catch {
    /* Session deduplication still works in mounted state. */
  }
}

