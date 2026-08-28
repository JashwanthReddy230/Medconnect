import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Disclosure, Transition } from '@headlessui/react'
import {
  Bars3Icon, XMarkIcon, SunIcon, MoonIcon,
  BellIcon, UserCircleIcon, ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { useAuth }  from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useNotifications } from '@/context/NotificationContext'
import { Avatar } from '@/components/common/index.jsx'
import clsx from 'clsx'

const PUBLIC_LINKS = [
  { label: 'Doctors',   to: '/doctors'   },
  { label: 'Hospitals', to: '/hospitals' },
  { label: 'Blog',      to: '/blog'      },
  { label: 'About',     to: '/about'     },
  { label: 'Contact',   to: '/contact'   },
]

export default function Navbar() {
  const { isAuthenticated, user, logout, dashboardPath } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const [scrolled,     setScrolled]     = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <Disclosure as="nav" className={clsx(
      'fixed top-0 inset-x-0 z-40 transition-all duration-200',
      scrolled
        ? 'bg-white/95 dark:bg-card-dark/95 backdrop-blur-md shadow-sm border-b border-border-light dark:border-border-dark'
        : 'bg-white dark:bg-card-dark border-b border-border-light dark:border-border-dark'
    )}>
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">

              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
                  Med<span className="text-primary-600">Connect</span>
                </span>
              </Link>

              {/* Desktop nav links */}
              <div className="hidden md:flex items-center gap-1">
                {PUBLIC_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => clsx(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-muted-light dark:hover:bg-muted-dark'
                    )}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>

              {/* Right side */}
              <div className="flex items-center gap-2">
                {/* Dark mode toggle */}
                <button
                  onClick={toggleTheme}
                  className="btn-ghost p-2 rounded-lg"
                  aria-label="Toggle theme"
                >
                  {isDark
                    ? <SunIcon  className="w-5 h-5 text-amber-400" />
                    : <MoonIcon className="w-5 h-5 text-slate-500" />
                  }
                </button>

                {isAuthenticated ? (
                  <>
                    {/* Notifications bell */}
                    <button
                      onClick={() => navigate(`/${user?.role}/notifications`)}
                      className="relative btn-ghost p-2 rounded-lg"
                      aria-label="Notifications"
                    >
                      <BellIcon className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* User menu */}
                    <div className="relative hidden md:block">
                      <button
                        onClick={() => setUserMenuOpen((o) => !o)}
                        className="flex items-center gap-2 btn-ghost px-2 py-1.5 rounded-lg"
                      >
                        <Avatar src={user?.profilePhoto} name={user?.fullName} size="sm" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                          {user?.fullName || user?.email}
                        </span>
                        <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      {userMenuOpen && (
                        <div className="absolute right-0 mt-1 w-52 card shadow-lg py-1 z-50 animate-slide-up">
                          <div className="px-4 py-2 border-b border-border-light dark:border-border-dark">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
                            <p className="text-sm font-medium truncate">{user?.email}</p>
                          </div>
                          <Link
                            to={dashboardPath}
                            onClick={() => setUserMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-muted-light dark:hover:bg-muted-dark"
                          >
                            Dashboard
                          </Link>
                          <Link
                            to={`/${user?.role}/profile`}
                            onClick={() => setUserMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-muted-light dark:hover:bg-muted-dark"
                          >
                            Profile settings
                          </Link>
                          <div className="border-t border-border-light dark:border-border-dark mt-1 pt-1">
                            <button
                              onClick={() => { setUserMenuOpen(false); logout() }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              Sign out
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="hidden md:flex items-center gap-2">
                    <Link to="/login"    className="btn btn-secondary btn-sm">Sign in</Link>
                    <Link to="/register" className="btn btn-primary  btn-sm">Get started</Link>
                  </div>
                )}

                {/* Mobile menu button */}
                <Disclosure.Button className="md:hidden btn-ghost p-2 rounded-lg">
                  {open
                    ? <XMarkIcon  className="w-5 h-5" />
                    : <Bars3Icon  className="w-5 h-5" />
                  }
                </Disclosure.Button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <Transition
            enter="transition duration-100 ease-out" enterFrom="transform scale-95 opacity-0" enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"  leaveFrom="transform scale-100 opacity-100" leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel className="md:hidden border-t border-border-light dark:border-border-dark bg-white dark:bg-card-dark px-4 py-3 space-y-1">
              {PUBLIC_LINKS.map((link) => (
                <Disclosure.Button
                  key={link.to}
                  as={Link}
                  to={link.to}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-muted-light dark:hover:bg-muted-dark"
                >
                  {link.label}
                </Disclosure.Button>
              ))}
              {isAuthenticated ? (
                <>
                  <Disclosure.Button as={Link} to={dashboardPath} className="block px-3 py-2 rounded-lg text-sm font-medium text-primary-600 dark:text-primary-400">
                    Dashboard
                  </Disclosure.Button>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link to="/login"    className="btn btn-secondary btn-sm flex-1 justify-center">Sign in</Link>
                  <Link to="/register" className="btn btn-primary  btn-sm flex-1 justify-center">Get started</Link>
                </div>
              )}
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
}
