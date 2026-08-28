const ACCESS_KEY = 'mc_access_token'
const REFRESH_KEY = 'mc_refresh_token'
const PROFILE_KEY = 'mc_user_profile'
const BOOKING_KEY = 'mc_pending_booking'

// Role mapping: backend role names → frontend role names
const ROLE_MAP = {
  USER: 'patient',
  HOSPITAL: 'hospital',
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  // passthrough if already in frontend format
  patient: 'patient',
  hospital: 'hospital',
  admin: 'admin',
  doctor: 'doctor',
}

export const tokenManager = {
  getAccessToken: () => localStorage.getItem(ACCESS_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),

  /**
   * Accepts both shapes:
   *  - Backend:  { token, userId, name, role }
   *  - Frontend: { accessToken, refreshToken, user }
   */
  setTokens(data) {
    // Backend shape: single `token` field
    const accessToken = data.token || data.accessToken
    const refreshToken = data.refreshToken || null
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken)
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
  },

  clearTokens() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },

  // ── Profile profile storage ──────────────────────────────────────────────────
  // Persists registration / login details so profile pages can show real data
  // without a /auth/me endpoint.

  saveProfile(profileData) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData))
    } catch { /* quota exceeded — ignore */ }
  },

  loadProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  clearProfile() {
    localStorage.removeItem(PROFILE_KEY)
  },

  // ── Pending booking storage ──────────────────────────────────────────────────
  // Used when a guest tries to book an appointment: the selected doctor/date/slot
  // is saved here, the user is sent to /login, and once login succeeds the saved
  // booking is read back and the appointment is created automatically.

  savePendingBooking(bookingData) {
    try {
      localStorage.setItem(BOOKING_KEY, JSON.stringify(bookingData))
    } catch { /* quota exceeded — ignore */ }
  },

  loadPendingBooking() {
    try {
      const raw = localStorage.getItem(BOOKING_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  clearPendingBooking() {
    localStorage.removeItem(BOOKING_KEY)
  },

  // ── Auth helpers ─────────────────────────────────────────────────────────────

  isAuthenticated: () => !!localStorage.getItem(ACCESS_KEY),

  mapRole(role) {
    return ROLE_MAP[role] || role?.toLowerCase() || 'patient'
  },

  decodeToken(token) {
    try {
      const payload = token.split('.')[1]
      return JSON.parse(atob(payload))
    } catch {
      return null
    }
  },

  getUser() {
    const token = localStorage.getItem(ACCESS_KEY)
    if (!token) return null
    return this.decodeToken(token)
  },

  isExpired(token) {
    const decoded = this.decodeToken(token)
    if (!decoded?.exp) return true
    return decoded.exp * 1000 < Date.now()
  },
}