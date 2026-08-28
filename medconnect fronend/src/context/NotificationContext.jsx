import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { notificationService } from '@/api/services'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const { data } = await notificationService.getUnreadCount()
      setUnreadCount(data.count)
    } catch { /* silent */ }
  }, [isAuthenticated])

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const { data } = await notificationService.getAll({ limit: 20 })
      setNotifications(data.notifications || [])
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchUnreadCount()
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30_000)
    return () => clearInterval(interval)
  }, [isAuthenticated, fetchUnreadCount])

  const markRead = useCallback(async (id) => {
    await notificationService.markRead(id)
    setNotifications((prev) =>
      prev.map((n) => ((n.id ?? n._id) === id ? { ...n, isRead: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }, [])

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => [notif, ...prev])
    setUnreadCount((c) => c + 1)
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markRead,
        markAllRead,
        addNotification,
        refresh: fetchUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}