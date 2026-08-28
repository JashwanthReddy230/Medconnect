import { useState } from 'react'
import {
  BellIcon, CalendarIcon, UserIcon, StarIcon,
  CheckCircleIcon, TrashIcon, InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { useNotifications } from '@/context/NotificationContext'
import { formatRelative } from '@/utils/formatters'
import { EmptyState } from '@/components/common/index.jsx'
import Button from '@/components/common/Button.jsx'
import clsx from 'clsx'

const MOCK_NOTIFS = [
  { _id:'1', type:'appointment', message:'New appointment booked: Emily Clark for tomorrow at 9:00 AM.', isRead:false, createdAt:new Date(Date.now()-1800000).toISOString() },
  { _id:'2', type:'appointment', message:'Appointment cancelled by patient: Robert Lee (Thu 3:30 PM).', isRead:false, createdAt:new Date(Date.now()-3600000).toISOString() },
  { _id:'3', type:'review',      message:'You received a new 5-star review from a verified patient.', isRead:false, createdAt:new Date(Date.now()-7200000).toISOString() },
  { _id:'4', type:'patient',     message:'New patient registered and booked their first appointment with you.', isRead:true, createdAt:new Date(Date.now()-86400000).toISOString() },
  { _id:'5', type:'system',      message:'Your profile is now visible in search results. Keep it updated for more bookings.', isRead:true, createdAt:new Date(Date.now()-172800000).toISOString() },
  { _id:'6', type:'approval',    message:'Congratulations! Your doctor profile has been approved by MedConnect admin.', isRead:true, createdAt:new Date(Date.now()-604800000).toISOString() },
]

const TYPE_CONFIG = {
  appointment: { icon: CalendarIcon,          color: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' },
  review:      { icon: StarIcon,              color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'         },
  patient:     { icon: UserIcon,              color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'             },
  system:      { icon: InformationCircleIcon, color: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'            },
  approval:    { icon: CheckCircleIcon,       color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' },
}

export default function DoctorNotifications() {
  const { markAllRead } = useNotifications()
  const [notifications, setNotifications] = useState(MOCK_NOTIFS)
  const [filter, setFilter] = useState('all')

  const unread   = notifications.filter((n) => !n.isRead).length
  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications

  const handleMarkRead  = (id) => setNotifications((p) => p.map((n) => n._id === id ? { ...n, isRead: true } : n))
  const handleDelete    = (id) => setNotifications((p) => p.filter((n) => n._id !== id))
  const handleMarkAll   = () => { setNotifications((p) => p.map((n) => ({ ...n, isRead: true }))); markAllRead() }

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub">{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
        </div>
        {unread > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAll} icon={<CheckCircleIcon className="w-4 h-4" />}>
            Mark all read
          </Button>
        )}
      </div>

      <div className="flex gap-1 bg-muted-light dark:bg-muted-dark rounded-xl p-1 w-fit">
        {['all','unread'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={clsx(
              'px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',
              filter === f ? 'bg-white dark:bg-card-dark shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'
            )}
          >
            {f} {f==='unread' && unread > 0 && `(${unread})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<BellIcon className="w-8 h-8" />} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system
            const Icon = cfg.icon
            return (
              <div key={notif._id} className={clsx('card p-4 flex items-start gap-4', !notif.isRead && 'border-l-4 border-l-primary-500')}>
                <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', cfg.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={clsx('text-sm leading-relaxed', !notif.isRead ? 'font-medium text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300')}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{formatRelative(notif.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notif.isRead && (
                    <button onClick={() => handleMarkRead(notif._id)} title="Mark as read"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-muted-light dark:hover:bg-muted-dark transition-colors">
                      <CheckCircleIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(notif._id)} title="Delete"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
