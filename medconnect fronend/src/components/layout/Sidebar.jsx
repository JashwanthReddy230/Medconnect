import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  HomeIcon, UserIcon, CalendarIcon, MagnifyingGlassIcon,
  BellIcon, StarIcon, ClipboardDocumentListIcon,
  BuildingOffice2Icon, UsersIcon, ShieldCheckIcon,
  DocumentTextIcon, ChatBubbleLeftRightIcon,
  ChartBarIcon, Bars3Icon, XMarkIcon,
  ClipboardDocumentCheckIcon, BeakerIcon,
  ArrowLeftOnRectangleIcon, Cog6ToothIcon, BanknotesIcon,
} from '@heroicons/react/24/outline'
import { useAuth }  from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useNotifications } from '@/context/NotificationContext'
import { Avatar } from '@/components/common/index.jsx'
import clsx from 'clsx'

const NAV_CONFIGS = {
  patient: [
    { label: 'Dashboard',          to: '/patient/dashboard',      icon: HomeIcon },
    { label: 'Find Hospitals',     to: '/patient/hospitals',      icon: BuildingOffice2Icon },
    { label: 'Find Doctors',       to: '/patient/doctors',        icon: MagnifyingGlassIcon },
    { label: 'Appointments',       to: '/patient/appointments',   icon: CalendarIcon },
    { label: 'Medical History',    to: '/patient/medical-history', icon: DocumentTextIcon },
    { label: 'Prescriptions',      to: '/patient/prescriptions',  icon: ClipboardDocumentListIcon },
    { label: 'Bills & Invoices',   to: '/patient/bills',          icon: BanknotesIcon },
    { label: 'Transactions',       to: '/patient/transactions',   icon: BanknotesIcon },
    { label: 'My Profile',         to: '/patient/profile',        icon: UserIcon },
    { label: 'Notifications',      to: '/patient/notifications',  icon: BellIcon, badge: true },
    { label: 'Settings',           to: '/patient/settings',       icon: Cog6ToothIcon },
  ],
  doctor: [
    { label: 'Dashboard',          to: '/doctor/dashboard',       icon: HomeIcon },
    { label: 'Appointments',       to: '/doctor/appointments',    icon: CalendarIcon },
    { label: 'My Schedule',        to: '/doctor/schedule',        icon: ClipboardDocumentCheckIcon },
    { label: 'Patient Directory',  to: '/doctor/patients',        icon: UsersIcon },
    { label: 'Medical Records',    to: '/doctor/records',         icon: ShieldCheckIcon },
    { label: 'New Prescription',   to: '/doctor/prescriptions/new', icon: BeakerIcon },
    { label: 'Reviews',            to: '/doctor/reviews',         icon: StarIcon },
    { label: 'My Profile',         to: '/doctor/profile',         icon: UserIcon },
    { label: 'Notifications',      to: '/doctor/notifications',   icon: BellIcon, badge: true },
    { label: 'Settings',           to: '/doctor/settings',        icon: Cog6ToothIcon },
  ],
  hospital: [
    { label: 'Dashboard',          to: '/hospital/dashboard',     icon: HomeIcon },
    { label: 'Our Doctors',        to: '/hospital/doctors',       icon: UsersIcon },
    { label: 'Patients',           to: '/hospital/patients',      icon: UsersIcon },
    { label: 'Appointments',       to: '/hospital/appointments',   icon: CalendarIcon },
    { label: 'Departments',        to: '/hospital/departments',   icon: BuildingOffice2Icon },
    { label: 'Transactions',       to: '/hospital/transactions',  icon: BanknotesIcon },
    { label: 'Hospital Reports',   to: '/hospital/reports',       icon: ChartBarIcon },
    { label: 'Record Access Audit', to: '/hospital/audit',        icon: ShieldCheckIcon },
    { label: 'Hospital Profile',   to: '/hospital/profile',       icon: UserIcon },
    { label: 'Notifications',      to: '/hospital/notifications', icon: BellIcon, badge: true },
    { label: 'Settings',           to: '/hospital/settings',      icon: Cog6ToothIcon },
  ],
  admin: [
    { label: 'Dashboard',          to: '/admin/dashboard',        icon: HomeIcon },
    { label: 'All Users',          to: '/admin/users',            icon: UsersIcon },
    { label: 'Doctor Approvals',   to: '/admin/doctors/pending',  icon: ShieldCheckIcon, badge: 'approvals' },
    { label: 'All Doctors',        to: '/admin/doctors',          icon: UserIcon },
    { label: 'All Patients',       to: '/admin/patients',         icon: UsersIcon },
    { label: 'Hospitals',          to: '/admin/hospitals',        icon: BuildingOffice2Icon },
    { label: 'Appointments',       to: '/admin/appointments',     icon: CalendarIcon },
    { label: 'Reviews',            to: '/admin/reviews',          icon: StarIcon },
    { label: 'Blog',               to: '/admin/blog',             icon: DocumentTextIcon },
    { label: 'Notifications',      to: '/admin/notifications',    icon: BellIcon },
    { label: 'Analytics',          to: '/admin/analytics',        icon: ChartBarIcon },
    { label: 'Settings',           to: '/admin/settings',         icon: Cog6ToothIcon },
  ],
}

function SidebarLink({ item, collapsed, unreadCount }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 relative group',
          isActive
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
            : 'text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-400'
        )
      }
      title={collapsed ? item.label : undefined}
    >
      <div className="relative flex-shrink-0">
        <Icon className="w-5 h-5" />
        {item.badge && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
          {item.label}
        </div>
      )}
    </NavLink>
  )
}

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { unreadCount } = useNotifications()
  const [collapsed, setCollapsed] = useState(false)

  const links = NAV_CONFIGS[user?.role] || []

  const sidebarContent = (
    <div className={clsx(
      'flex flex-col h-full transition-all duration-200',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-border-light dark:border-border-dark flex-shrink-0">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
              Med<span className="text-primary-600">Connect</span>
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="btn-ghost p-1.5 rounded-lg hidden lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <Bars3Icon className="w-5 h-5" />
            : <XMarkIcon className="w-4 h-4" />
          }
        </button>
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3">
            <Avatar src={user?.profilePhoto} name={user?.fullName} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                {user?.fullName || 'User'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 no-scrollbar">
        {links.map((item) => (
          <SidebarLink
            key={item.to}
            item={item}
            collapsed={collapsed}
            unreadCount={unreadCount}
          />
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-border-light dark:border-border-dark p-3 space-y-0.5">
        <button
          onClick={toggleTheme}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300',
            'hover:bg-muted-light dark:hover:bg-muted-dark transition-colors'
          )}
        >
          {isDark
            ? <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07-.71.71M6.34 17.66l-.71.71M17.66 17.66l.71.71M6.34 6.34l.71.71M12 5a7 7 0 1 0 0 14A7 7 0 0 0 12 5z"/></svg>
            : <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
          {!collapsed && <span>{isDark ? 'Light mode' : 'Dark mode'}</span>}
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={clsx(
        'hidden lg:flex flex-col bg-white dark:bg-card-dark border-r border-border-light dark:border-border-dark h-screen sticky top-0 flex-shrink-0 transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-card-dark border-r border-border-light dark:border-border-dark z-50 lg:hidden animate-slide-up">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
