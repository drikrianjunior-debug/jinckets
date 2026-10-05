/** Utilitaires sécurité auth (côté client — le backend restera la vraie source de vérité) */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

export function sanitizeText(input: string, maxLen = 120): string {
  return String(input || '')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen)
}

export function sanitizeEmail(input: string): string {
  return sanitizeText(input, 180).toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 180
}

/** Mot de passe : min 8, 1 maj, 1 min, 1 chiffre */
export function validatePasswordStrength(password: string): string | null {
  if (!password || password.length < 8) {
    return 'Mot de passe : au moins 8 caractères'
  }
  if (password.length > 128) {
    return 'Mot de passe trop long'
  }
  if (!/[a-z]/.test(password)) {
    return 'Mot de passe : au moins une minuscule'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Mot de passe : au moins une majuscule'
  }
  if (!/[0-9]/.test(password)) {
    return 'Mot de passe : au moins un chiffre'
  }
  return null
}

/** Hash SHA-256 (hex) — mieux que plain text en local ; pas un substitut à bcrypt serveur */
export async function hashPassword(password: string, salt = 'jinckets-v1'): Promise<string> {
  const data = new TextEncoder().encode(`${salt}::${password}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false
  // Compat : anciens comptes démo en clair
  if (!/^[a-f0-9]{64}$/i.test(storedHash)) {
    return storedHash === password
  }
  const h = await hashPassword(password)
  return h === storedHash
}

export function createSessionToken(): string {
  const arr = new Uint8Array(24)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
}

export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000 // 8 h
export const MAX_LOGIN_ATTEMPTS = 5
export const LOCKOUT_MS = 2 * 60 * 1000 // 2 min

export interface SessionPayload {
  userId: string
  token: string
  expiresAt: number
  issuedAt: number
}

export function readAttempts(): { count: number; lockedUntil: number } {
  try {
    const raw = sessionStorage.getItem('jinckets-login-attempts')
    if (!raw) return { count: 0, lockedUntil: 0 }
    return JSON.parse(raw)
  } catch {
    return { count: 0, lockedUntil: 0 }
  }
}

export function writeAttempts(count: number, lockedUntil = 0) {
  sessionStorage.setItem(
    'jinckets-login-attempts',
    JSON.stringify({ count, lockedUntil })
  )
}

export function clearAttempts() {
  sessionStorage.removeItem('jinckets-login-attempts')
}
