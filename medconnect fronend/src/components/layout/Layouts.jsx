import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { Avatar } from '@/components/common/index.jsx'

// ── DashboardLayout ───────────────────────────────────────────────────────────
export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()
  const { unreadCount } = useNotifications()

  return (
    <div className="flex h-screen overflow-hidden bg-muted-light dark:bg-surface-dark">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Dashboard top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-white dark:bg-card-dark border-b border-border-light dark:border-border-dark flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="btn-ghost p-2 rounded-lg"
            aria-label="Open menu"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>

          <span className="text-base font-bold text-slate-800 dark:text-white">
            Med<span className="text-primary-600">Connect</span>
          </span>

          <div className="flex items-center gap-2">
            <div className="relative">
              <BellIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9' : unreadCount}
                </span>
              )}
            </div>
            <Avatar src={user?.profilePhoto} name={user?.fullName} size="sm" />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

// ── PublicLayout ──────────────────────────────────────────────────────────────
export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-muted-light dark:bg-surface-dark">
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-white dark:bg-card-dark border-t border-border-light dark:border-border-dark mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-base font-bold text-slate-800 dark:text-white">
                Med<span className="text-primary-600">Connect</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Connecting patients with trusted doctors and healthcare professionals.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Platform</h4>
            <ul className="space-y-2">
              {[['Find Doctors', '/doctors'], ['Hospitals', '/hospitals'], ['Blog', '/blog']].map(([label, to]) => (
                <li key={to}>
                  <a href={to} className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Company</h4>
            <ul className="space-y-2">
              {[['About Us', '/about'], ['Contact', '/contact'], ['Privacy Policy', '/privacy']].map(([label, to]) => (
                <li key={to}>
                  <a href={to} className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Join us</h4>
            <ul className="space-y-2">
              {[['For Patients', '/register/patient'], ['For Doctors', '/register/doctor'], ['For Hospitals', '/register/hospital']].map(([label, to]) => (
                <li key={to}>
                  <a href={to} className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border-light dark:border-border-dark mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} MedConnect. All rights reserved.</p>
          <p className="text-xs text-slate-400">Designed by <a href="https://jashwanthreddy230.github.io/Portfolio/" target="_blank" rel="noopener noreferrer">Jashwanth Reddy</a></p>
        </div>
      </div>
    </footer>
  )
}
