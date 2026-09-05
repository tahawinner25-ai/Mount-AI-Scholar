/**
 * Guest Mode Session & 24h Lockout Management
 * 
 * Règles d'affaires :
 * - L'accès invité dure exactement 30 minutes (30 * 60 * 1000 ms).
 * - À l'issue des 30 minutes, l'utilisateur est déconnecté, renvoyé à la vue principale / accueil.
 * - Le mode invité est ensuite verrouillé pendant 24 heures (24 * 60 * 60 * 1000 ms).
 */

export const GUEST_SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes
export const GUEST_LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000; // 24 heures

const KEY_GUEST_FLAG = 'is_guest';
const KEY_SESSION_START = 'mount_guest_session_start';
const KEY_SESSION_EXPIRES = 'mount_guest_session_expires';
const KEY_LOCKED_UNTIL = 'mount_guest_locked_until';

/**
 * Récupère le timestamp de fin du verrouillage de 24h
 */
export function getGuestLockoutUntil(): number | null {
  try {
    const raw = localStorage.getItem(KEY_LOCKED_UNTIL);
    if (!raw) return null;
    const val = parseInt(raw, 10);
    return isNaN(val) ? null : val;
  } catch {
    return null;
  }
}

/**
 * Vérifie si le mode invité est actuellement verrouillé (période de 24h)
 */
export function isGuestLockedOut(): boolean {
  const lockedUntil = getGuestLockoutUntil();
  if (!lockedUntil) return false;
  if (Date.now() < lockedUntil) {
    return true;
  }
  // Le délai de 24h est dépassé, on nettoie
  try {
    localStorage.removeItem(KEY_LOCKED_UNTIL);
  } catch {}
  return false;
}

/**
 * Calcule le temps restant de verrouillage en millisecondes
 */
export function getGuestLockoutRemainingMs(): number {
  const lockedUntil = getGuestLockoutUntil();
  if (!lockedUntil) return 0;
  return Math.max(0, lockedUntil - Date.now());
}

/**
 * Récupère le timestamp d'expiration de la session invité (30 min)
 */
export function getGuestSessionExpires(): number | null {
  try {
    const raw = localStorage.getItem(KEY_SESSION_EXPIRES);
    if (!raw) return null;
    const val = parseInt(raw, 10);
    return isNaN(val) ? null : val;
  } catch {
    return null;
  }
}

/**
 * Calcule le temps restant sur la session invité active en ms
 */
export function getGuestSessionRemainingMs(): number {
  const expires = getGuestSessionExpires();
  if (!expires) return 0;
  return Math.max(0, expires - Date.now());
}

/**
 * Démarre une session invité de 30 minutes si le mode n'est pas verrouillé
 */
export function startGuestSession(): { success: boolean; error?: string } {
  if (isGuestLockedOut()) {
    const remainingMs = getGuestLockoutRemainingMs();
    const formatted = formatRemainingTime(remainingMs);
    return {
      success: false,
      error: `Le mode invité est verrouillé pendant 24h après une précédente session. Disponible dans ${formatted}. Connectez-vous avec Google pour un accès immédiat.`
    };
  }

  const now = Date.now();
  const expires = now + GUEST_SESSION_DURATION_MS;

  try {
    localStorage.setItem(KEY_GUEST_FLAG, 'true');
    localStorage.setItem(KEY_SESSION_START, now.toString());
    localStorage.setItem(KEY_SESSION_EXPIRES, expires.toString());
  } catch (e) {
    console.warn("Storage warning in startGuestSession:", e);
  }

  return { success: true };
}

/**
 * Déclenche l'expiration de la session invité et verrouille pour 24 heures
 */
export function expireGuestSession(): void {
  const lockoutUntil = Date.now() + GUEST_LOCKOUT_DURATION_MS;
  try {
    localStorage.setItem(KEY_LOCKED_UNTIL, lockoutUntil.toString());
    localStorage.removeItem(KEY_GUEST_FLAG);
    localStorage.removeItem(KEY_SESSION_START);
    localStorage.removeItem(KEY_SESSION_EXPIRES);
  } catch (e) {
    console.warn("Storage warning in expireGuestSession:", e);
  }
}

/**
 * Vérifie si la session invité en cours est toujours valide
 */
export function isGuestSessionActive(): boolean {
  const isGuest = localStorage.getItem(KEY_GUEST_FLAG) === 'true';
  if (!isGuest) return false;

  const remaining = getGuestSessionRemainingMs();
  if (remaining <= 0) {
    expireGuestSession();
    return false;
  }
  return true;
}

/**
 * Formate une durée en millisecondes en texte lisible (ex: "23h 45m" ou "14m 32s")
 */
export function formatRemainingTime(ms: number): string {
  if (ms <= 0) return "0s";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}
