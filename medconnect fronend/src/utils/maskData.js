/**
 * Masks sensitive user data for display in the UI
 */

export const maskEmail = (email) => {
  if (!email) return ''
  const [user, domain] = email.split('@')
  if (!domain) return email
  const visible = user.slice(0, 2)
  const masked  = '*'.repeat(Math.max(user.length - 2, 3))
  return `${visible}${masked}@${domain}`
}

export const maskPhone = (phone) => {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 6) return phone
  const last4   = digits.slice(-4)
  const masked  = '*'.repeat(digits.length - 4)
  return `${masked}${last4}`
}

export const maskName = (name) => {
  if (!name) return ''
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts.slice(1).map(p => p[0] + '.').join(' ')}`
}

export const maskLicense = (license) => {
  if (!license) return ''
  return license.slice(0, 3) + '*'.repeat(license.length - 3)
}
