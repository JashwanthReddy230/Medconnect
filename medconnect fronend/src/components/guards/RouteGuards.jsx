import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// Set VITE_PREVIEW_MODE=true in .env.development to bypass auth for UI review
const PREVIEW_MODE = import.meta.env.VITE_PREVIEW_MODE === 'true'

// ── ProtectedRoute ────────────────────────────────────────────────────────────
// Redirects unauthenticated users to /login with returnUrl
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // Bypass auth in preview/review mode
  if (PREVIEW_MODE) return children

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted-light dark:bg-surface-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading MedConnect…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />
  }

  return children
}

// ── RoleGuard ─────────────────────────────────────────────────────────────────
// Allows access only to users whose role is in the allowed list
export function RoleGuard({ children, roles = [] }) {
  const { user, isAuthenticated, loading } = useAuth()

  // Bypass role check in preview/review mode
  if (PREVIEW_MODE) return children

  if (loading) return null

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    // Redirect to their own dashboard instead of a hard 403
    const dashboards = {
      patient:  '/patient/dashboard',
      doctor:   '/doctor/dashboard',
      hospital: '/hospital/dashboard',
      admin:    '/admin/dashboard',
    }
    return <Navigate to={dashboards[user?.role] || '/'} replace />
  }

  return children
}

// ── PublicOnlyRoute ───────────────────────────────────────────────────────────
// Prevents authenticated users from visiting /login or /register
export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) return null

  if (isAuthenticated) {
    const dashboards = {
      patient:  '/patient/dashboard',
      doctor:   '/doctor/dashboard',
      hospital: '/hospital/dashboard',
      admin:    '/admin/dashboard',
    }
    return <Navigate to={dashboards[user?.role] || '/'} replace />
  }

  return children
}
