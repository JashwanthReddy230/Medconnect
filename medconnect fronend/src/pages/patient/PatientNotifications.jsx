import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  BellIcon,
  CalendarIcon,
  StarIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  TrashIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline'

import { useNotifications } from '@/context/NotificationContext'
import { notificationService } from '@/api/services'
import { formatRelative } from '@/utils/formatters'
import { EmptyState } from '@/components/common/index.jsx'
import Button from '@/components/common/Button.jsx'
import clsx from 'clsx'

const TYPE_CONFIG = {
  BILL_READY: {
    icon: BanknotesIcon,
    color:
      'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  },

  appointment: {
    icon: CalendarIcon,
    color:
      'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
  },

  reminder: {
    icon: BellIcon,
    color:
      'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  },

  prescription: {
    icon: ShieldCheckIcon,
    color:
      'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  },

  review: {
    icon: StarIcon,
    color:
      'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  },

  system: {
    icon: InformationCircleIcon,
    color:
      'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  },
}

export default function PatientNotifications() {
  const {
    notifications,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
  } = useNotifications()

  const [filter, setFilter] = useState('all')
  const [deletingId, setDeletingId] = useState(null)
  const [localList, setLocalList] = useState([])

  const navigate = useNavigate()

  /*
   * =========================================================
   * LOAD NOTIFICATIONS
   * =========================================================
   */

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  /*
   * =========================================================
   * SYNC LOCAL NOTIFICATIONS
   * =========================================================
   */

  useEffect(() => {
    setLocalList(notifications || [])
  }, [notifications])

  /*
   * =========================================================
   * FILTER
   * =========================================================
   */

  const unread = localList.filter(
    (n) => !n.isRead
  ).length

  const filtered =
    filter === 'unread'
      ? localList.filter(
        (n) => !n.isRead
      )
      : localList

  /*
   * =========================================================
   * MARK AS READ
   * =========================================================
   */

  const handleMarkRead = async (id) => {
    try {
      await markRead(id)

      setLocalList((prev) =>
        prev.map((n) =>
          (n.id ?? n._id) === id
            ? {
              ...n,
              isRead: true,
            }
            : n
        )
      )
    } catch (error) {
      console.error(
        'Failed to mark notification as read:',
        error
      )
    }
  }

  /*
   * =========================================================
   * DELETE
   * =========================================================
   */

  const handleDelete = async (id) => {
    setDeletingId(id)

    try {
      await notificationService.delete(id)

      setLocalList((prev) =>
        prev.filter(
          (n) =>
            (n.id ?? n._id) !== id
        )
      )
    } catch (error) {
      console.error(
        'Failed to delete notification:',
        error
      )
    } finally {
      setDeletingId(null)
    }
  }

  /*
   * =========================================================
   * VIEW BILL
   *
   * BILL_READY notification
   *       ↓
   * Patient Bills
   *       ↓
   * View Bill
   *       ↓
   * Pay Now
   *       ↓
   * PaymentMode.jsx
   * =========================================================
   */

  const handleViewBill = async (notif) => {
    const notificationId =
      notif.id ?? notif._id

    if (!notif.isRead) {
      try {
        await markRead(
          notificationId
        )

        setLocalList((prev) =>
          prev.map((n) =>
            (n.id ?? n._id) ===
              notificationId
              ? {
                ...n,
                isRead: true,
              }
              : n
          )
        )
      } catch (error) {
        console.error(
          'Failed to mark bill notification as read:',
          error
        )
      }
    }

    const appointmentId =
      notif.appointmentId

    const billId =
      notif.billId

    /*
     * If the notification contains
     * a bill ID, pass it to the
     * bills page.
     */

    if (billId) {
      navigate(
        `/patient/bills?billId=${billId}${appointmentId
          ? `&appointmentId=${appointmentId}`
          : ''
        }`
      )

      return
    }

    /*
     * If only appointment ID
     * exists, pass appointment ID.
     */

    if (appointmentId) {
      navigate(
        `/patient/bills?appointmentId=${appointmentId}`
      )

      return
    }

    /*
     * Fallback
     */

    navigate('/patient/bills')
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="page-title">
            Notifications
          </h1>

          <p className="page-sub">
            {unread > 0
              ? `${unread} unread`
              : 'All caught up'}
          </p>

        </div>

        {unread > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              await markAllRead()

              setLocalList((prev) =>
                prev.map((n) => ({
                  ...n,
                  isRead: true,
                }))
              )
            }}
            icon={
              <CheckCircleIcon className="w-4 h-4" />
            }
          >
            Mark all read
          </Button>
        )}

      </div>

      {/* =====================================================
          FILTER TABS
      ===================================================== */}

      <div className="flex gap-1 bg-muted-light dark:bg-muted-dark rounded-xl p-1 w-fit">

        {['all', 'unread'].map(
          (f) => (
            <button
              key={f}
              type="button"
              onClick={() =>
                setFilter(f)
              }
              className={clsx(
                'px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',

                filter === f
                  ? 'bg-white dark:bg-card-dark shadow-sm text-primary-600 dark:text-primary-400'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              {f}

              {f === 'unread' &&
                unread > 0 &&
                ` (${unread})`}
            </button>
          )
        )}

      </div>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (

        <div className="space-y-2">

          {[...Array(3)].map(
            (_, i) => (
              <div
                key={i}
                className="h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"
              />
            )
          )}

        </div>

      ) : filtered.length === 0 ? (

        <EmptyState
          icon={
            <BellIcon className="w-8 h-8" />
          }
          title="No notifications"
          description="You're all caught up!"
        />

      ) : (

        <div className="space-y-2">

          {filtered.map(
            (notif) => {

              const id =
                notif.id ??
                notif._id

              const cfg =
                TYPE_CONFIG[
                notif.type
                ] ||
                TYPE_CONFIG.system

              const Icon =
                cfg.icon

              const isBillNotification =
                notif.type ===
                'BILL_READY' ||
                notif.type ===
                'bill' ||
                notif.type ===
                'BILL_GENERATED'

              return (
                <div
                  key={id}
                  className={clsx(
                    'card p-4 flex items-start gap-4 transition-all',

                    !notif.isRead &&
                    'border-l-4 border-l-primary-500',

                    isBillNotification &&
                    !notif.isRead &&
                    'border-l-emerald-500'
                  )}
                >

                  {/* =================================================
                      ICON
                  ================================================= */}

                  <div
                    className={clsx(
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',

                      cfg.color
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* =================================================
                      CONTENT
                  ================================================= */}

                  <div className="flex-1 min-w-0">

                    <p
                      className={clsx(
                        'text-sm leading-relaxed',

                        !notif.isRead
                          ? 'font-medium text-slate-800 dark:text-slate-100'
                          : 'text-slate-600 dark:text-slate-300'
                      )}
                    >
                      {notif.title
                        ? `${notif.title} — `
                        : ''}

                      {notif.message}
                    </p>

                    {/* =================================================
                        DATE + BILL BUTTON
                    ================================================= */}

                    <div className="flex flex-wrap items-center gap-3 mt-2">

                      <p className="text-xs text-slate-400">
                        {formatRelative(
                          notif.createdAt
                        )}
                      </p>

                      {/* BILL READY */}

                      {isBillNotification && (
                        <button
                          type="button"
                          onClick={() =>
                            handleViewBill(
                              notif
                            )
                          }
                          className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                        >
                          <BanknotesIcon className="w-3.5 h-3.5" />

                          View Bill
                        </button>
                      )}

                    </div>

                  </div>

                  {/* =================================================
                      ACTIONS
                  ================================================= */}

                  <div className="flex items-center gap-1 flex-shrink-0">

                    {/* MARK READ */}

                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={() =>
                          handleMarkRead(
                            id
                          )
                        }
                        title="Mark as read"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-muted-light dark:hover:bg-muted-dark transition-colors"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                      </button>
                    )}

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          id
                        )
                      }
                      disabled={
                        deletingId ===
                        id
                      }
                      title="Delete"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>

                  </div>

                </div>
              )
            }
          )}

        </div>
      )}

    </div>
  )
}