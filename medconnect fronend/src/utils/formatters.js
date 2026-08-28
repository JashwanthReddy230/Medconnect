import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns'

export const formatDate = (date, fmt = 'MMM d, yyyy') => {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt)
  } catch {
    return '—'
  }
}

export const formatTime = (date) => {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'h:mm a')
  } catch {
    return '—'
  }
}

export const formatDateTime = (date) => {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'MMM d, yyyy · h:mm a')
  } catch {
    return '—'
  }
}

export const formatRelative = (date) => {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return '—'
  }
}

export const formatAppointmentDate = (date) => {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (isToday(d))    return `Today, ${format(d, 'h:mm a')}`
    if (isTomorrow(d)) return `Tomorrow, ${format(d, 'h:mm a')}`
    return format(d, 'EEE, MMM d · h:mm a')
  } catch {
    return '—'
  }
}

export const formatCurrency = (amount, currency = 'INR') => {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}

export const formatNumber = (n) => {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US').format(n)
}

export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const titleCase = (str) => {
  if (!str) return ''
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}

export const truncate = (str, maxLen = 80) => {
  if (!str || str.length <= maxLen) return str
  return str.slice(0, maxLen).trimEnd() + '…'
}

export const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

export const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const appointmentStatusMap = {
  pending:   { label: 'Awaiting Acceptance', class: 'badge-warning'  },
  confirmed: { label: 'Confirmed',           class: 'badge-success'  },
  accepted:  { label: 'Confirmed',           class: 'badge-success'  },
  cancelled: { label: 'Cancelled',           class: 'badge-danger'   },
  rejected:  { label: 'Rejected',            class: 'badge-danger'   },
  completed: { label: 'Completed',           class: 'badge-info'     },
  no_show:   { label: 'No Show',             class: 'badge-neutral'  },
}

export const doctorApprovalMap = {
  pending:  { label: 'Pending Review', class: 'badge-warning' },
  approved: { label: 'Approved',       class: 'badge-success' },
  rejected: { label: 'Rejected',       class: 'badge-danger'  },
}
