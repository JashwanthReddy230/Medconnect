import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authService } from '@/api/authService'
import { patientService, hospitalService, doctorService, appointmentService } from '@/api/services'
import { tokenManager } from '@/utils/tokenManager'

const AuthContext = createContext(null)

const ROLE_DASHBOARDS = {
  patient: '/patient/dashboard',
  doctor: '/doctor/dashboard',
  hospital: '/hospital/dashboard',
  admin: '/admin/dashboard',
}

// ── Helper: build a user object from the backend login response ───────────────
// Backend LoginResponse: { userId, name, role, token }
// Merges any persisted profile data (email, mobile, phone, etc.) so profile
// pages always have real registration details available.
function buildUserFromLoginResponse(data) {
  const stored = tokenManager.loadProfile() || {}
  const decoded = data.token ? tokenManager.decodeToken(data.token) : null
  const nameParts = (data.name || '').split(' ')
  return {
    id: stored.id || data.userId,
    fullName: data.name || stored.fullName,
    firstName: stored.firstName || nameParts[0] || '',
    lastName: stored.lastName || nameParts.slice(1).join(' ') || '',
    email: stored.email || decoded?.sub || null,
    mobile: stored.mobile || stored.phone || null,
    phone: stored.phone || stored.mobile || null,
    role: tokenManager.mapRole(data.role),
    iat: decoded?.iat || null,
    ...stored,
    ...(stored._extras || {}),
  }
}

// ── Helper: restore user from stored JWT + saved profile on page reload ───────
// JWT payload: sub (email), role (uppercase). No /auth/me endpoint on backend.
function buildUserFromToken(token) {
  const decoded = tokenManager.decodeToken(token)
  if (!decoded) return null
  const stored = tokenManager.loadProfile() || {}
  const fullName = stored.fullName || decoded.name || decoded.sub || 'User'
  const nameParts = fullName.split(' ')
  return {
    id: stored.id || decoded.userId || null,
    fullName,
    firstName: stored.firstName || nameParts[0] || '',
    lastName: stored.lastName || nameParts.slice(1).join(' ') || '',
    email: stored.email || decoded.sub || null,
    mobile: stored.mobile || stored.phone || null,
    phone: stored.phone || stored.mobile || null,
    role: tokenManager.mapRole(decoded.role),
    iat: decoded.iat || null,
    ...stored,
    ...(stored._extras || {}),
  }
}

// ── Helper: map frontend register form fields → backend RegisterRequest ───────
// Frontend patient form:  { firstName, lastName, email, phone, password, ... }
// Frontend hospital form: { name, email, phone, password, ... }
// Backend RegisterRequest: { fullName, email, password, mobile, roleName }
function toBackendRegisterPayload(formData, role) {
  const roleNameMap = {
    patient: 'USER',
    doctor: 'DOCTOR',
    hospital: 'HOSPITAL',
    admin: 'ADMIN',
  }

  const fullName =
    formData.fullName ||
    (formData.firstName && formData.lastName
      ? `${formData.firstName} ${formData.lastName}`
      : formData.name || '')

  // phone / mobile — strip non-digits then take last 10
  const rawPhone = formData.phone || formData.mobile || ''
  const mobile = rawPhone.replace(/\D/g, '').slice(-10)

  return {
    fullName,
    email: formData.email,
    password: formData.password,
    mobile,
    roleName: roleNameMap[role] || 'USER',
  }
}

// ── Helper: build profile snapshot from registration form data ────────────────
// Everything except password is worth saving for profile display.
function buildProfileSnapshot(formData, role) {
  const { password, confirmPassword, ...safe } = formData  // strip credentials
  const fullName =
    safe.fullName ||
    (safe.firstName && safe.lastName
      ? `${safe.firstName} ${safe.lastName}`
      : safe.name || '')

  // Capture role-specific extras that the profile page may want to display
  const _extras = {}
  if (role === 'doctor') {
    const { specialization, licenseNumber, experience, consultationFee, bio } = safe
    Object.assign(_extras, { specialization, licenseNumber, experience, consultationFee, bio })
  }
  if (role === 'hospital') {
    const { address, city, website, about } = safe
    Object.assign(_extras, { address, city, website, about })
  }

  return { ...safe, fullName, _extras }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Restore session on mount — decode stored JWT + merge profile data
  useEffect(() => {
    const token = tokenManager.getAccessToken()
    if (!token || tokenManager.isExpired(token)) {
      tokenManager.clearTokens()
      tokenManager.clearProfile()
      setLoading(false)
      return
    }
    const restoredUser = buildUserFromToken(token)
    if (restoredUser) {
      setUser(restoredUser)
    } else {
      tokenManager.clearTokens()
      tokenManager.clearProfile()
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (credentials) => {
    const { data } = await authService.login(credentials)
    // data = { userId, name, role, token }

    // Fetch and resolve the correct profile ID from Hospital-Service
    let realProfileId = null
    const mappedRole = tokenManager.mapRole(data.role)
    try {
      if (mappedRole === 'patient') {
        const pRes = await patientService.getAll()
        const match = pRes.data.find(p => p.email?.toLowerCase() === credentials.email?.toLowerCase())
        if (match) realProfileId = match.id
      } else if (mappedRole === 'hospital') {
        const hRes = await hospitalService.getAll()
        const match = hRes.data.find(h => h.email?.toLowerCase() === credentials.email?.toLowerCase())
        if (match) realProfileId = match.id
      } else if (mappedRole === 'doctor') {
        const dRes = await doctorService.getAll()
        const match = dRes.data.find(d => d.doctorName?.toLowerCase() === data.name?.toLowerCase())
        if (match) realProfileId = match.id
      }
    } catch (err) {
      console.error('Failed to look up profile ID from Hospital-Service:', err)
    }

    const existingProfile = tokenManager.loadProfile() || {}
    tokenManager.saveProfile({
      ...existingProfile,
      email: credentials.email,
      id: realProfileId || existingProfile.id || data.userId
    })
    tokenManager.setTokens(data)
    const userObj = buildUserFromLoginResponse(data)
    setUser(userObj)

    // ── Resume a booking that was started before the user was logged in ────────
    // DoctorPublicProfile saves the selected doctor/date/slot to storage and
    // redirects here when a guest clicks "Book now". Once login succeeds we
    // read it back and create the appointment automatically.
    const pendingBooking = tokenManager.loadPendingBooking()
    if (pendingBooking && userObj.role === 'patient') {
      tokenManager.clearPendingBooking()
      try {
        await appointmentService.book(pendingBooking)
        toast.success(`Welcome back, ${userObj.fullName?.split(' ')[0] || 'there'}! Your appointment is booked and waiting for the doctor to confirm.`)
        navigate('/patient/appointments')
        return
      } catch (err) {
        console.error('Failed to auto-create saved booking after login:', err)
        toast.error(err?.response?.data?.message || 'We could not complete your saved booking. Please try booking again.')
        navigate(pendingBooking.doctorId ? `/doctors/${pendingBooking.doctorId}` : (ROLE_DASHBOARDS[userObj.role] || '/'))
        return
      }
    }

    toast.success(`Welcome back, ${userObj.fullName?.split(' ')[0] || 'there'}!`)
    navigate(ROLE_DASHBOARDS[userObj.role] || '/')
  }, [navigate])

  const register = useCallback(async (formData, role = 'patient') => {
    const payload = toBackendRegisterPayload(formData, role)
    // 1. Register credentials in auth-service
    await authService.register(payload)

    // 2. Create the profile entity in Hospital-Service
    let profileId = null
    try {
      if (role === 'patient') {
        const patientPayload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          gender: formData.gender || 'male',
          dateOfBirth: formData.dateOfBirth,
          bloodGroup: formData.bloodGroup || 'O+',
          mobile: payload.mobile,
          email: formData.email,
          address: formData.address || 'Not Provided',
          emergencyContact: formData.emergencyContact
            ? (typeof formData.emergencyContact === 'object'
              ? `${formData.emergencyContact.name} (${formData.emergencyContact.relation}) - ${formData.emergencyContact.phone}`
              : formData.emergencyContact)
            : 'Not Provided'
        }
        const pRes = await patientService.create(patientPayload)
        profileId = pRes.data.id
      } else if (role === 'hospital') {
        const hospitalPayload = {
          hospitalName: formData.name,
          email: formData.email,
          phone: payload.mobile,
          address: formData.address,
          city: formData.city,
          state: formData.state || 'Not Specified',
          pincode: formData.zip || '000000',
          registrationNumber: formData.registrationNumber || 'REG-' + Math.floor(Math.random() * 90000 + 10000)
        }
        const hRes = await hospitalService.create(hospitalPayload)
        profileId = hRes.data.id
      } else if (role === 'doctor') {
        const doctorPayload = {
          doctorName: `${formData.firstName} ${formData.lastName}`,
          specialization: formData.specialization,
          qualification: formData.qualification || 'MBBS',
          experience: parseInt(formData.experience, 10) || 1,
          consultationFee: parseFloat(formData.consultationFee) || 0.0,
          email: formData.email,
          mobile: payload.mobile,
          hospitalId: parseInt(formData.hospitalId, 10) || 1
        }
        const dRes = await doctorService.create(doctorPayload)
        profileId = dRes.data.id
      }
    } catch (err) {
      console.error('Failed to auto-create profile in Hospital-Service:', err)
    }

    // Save registration details to localStorage
    const snapshot = buildProfileSnapshot(formData, role)
    if (profileId) snapshot.id = profileId
    tokenManager.saveProfile(snapshot)

    toast.success('Account created! Please sign in to continue.')
    navigate('/login?registered=true')
  }, [navigate])

  // Client-side logout — backend has no logout/invalidation endpoint
  const logout = useCallback(() => {
    tokenManager.clearTokens()
    tokenManager.clearProfile()
    setUser(null)
    toast.success('Signed out successfully.')
    navigate('/login')
  }, [navigate])

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates }
      // Keep stored profile in sync so reloads show updated data
      tokenManager.saveProfile(next)
      return next
    })
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    role: user?.role,
    isAdmin: user?.role === 'admin',
    isDoctor: user?.role === 'doctor',
    isPatient: user?.role === 'patient',
    isHospital: user?.role === 'hospital',
    login,
    register,
    logout,
    updateUser,
    dashboardPath: ROLE_DASHBOARDS[user?.role] || '/',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}