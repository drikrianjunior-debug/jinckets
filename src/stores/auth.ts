import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserRole, OrganizerAccountStatus } from '@/types'
import {
  sanitizeText,
  sanitizeEmail,
  isValidEmail,
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
  createSessionToken,
  SESSION_DURATION_MS,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_MS,
  readAttempts,
  writeAttempts,
  clearAttempts,
  type SessionPayload
} from '@/utils/authSecurity'

function publicUser(u: User): User {
  const { password: _p, ...rest } = u
  return { ...rest }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<SessionPayload | null>(null)
  const isAuthenticated = computed(() => !!user.value && !!session.value && session.value.expiresAt > Date.now())

  const mockUsers = ref<User[]>([
    {
      id: 'admin-1',
      email: 'admin@jinckets.com',
      name: 'Admin Jin',
      phone: '+2250759128035',
      role: 'admin',
      password: 'admin123',
      createdAt: new Date().toISOString()
    },
    {
      id: 'client-1',
      email: 'client@test.com',
      name: 'Alex Vibes',
      phone: '+2250700000001',
      role: 'client',
      password: 'client123',
      organizerStatus: 'none',
      createdAt: new Date().toISOString()
    },
    {
      id: 'org-1',
      email: 'orga@test.com',
      name: 'Kouassi Events',
      phone: '+2250759128035',
      role: 'organizer',
      organizationName: 'Kouassi Events CI',
      password: 'orga123',
      organizerStatus: 'approved',
      activeMode: 'organizer',
      contractSignedAt: new Date().toISOString(),
      contractSignature: 'Kouassi Events',
      createdAt: new Date().toISOString()
    }
  ])

  function persistSession(s: SessionPayload | null) {
    if (s) sessionStorage.setItem('jinckets-session', JSON.stringify(s))
    else sessionStorage.removeItem('jinckets-session')
  }

  function persistUser(u: User | null) {
    if (u) {
      // Ne jamais stocker le hash/mot de passe dans le stockage navigateur de session UI
      localStorage.setItem('jinckets-user', JSON.stringify(publicUser(u)))
    } else {
      localStorage.removeItem('jinckets-user')
    }
  }

  function syncUserInList(u: User) {
    const idx = mockUsers.value.findIndex(x => x.id === u.id)
    if (idx !== -1) {
      const prev = mockUsers.value[idx]
      mockUsers.value[idx] = { ...u, password: u.password ?? prev.password }
    }
  }

  function startSession(userId: string) {
    const s: SessionPayload = {
      userId,
      token: createSessionToken(),
      issuedAt: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION_MS
    }
    session.value = s
    persistSession(s)
  }

  function clearSession() {
    session.value = null
    user.value = null
    persistSession(null)
    persistUser(null)
  }

  /** Vérifie verrouillage anti brute-force */
  function checkLockout(): string | null {
    const a = readAttempts()
    if (a.lockedUntil && Date.now() < a.lockedUntil) {
      const sec = Math.ceil((a.lockedUntil - Date.now()) / 1000)
      return `Trop de tentatives. Réessayez dans ${sec}s`
    }
    if (a.lockedUntil && Date.now() >= a.lockedUntil) {
      writeAttempts(0, 0)
    }
    return null
  }

  function registerFailedAttempt(): string {
    const a = readAttempts()
    const count = a.count + 1
    if (count >= MAX_LOGIN_ATTEMPTS) {
      writeAttempts(count, Date.now() + LOCKOUT_MS)
      return `Compte temporairement verrouillé (${MAX_LOGIN_ATTEMPTS} échecs). Réessayez dans 2 min`
    }
    writeAttempts(count, 0)
    return `Identifiants incorrects (${count}/${MAX_LOGIN_ATTEMPTS})`
  }

  async function login(emailRaw: string, password: string): Promise<{ ok: boolean; error?: string }> {
    const lock = checkLockout()
    if (lock) return { ok: false, error: lock }

    const email = sanitizeEmail(emailRaw)
    if (!isValidEmail(email)) {
      return { ok: false, error: 'Format d\'email invalide' }
    }
    if (!password || password.length > 128) {
      return { ok: false, error: 'Identifiants incorrects' }
    }

    // Délai constant anti-timing (démo)
    await new Promise(r => setTimeout(r, 280 + Math.random() * 120))

    const found = mockUsers.value.find(u => u.email.toLowerCase() === email)
    // Message générique : ne pas révéler si l'email existe
    if (!found || !(await verifyPassword(password, found.password || ''))) {
      return { ok: false, error: registerFailedAttempt() }
    }

    // Upgrade hash si encore en clair
    if (found.password && !/^[a-f0-9]{64}$/i.test(found.password)) {
      found.password = await hashPassword(password)
    }

    clearAttempts()
    user.value = publicUser(found)
    persistUser(user.value)
    startSession(found.id)
    return { ok: true }
  }

  async function register(
    nameRaw: string,
    emailRaw: string,
    phoneRaw: string,
    role: UserRole = 'client',
    organizationName?: string,
    password = ''
  ): Promise<{ ok: boolean; error?: string }> {
    const name = sanitizeText(nameRaw, 80)
    const email = sanitizeEmail(emailRaw)
    const phone = sanitizeText(phoneRaw, 30)
    const org = organizationName ? sanitizeText(organizationName, 100) : undefined

    if (!name || name.length < 2) return { ok: false, error: 'Nom trop court' }
    if (!isValidEmail(email)) return { ok: false, error: 'Email invalide' }
    const pwdErr = validatePasswordStrength(password)
    if (pwdErr) return { ok: false, error: pwdErr }

    if (mockUsers.value.some(u => u.email.toLowerCase() === email)) {
      return { ok: false, error: 'Impossible de créer ce compte. Essayez un autre email ou connectez-vous.' }
    }

    const hashed = await hashPassword(password)
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      phone,
      role,
      password: hashed,
      organizationName: role === 'organizer' ? org || name : undefined,
      organizerStatus: role === 'organizer' ? 'approved' : 'none',
      createdAt: new Date().toISOString()
    }
    mockUsers.value.push(newUser)
    user.value = publicUser(newUser)
    persistUser(user.value)
    startSession(newUser.id)
    return { ok: true }
  }

  function logout() {
    clearSession()
  }

  function init() {
    try {
      const rawS = sessionStorage.getItem('jinckets-session')
      if (rawS) {
        const s = JSON.parse(rawS) as SessionPayload
        if (s.expiresAt > Date.now() && s.token && s.userId) {
          session.value = s
        } else {
          persistSession(null)
        }
      }
      const saved = localStorage.getItem('jinckets-user')
      if (saved && session.value) {
        const parsed = JSON.parse(saved) as User
        // Revalider contre mockUsers (id doit matcher session)
        if (parsed.id !== session.value.userId) {
          clearSession()
          return
        }
        const fresh = mockUsers.value.find(u => u.id === parsed.id)
        user.value = fresh ? publicUser(fresh) : publicUser(parsed)
      } else if (!session.value) {
        // Ancienne session sans token → forcer re-login
        localStorage.removeItem('jinckets-user')
        user.value = null
      }
    } catch {
      clearSession()
    }
  }

  /** Ping session (à appeler périodiquement) */
  function ensureSession(): boolean {
    if (!session.value || session.value.expiresAt <= Date.now()) {
      clearSession()
      return false
    }
    return !!user.value
  }

  function homeForRole(role?: UserRole) {
    if (role === 'admin') return '/admin'
    if (user.value?.organizerStatus === 'approved' && user.value.activeMode === 'client') {
      return '/client'
    }
    if (role === 'organizer' || user.value?.organizerStatus === 'approved') return '/organizer'
    return '/client'
  }

  function switchMode(mode: 'client' | 'organizer'): string | null {
    if (!user.value) return 'Non connecté'
    if (user.value.organizerStatus !== 'approved' && mode === 'organizer') {
      return 'Compte organisateur non validé'
    }
    if (user.value.role === 'admin') return 'Non applicable'
    user.value = {
      ...user.value,
      activeMode: mode,
      role: mode === 'organizer' ? 'organizer' : (user.value.organizerStatus === 'approved' ? 'organizer' : 'client')
    }
    syncUserInList(user.value)
    persistUser(user.value)
    return null
  }

  const effectiveRole = computed(() => {
    if (!user.value) return null
    if (user.value.role === 'admin') return 'admin'
    if (user.value.organizerStatus === 'approved' && user.value.activeMode === 'client') return 'client'
    if (user.value.role === 'organizer' || user.value.organizerStatus === 'approved') return 'organizer'
    return 'client'
  })

  const canSwitchMode = computed(() =>
    !!user.value && user.value.organizerStatus === 'approved' && user.value.role !== 'admin'
  )

  function updateProfile(data: Partial<Pick<User, 'name' | 'email' | 'phone' | 'organizationName'>>): string | null {
    if (!user.value) return 'Non connecté'
    const patch: Partial<User> = {}
    if (data.name !== undefined) patch.name = sanitizeText(data.name, 80)
    if (data.phone !== undefined) patch.phone = sanitizeText(data.phone, 30)
    if (data.organizationName !== undefined) patch.organizationName = sanitizeText(data.organizationName, 100)
    if (data.email !== undefined) {
      const email = sanitizeEmail(data.email)
      if (!isValidEmail(email)) return 'Email invalide'
      const clash = mockUsers.value.find(
        u => u.email.toLowerCase() === email && u.id !== user.value!.id
      )
      if (clash) return 'Cet email est déjà utilisé'
      patch.email = email
    }
    user.value = { ...user.value, ...patch }
    syncUserInList(user.value)
    persistUser(user.value)
    return null
  }

  async function changePassword(current: string, next: string): Promise<string | null> {
    if (!user.value) return 'Non connecté'
    const full = mockUsers.value.find(u => u.id === user.value!.id)
    if (!full) return 'Utilisateur introuvable'
    if (!(await verifyPassword(current, full.password || ''))) {
      return 'Mot de passe actuel incorrect'
    }
    const pwdErr = validatePasswordStrength(next)
    if (pwdErr) return pwdErr
    full.password = await hashPassword(next)
    return null
  }

  async function resetPassword(emailRaw: string, newPassword: string): Promise<string | null> {
    const email = sanitizeEmail(emailRaw)
    if (!isValidEmail(email)) return 'Email invalide'
    const pwdErr = validatePasswordStrength(newPassword)
    if (pwdErr) return pwdErr
    const found = mockUsers.value.find(u => u.email.toLowerCase() === email)
    // Message neutre même si email inconnu
    if (!found) {
      await new Promise(r => setTimeout(r, 400))
      return null // ne révèle pas l'existence du compte
    }
    found.password = await hashPassword(newPassword)
    return null
  }

  async function applyAsOrganizer(payload: {
    name: string
    email: string
    phone: string
    organizationName: string
    password?: string
    contractSignature: string
    contractSignatureImage?: string
    idDocumentType: 'cni' | 'passeport'
    idDocumentImage: string
    idDocumentFileName?: string
  }): Promise<string | null> {
    if (!payload.contractSignature.trim()) return 'Signature du contrat requise'
    if (!payload.organizationName.trim()) return 'Nom de structure requis'
    if (!payload.idDocumentType || !['cni', 'passeport'].includes(payload.idDocumentType)) {
      return 'Pièce d\'identité requise : CNI ou passeport uniquement'
    }
    if (!payload.idDocumentImage) return 'Veuillez téléverser votre CNI ou passeport'

    if (user.value && user.value.role === 'client') {
      user.value = {
        ...user.value,
        role: 'organizer',
        organizationName: sanitizeText(payload.organizationName, 100),
        phone: sanitizeText(payload.phone, 30) || user.value.phone,
        name: sanitizeText(payload.name, 80) || user.value.name,
        organizerStatus: 'pending',
        contractSignedAt: new Date().toISOString(),
        contractSignature: sanitizeText(payload.contractSignature, 80),
        contractSignatureImage: payload.contractSignatureImage,
        idDocumentType: payload.idDocumentType,
        idDocumentImage: payload.idDocumentImage,
        idDocumentFileName: payload.idDocumentFileName,
        activeMode: 'organizer'
      }
      syncUserInList(user.value)
      persistUser(user.value)
      return null
    }

    const email = sanitizeEmail(payload.email)
    if (!isValidEmail(email)) return 'Email invalide'
    if (mockUsers.value.some(u => u.email.toLowerCase() === email)) {
      return 'Cet email est déjà utilisé — connectez-vous pour candidater'
    }
    const pwd = payload.password || ''
    const pwdErr = validatePasswordStrength(pwd)
    if (pwdErr) return pwdErr

    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name: sanitizeText(payload.name, 80),
      phone: sanitizeText(payload.phone, 30),
      role: 'organizer',
      organizationName: sanitizeText(payload.organizationName, 100),
      password: await hashPassword(pwd),
      organizerStatus: 'pending',
      contractSignedAt: new Date().toISOString(),
      contractSignature: sanitizeText(payload.contractSignature, 80),
      contractSignatureImage: payload.contractSignatureImage,
      idDocumentType: payload.idDocumentType,
      idDocumentImage: payload.idDocumentImage,
      idDocumentFileName: payload.idDocumentFileName,
      activeMode: 'organizer',
      createdAt: new Date().toISOString()
    }
    mockUsers.value.push(newUser)
    user.value = publicUser(newUser)
    persistUser(user.value)
    startSession(newUser.id)
    return null
  }

  function adminUpdateUser(userId: string, data: Partial<User>): string | null {
    const idx = mockUsers.value.findIndex(u => u.id === userId)
    if (idx === -1) return 'Utilisateur introuvable'
    if (data.email) {
      const email = sanitizeEmail(data.email)
      if (!isValidEmail(email)) return 'Email invalide'
      const clash = mockUsers.value.find(
        u => u.email.toLowerCase() === email && u.id !== userId
      )
      if (clash) return 'Email déjà utilisé'
      data.email = email
    }
    if (data.name) data.name = sanitizeText(data.name, 80)
    if (data.phone) data.phone = sanitizeText(data.phone, 30)
    // Admin ne doit pas écraser le hash avec un plain text sauf intention (reset)
    const next = { ...mockUsers.value[idx], ...data }
    mockUsers.value[idx] = next
    if (user.value?.id === userId) {
      user.value = publicUser(next)
      persistUser(user.value)
    }
    return null
  }

  function setOrganizerStatus(userId: string, status: OrganizerAccountStatus): void {
    const patch: Partial<User> = { organizerStatus: status }
    if (status === 'approved') patch.role = 'organizer'
    if (status === 'rejected') patch.role = 'client'
    adminUpdateUser(userId, patch)
  }

  const pendingOrganizers = computed(() =>
    mockUsers.value.filter(u => u.organizerStatus === 'pending')
  )

  return {
    user,
    session,
    isAuthenticated,
    mockUsers,
    pendingOrganizers,
    login,
    register,
    logout,
    init,
    ensureSession,
    homeForRole,
    switchMode,
    effectiveRole,
    canSwitchMode,
    updateProfile,
    changePassword,
    resetPassword,
    applyAsOrganizer,
    adminUpdateUser,
    setOrganizerStatus
  }
})
