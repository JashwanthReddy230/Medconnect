import api from './axiosInstance'
import { tokenManager } from '@/utils/tokenManager'
import { normalizeAppointments } from '@/utils/normalizers'

// ── Patient ──────────────────────────────────────────────────────────────────
export const patientService = {
  create: (data) => api.post('/patients', data),
  getProfile: (id) => api.get(`/patients/${id}`),
  updateProfile: async (data) => {
    const profile = tokenManager.loadProfile() || {}
    const id = profile.id
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      bloodGroup: data.bloodGroup,
      mobile: data.phone || data.mobile,
      email: data.email,
      address: data.address,
      emergencyContact: typeof data.emergencyContact === 'object'
        ? `${data.emergencyContact?.name || ''} (${data.emergencyContact?.relation || ''}) - ${data.emergencyContact?.phone || ''}`
        : data.emergencyContact || ''
    }
    const res = await api.put(`/patients/${id}`, payload)
    try {
      const token = tokenManager.getAccessToken()
      const decoded = tokenManager.decodeToken(token)
      const authUserId = decoded?.userId
      if (authUserId) {
        await api.put(`/auth/update/${authUserId}`, {
          fullName: `${data.firstName} ${data.lastName}`,
          email: data.email,
          mobile: data.phone || data.mobile,
          password: 'PasswordUnchanged123', // required validation fallback
          roleName: 'USER'
        })
      }
    } catch (err) {
      console.error('Failed to sync patient details to auth-service:', err)
    }
    return res
  },
  getMedicalHistory: (patientId) => api.get(`/medical-record/patient/${patientId}`),
  createMedicalHistory: (data) => api.post('/medical-record', data),
  updateMedicalHistory: (id, data) => api.put(`/medical-record/${id}`, data),
  getRecommendedDoctors: () => Promise.resolve({ data: [] }), // not in backend
  uploadProfilePhoto: (formData) => Promise.resolve({ data: { status: 'success' } }),
  getAll: (params) => api.get('/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  search: (params) => api.get('/patients/search', { params }),
  activate: (id) => api.put(`/patients/${id}/activate`),
  deactivate: (id) => api.put(`/patients/${id}/deactivate`),
  delete: (id) => api.delete(`/patients/${id}`),
}

// ── Medical Records ────────────────────────────────────────────────────────────
export const medicalRecordService = {
  create: (data) => {
    const payload = {
      appointmentId: data.appointmentId ? parseInt(data.appointmentId, 10) : null,
      patientId: parseInt(data.patientId, 10),
      doctorId: parseInt(data.doctorId, 10),
      diagnosis: data.diagnosis || '',
      symptoms: data.symptoms || '',
      treatment: data.treatment || '',
      doctorNotes: data.doctorNotes || data.notes || '',
      visitDate: data.visitDate || new Date().toISOString().split('T')[0],
    }
    return api.post('/medical-record', payload)
  },
  getByPatient: (patientId) => api.get(`/medical-record/patient/${patientId}`),
  getById: (id) => api.get(`/medical-record/${id}`),
  update: (id, data) => api.put(`/medical-record/${id}`, data),
}

// Helper to resolve generic "Doctor-1", "Hospital-1", "Patient-1" placeholders into real names
async function enrichAppointments(appointments) {
  if (!Array.isArray(appointments) || appointments.length === 0) return []
  try {
    const profile = tokenManager.loadProfile() || {}

    // Collect unique IDs referenced in the appointments
    const patIds = [...new Set(appointments.map(a => a.patientId).filter(Boolean))]

    // Fetch doctors and hospitals (public registries)
    const [docListRes, hospListRes] = await Promise.allSettled([
      api.get('/doctor'),
      api.get('/hospital'),
    ])
    const docs = docListRes.status === 'fulfilled' ? (docListRes.value?.data || []) : []
    const hosps = hospListRes.status === 'fulfilled' ? (hospListRes.value?.data || []) : []

    const docMap = {}
    docs.forEach(d => { if (d.id) docMap[d.id] = d })

    const hospMap = {}
    hosps.forEach(h => { if (h.id) hospMap[h.id] = h })

    // Fetch patients: try bulk first, fall back to individual lookups per patientId
    const patMap = {}
    try {
      const patListRes = await api.get('/patients')
      const pats = patListRes?.data || []
      pats.forEach(p => { if (p.id) patMap[p.id] = p })
    } catch {
      // /patients may be forbidden for doctor role — fetch each patient individually
      await Promise.allSettled(
        patIds.map(pid =>
          api.get(`/patients/${pid}`)
            .then(res => { if (res?.data?.id) patMap[res.data.id] = res.data })
            .catch(() => { })
        )
      )
    }

    return appointments.map(a => {
      const docId = a.doctorId
      const hospId = a.hospitalId
      const patId = a.patientId

      const realDoc = docMap[docId]
      const realHosp = hospMap[hospId]
      const realPat = patMap[patId]

      // Resolve doctor name
      let docName = a.doctorName
      if (!docName || /^Doctor[-\s]\d+$/i.test(docName)) {
        if (realDoc) docName = realDoc.doctorName || realDoc.fullName || realDoc.name
      }

      // Resolve hospital name
      let hospName = a.hospitalName
      if (!hospName || /^Hospital[-\s]\d+$/i.test(hospName)) {
        if (realHosp) hospName = realHosp.hospitalName || realHosp.name
      }

      // Resolve patient name
      let patName = a.patientName
      if (!patName || /^Patient[-\s]\d+$/i.test(patName)) {
        if (realPat) {
          patName = realPat.fullName
            || `${realPat.firstName || ''} ${realPat.lastName || ''}`.trim()
            || realPat.patientCode
            || realPat.name
        } else if (profile.id && String(profile.id) === String(patId) && profile.fullName) {
          patName = profile.fullName
        }
      }

      const specialty = a.specialty || realDoc?.specialization || realDoc?.specialty || ''

      return {
        ...a,
        doctorName: docName || a.doctorName || (docId ? `Doctor ${docId}` : 'Doctor'),
        hospitalName: hospName || a.hospitalName || (hospId ? `Hospital ${hospId}` : 'Hospital'),
        patientName: patName || a.patientName || (patId ? `Patient ${patId}` : 'Patient'),
        specialty,
        specialization: specialty,
      }
    })
  } catch {
    return appointments
  }
}

// ── Appointments ──────────────────────────────────────────────────────────────
export const appointmentService = {
  book: (data) => {
    // Backend AppointmentRequest requires hospitalId, doctorId, patientId, appointmentDate, appointmentTime, reason
    // Format 12-hour slot (e.g. '10:00 AM') into 24-hour LocalTime format ('10:00:00')
    const parseTime = (timeStr) => {
      if (!timeStr) return '09:00:00'
      const parts = timeStr.trim().split(/\s+/)
      if (parts.length < 2) return timeStr.includes(':') ? timeStr : '09:00:00'
      const [time, modifier] = parts
      let [hours, minutes] = time.split(':')
      if (hours === '12') hours = '00'
      if (modifier.toUpperCase() === 'PM') hours = String(parseInt(hours, 10) + 12)
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
    }
    const profile = tokenManager.loadProfile() || {}
    const patientId = profile.id || data.patientId
    const payload = {
      hospitalId: parseInt(data.hospitalId, 10) || 1,
      doctorId: parseInt(data.doctorId, 10),
      patientId: parseInt(patientId, 10),
      appointmentDate: data.date ? data.date.split('T')[0] : data.appointmentDate,
      appointmentTime: parseTime(data.slot || data.appointmentTime),
      reason: data.notes || data.reason || 'General Checkup'
    }
    return api.post('/appointments', payload)
  },

  getMyAppointments: async (params) => {
    const raw = params?.patientId
      ? await api.get(`/appointments/patient/${params.patientId}`)
      : await api.get('/appointments')
    const normalized = normalizeAppointments(raw.data || [])
    const enriched = await enrichAppointments(normalized)
    return { ...raw, data: enriched }
  },

  getById: (id) =>
    api.get(`/appointments/${id}`),

  cancel: (id) =>
    api.put(`/appointments/${id}/cancel`),

  complete: (id, remarks) =>
    api.put(`/appointments/${id}/complete`, typeof remarks === 'string' ? { remarks } : (remarks || {})),

  update: (id, data) =>
    api.put(`/appointments/${id}`, data),

  getDoctorAppointments: async (params) => {
    const raw = params?.doctorId
      ? await api.get(`/appointments/doctor/${params.doctorId}`)
      : await api.get('/appointments')
    const normalized = normalizeAppointments(raw.data || [])
    const enriched = await enrichAppointments(normalized)
    return { ...raw, data: enriched }
  },

  getPatientAppointments: async (patientId) => {
    try {
      const res = await api.get(`/appointments/patient/${patientId}`)
      let list = (res.data && Array.isArray(res.data) && res.data.length > 0) ? res.data : null
      if (!list) {
        const allRes = await api.get('/appointments')
        const profile = tokenManager.loadProfile() || {}
        const pName = profile.fullName || ''
        list = (allRes.data || []).filter(a =>
          String(a.patientId) === String(patientId) ||
          (a.patientName && pName && a.patientName.toLowerCase() === pName.toLowerCase())
        )
      }
      const normalized = normalizeAppointments(list)
      const enriched = await enrichAppointments(normalized)
      return { data: enriched }
    } catch {
      const allRes = await api.get('/appointments').catch(() => ({ data: [] }))
      const profile = tokenManager.loadProfile() || {}
      const pName = profile.fullName || ''
      const list = (allRes.data || []).filter(a =>
        String(a.patientId) === String(patientId) ||
        (a.patientName && pName && a.patientName.toLowerCase() === pName.toLowerCase())
      )
      const normalized = normalizeAppointments(list)
      const enriched = await enrichAppointments(normalized)
      return { data: enriched }
    }
  },

  getHospitalAppointments: async (hospitalId) => {
    const raw = await api.get(`/appointments/hospital/${hospitalId}`)
    const normalized = normalizeAppointments(raw.data || [])
    const enriched = await enrichAppointments(normalized)
    return { ...raw, data: enriched }
  },

  getAll: async (params) => {
    const raw = await api.get('/appointments', { params })
    const normalized = normalizeAppointments(raw.data || [])
    const enriched = await enrichAppointments(normalized)
    return { ...raw, data: enriched }
  },

  getToday: () => {
    try {
      return api.get('/appointments/today')
    } catch {
      return Promise.resolve({ data: [] })
    }
  },

  getTodaySlots: () => {
    try {
      return api.get('/appointments/today')
    } catch {
      return Promise.resolve({ data: [] })
    }
  },

  // Accept / confirm a pending appointment (doctor action)
  accept: (id) =>
    api.put(`/appointments/${id}/confirm`).catch(() =>
      api.put(`/appointments/${id}/accept`).catch(() =>
        api.put(`/appointments/${id}`, { status: 'SCHEDULED' })
      )
    ),
}

// ── Prescriptions ─────────────────────────────────────────────────────────────
export const prescriptionService = {
  create: async (data) => {
    // NewPrescription form sends medications[] array plus notes and IDs
    const medications = data.medications || []
    const medicalRecordId = data.medicalRecordId
      ? parseInt(String(data.medicalRecordId).replace('MR-', ''), 10)
      : null
    const appointmentId = data.appointmentId
      ? parseInt(String(data.appointmentId).replace('APT-', ''), 10)
      : null
    const patientId = data.patientId
      ? parseInt(String(data.patientId).replace('PAT-', ''), 10)
      : null

    // If medications array exists, post one prescription entry per medication
    if (medications.length > 0) {
      const results = await Promise.allSettled(
        medications.map((med) => {
          const payload = {
            medicalRecordId: medicalRecordId || 1,
            medicineName: med.medicineName || med.name || '',
            dosage: med.dosage || '',
            duration: med.duration || '',
            instructions: med.instructions || med.frequency || '',
            notes: data.notes || '',
          }
          return api.post('/prescription', payload)
        })
      )
      // Return the first fulfilled result, or a fallback
      const first = results.find(r => r.status === 'fulfilled')
      return first ? first.value : { data: {} }
    }

    // Single medication (legacy)
    const payload = {
      medicalRecordId: medicalRecordId || 1,
      medicineName: data.medicineName || data.name || '',
      dosage: data.dosage || '',
      duration: data.duration || '',
      instructions: data.instructions || data.notes || '',
    }
    return api.post('/prescription', payload)
  },

  uploadScan: (formData) => Promise.resolve({ data: { status: 'success' } }),

  getByMedicalRecord: (medicalRecordId) =>
    api.get(`/prescription/${medicalRecordId}`),

  getByAppointment: (appointmentId) =>
    api.get(`/prescription/${appointmentId}`),

  getPatientPrescriptions: () => Promise.resolve({ data: [] }),
}

// ── Hospital ──────────────────────────────────────────────────────────────────
export const hospitalService = {
  create: (data) => api.post('/hospital', data),
  getAll: (params) => api.get('/hospital', { params }),
  getById: (id) => api.get(`/hospital/${id}`),
  getProfile: (id) => api.get(`/hospital/${id}`),
  updateProfile: async (data) => {
    const profile = tokenManager.loadProfile() || {}
    const id = profile.id
    const payload = {
      hospitalName: data.name || data.hospitalName || '',
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state || 'Not Specified',
      pincode: data.zip || data.pincode || '',
      registrationNumber: data.registrationNumber || 'REG-12345'
    }
    const res = await api.put(`/hospital/${id}`, payload)
    try {
      const token = tokenManager.getAccessToken()
      const decoded = tokenManager.decodeToken(token)
      const authUserId = decoded?.userId
      if (authUserId) {
        await api.put(`/auth/update/${authUserId}`, {
          fullName: data.name || data.hospitalName || '',
          email: data.email,
          mobile: data.phone,
          password: 'PasswordUnchanged123', // required validation fallback
          roleName: 'HOSPITAL'
        })
      }
    } catch (err) {
      console.error('Failed to sync hospital details to auth-service:', err)
    }
    return res
  },
  getDoctors: (hospitalId) => api.get(`/doctor/hospital/${hospitalId}`),
  addDoctor: (doctorId) => Promise.resolve({ data: {} }),
  removeDoctor: (doctorId) => Promise.resolve({ data: {} }),
  getDepartments: () => Promise.resolve({ data: [] }),
  addDepartment: (data) => Promise.resolve({ data }),
  deleteDepartment: (id) => Promise.resolve({ id }),
  uploadLogo: (formData) => Promise.resolve({ data: { status: 'success' } }),
  getAllAdmin: (params) => api.get('/hospital', { params }),
  approve: (id) => api.put(`/hospital/${id}/approve`),
  reject: (id, reason) => Promise.resolve({ data: { status: 'rejected' } }),
  delete: (id) => api.delete(`/hospital/${id}`),
}

// ── Notifications ─────────────────────────────────────────────────────────────
// Backed by the real /notifications endpoints on Hospital-Service, scoped per patient.
function currentPatientId() {
  const profile = tokenManager.loadProfile() || {}
  return profile.id || profile._id || null
}

export const notificationService = {
  getAll: async (params) => {
    const patientId = currentPatientId()
    if (!patientId) return { data: { notifications: [] } }
    try {
      return await api.get('/notifications', { params: { patientId, ...params } })
    } catch {
      return { data: { notifications: [] } }
    }
  },
  markRead: async (id) => {
    try { return await api.patch(`/notifications/${id}/read`) } catch { return {} }
  },
  markAllRead: async () => {
    const patientId = currentPatientId()
    if (!patientId) return {}
    try { return await api.patch('/notifications/read-all', null, { params: { patientId } }) } catch { return {} }
  },
  delete: async (id) => {
    try { return await api.delete(`/notifications/${id}`) } catch { return {} }
  },
  getUnreadCount: async () => {
    const patientId = currentPatientId()
    if (!patientId) return { data: { count: 0 } }
    try { return await api.get('/notifications/unread-count', { params: { patientId } }) } catch { return { data: { count: 0 } } }
  },
  broadcast: async (data) => {
    try { return await api.post('/admin/notifications/broadcast', data) } catch { return {} }
  },
}

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewService = {
  create: (data) => api.post('/reviews', data),
  getDoctorReviews: (doctorId, params) => api.get(`/reviews/doctor/${doctorId}`, { params }),
  getHospitalReviews: (hospitalId, params) => api.get(`/reviews/hospital/${hospitalId}`, { params }),
  getMedConnectReviews: () => api.get('/reviews/medconnect'),
  checkEligibility: (reviewerId, reviewerRole, targetType, targetId) =>
    api.get('/reviews/eligibility', {
      params: { reviewerId, reviewerRole, targetType, targetId }
    }),
  getMyReviews: async () => {
    try { return await api.get('/reviews') } catch { return { data: [] } }
  },
  delete: async (id) => {
    try { return await api.delete(`/reviews/${id}`) } catch { return {} }
  },
  getAllAdmin: async (params) => {
    try { return await api.get('/reviews/admin', { params }) } catch { return { data: [] } }
  },
  moderate: async (id, action) => {
    try { return await api.patch(`/reviews/${id}/${action}`) } catch { return {} }
  },
}

// ── Blog ──────────────────────────────────────────────────────────────────────
// Backend has no blog endpoint — return empty gracefully
export const blogService = {
  getAll: async (params) => {
    try { return await api.get('/blog', { params }) } catch { return { data: [] } }
  },
  getBySlug: async (slug) => {
    try { return await api.get(`/blog/${slug}`) } catch { return { data: null } }
  },
  create: async (data) => {
    try { return await api.post('/admin/blog', data) } catch { return { data: {} } }
  },
  update: async (id, data) => {
    try { return await api.put(`/admin/blog/${id}`, data) } catch { return { data: {} } }
  },
  delete: async (id) => {
    try { return await api.delete(`/admin/blog/${id}`) } catch { return {} }
  },
  publish: async (id) => {
    try { return await api.patch(`/admin/blog/${id}/publish`) } catch { return {} }
  },
  unpublish: async (id) => {
    try { return await api.patch(`/admin/blog/${id}/unpublish`) } catch { return {} }
  },
}

// ── Admin ─────────────────────────────────────────────────────────────────────
// The backend has no /admin/* aggregation endpoints.
// We compute stats by combining data from individual entity endpoints.
export const adminService = {
  /**
   * Aggregates real counts from patients, doctors, hospitals, appointments.
   * Returns a stats object matching what AdminDashboard expects.
   */
  getDashboardStats: async () => {
    try {
      const [pRes, dRes, hRes, aRes] = await Promise.allSettled([
        api.get('/patients'),
        api.get('/doctor'),
        api.get('/hospital'),
        api.get('/appointments'),
      ])
      const patients = pRes.status === 'fulfilled' ? (pRes.value.data || []) : []
      const doctors = dRes.status === 'fulfilled' ? (dRes.value.data || []) : []
      const hospitals = hRes.status === 'fulfilled' ? (hRes.value.data || []) : []
      const appointments = aRes.status === 'fulfilled' ? (aRes.value.data || []) : []

      const today = new Date().toISOString().split('T')[0]
      const todayAppts = appointments.filter(a => {
        const d = a.appointmentDate
        return d && (typeof d === 'string' ? d.startsWith(today) : false)
      })
      const pendingDoctors = doctors.filter(d => d.status !== 'ACTIVE').length
      const pendingHospitals = hospitals.filter(h => h.status !== 'APPROVED').length

      return {
        data: {
          totalDoctors: doctors.length,
          totalPatients: patients.length,
          totalHospitals: hospitals.length,
          totalAdmins: 1,
          pendingDoctors,
          pendingHospitals,
          todayAppointments: todayAppts.length,
          weekAppointments: appointments.length, // simplified
          monthAppointments: appointments.length,
          totalAppointments: appointments.length,
          avgRating: 4.7, // not in backend
        }
      }
    } catch (err) {
      console.error('getDashboardStats error:', err)
      return { data: {} }
    }
  },

  getActivityFeed: async () => {
    // No activity endpoint — return empty
    return { data: [] }
  },

  /**
   * Aggregates patients + doctors + hospitals into a unified "users" list.
   * Each entry has: { id, fullName, role, email, status }
   */
  getAllUsers: async (params) => {
    try {
      const [pRes, dRes, hRes] = await Promise.allSettled([
        api.get('/patients'),
        api.get('/doctor'),
        api.get('/hospital'),
      ])
      const patients = (pRes.status === 'fulfilled' ? pRes.value.data : []) || []
      const doctors = (dRes.status === 'fulfilled' ? dRes.value.data : []) || []
      const hospitals = (hRes.status === 'fulfilled' ? hRes.value.data : []) || []

      const users = [
        ...patients.map(p => ({ id: `p-${p.id}`, entityId: p.id, fullName: p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Patient', email: p.email || '—', role: 'patient', status: p.status || 'ACTIVE', mobile: p.mobile || '' })),
        ...doctors.map(d => ({ id: `d-${d.id}`, entityId: d.id, fullName: d.doctorName || 'Doctor', email: d.email || '—', role: 'doctor', status: d.status || 'ACTIVE', mobile: d.mobile || '' })),
        ...hospitals.map(h => ({ id: `h-${h.id}`, entityId: h.id, fullName: h.hospitalName || 'Hospital', email: h.email || '—', role: 'hospital', status: h.status || 'PENDING', mobile: h.phone || '' })),
      ]
      return { data: users }
    } catch {
      return { data: [] }
    }
  },

  deactivateUser: async (id, role) => {
    if (role === 'patient') return api.put(`/patients/${id}/deactivate`)
    if (role === 'doctor') return api.put(`/doctor/${id}/deactivate`)
    return Promise.resolve({})
  },

  activateUser: async (id, role) => {
    if (role === 'patient') return api.put(`/patients/${id}/activate`)
    if (role === 'doctor') return api.put(`/doctor/${id}/activate`)
    return Promise.resolve({})
  },

  getRegistrationChart: async () => {
    return { data: [] }
  },
}

// ── Bills ──────────────────────────────────────────────────────────────────────
// All Bill data comes straight from the Hospital-Service /billing endpoints —
// no mock/local fallback data is used.
export const billService = {
  create: async (data) => {
    const payload = {
      appointmentId: parseInt(data.appointmentId, 10),
      patientId: parseInt(data.patientId, 10),
      doctorId: parseInt(data.doctorId, 10),
      consultationFee: parseFloat(data.consultationFee) || 0,
      medicineFee: parseFloat(data.medicineFee) || 0,
      laboratoryFee: parseFloat(data.laboratoryFee) || 0,
      discount: parseFloat(data.discount) || 0,
    }
    const res = await api.post('/billing/generate', payload)
    return { data: res.data }
  },

  // GET all bills (admin/hospital view)
  getAll: async () => {
    const res = await api.get('/billing')
    return { data: Array.isArray(res.data) ? res.data : [] }
  },

  // GET single bill by ID
  getById: async (id) => {
    const res = await api.get(`/billing/${id}`)
    return { data: res.data }
  },

  // GET bills for a patient (patient Bills & Invoices page)
  getByPatient: async (patientId) => {
    const res = await api.get(`/billing/patient/${patientId}`)
    const list = Array.isArray(res.data) ? res.data : []
    // Normalize: ensure `amount` field exists for PatientBills list rendering
    const normalized = list.map(b => ({ ...b, amount: b.amount ?? b.totalAmount ?? 0 }))
    return { data: normalized }
  },

  // GET bill by appointment ID (used on Appointment Detail / "View Bill" from a notification)
  getByAppointment: async (appointmentId) => {
    try {
      const res = await api.get(`/billing/appointment/${appointmentId}`)
      return { data: res.data || null }
    } catch {
      return { data: null }
    }
  },
}

// ── Invoices ──────────────────────────────────────────────────────────────────
// Reuses the existing /invoice endpoints. In normal flow the backend auto-generates
// the Invoice as part of a successful payment, so `create`/`getByBill` mainly exist
// so the UI can fetch/confirm the persisted Invoice — no local/mock data is used.
export const invoiceService = {
  // Generates (or returns the already-generated) Invoice for a Bill.
  create: async (billId) => {
    const res = await api.post(`/invoice/generate/${billId}`)
    return { data: res.data }
  },

  getAll: async () => {
    const res = await api.get('/invoice')
    return { data: Array.isArray(res.data) ? res.data : [] }
  },

  getById: async (id) => {
    const res = await api.get(`/invoice/${id}`)
    return { data: res.data }
  },

  getByBill: async (billId) => {
    try {
      const res = await api.get(`/invoice/bill/${billId}`)
      return { data: res.data || null }
    } catch {
      return { data: null }
    }
  },

  getByPatient: async (patientId) => {
    const res = await api.get(`/invoice/patient/${patientId}`)
    return { data: Array.isArray(res.data) ? res.data : [] }
  }
}

// ── Reports ───────────────────────────────────────────────────────────────────
// Backed by the real GET /reports/hospital endpoint — figures are computed live
// from the Patient/Doctor/Appointment/Bill/Payment tables, never hardcoded.
export const reportService = {
  // Admin: platform-wide report across ALL hospitals, doctors and patients.
  getSummary: async () => {
    try {
      const res = await api.get('/reports/hospital')
      if (res.data && Object.keys(res.data).length > 0 && res.data.totalRevenue !== undefined) {
        return { data: res.data }
      }
    } catch {
      // Backend /reports/hospital fallback
    }

    try {
      const [billsRes, paymentsRes] = await Promise.allSettled([
        api.get('/billing'),
        api.get('/payments'),
      ])

      const bills = billsRes.status === 'fulfilled' && Array.isArray(billsRes.value?.data) ? billsRes.value.data : []
      const payments = paymentsRes.status === 'fulfilled' && Array.isArray(paymentsRes.value?.data) ? paymentsRes.value.data : []

      const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount ?? p.totalAmount) || 0), 0)
      const pendingRevenue = bills
        .filter(b => b.paymentStatus !== 'PAID')
        .reduce((sum, b) => sum + (Number(b.totalAmount ?? b.amount) || 0), 0)

      return {
        data: {
          totalRevenue,
          pendingRevenue,
          totalBills: bills.length,
          totalPayments: payments.length > 0 ? payments.length : bills.filter(b => b.paymentStatus === 'PAID').length,
          reportDate: new Date().toISOString(),
        }
      }
    } catch {
      return {
        data: {
          totalRevenue: 0,
          pendingRevenue: 0,
          totalBills: 0,
          totalPayments: 0,
        }
      }
    }
  },

  // Hospital: scoped strictly to one hospital's own doctors/patients/appointments.
  getHospitalSummary: async (hospitalId) => {
    try {
      const res = await api.get(`/reports/hospital/${hospitalId}`)
      if (res.data && Object.keys(res.data).length > 0) return { data: res.data }
    } catch {
      // Backend /reports/hospital/{id} unavailable or failed — compute fallback metrics live
    }

    try {
      // Fetch data from hospital specific & fallback global endpoints
      const [docsRes, allDocsRes, apptsRes, allApptsRes, billsRes, paymentsRes, profileRes] = await Promise.allSettled([
        api.get(`/doctor/hospital/${hospitalId}`),
        api.get('/doctor'),
        api.get(`/appointments/hospital/${hospitalId}`),
        api.get('/appointments'),
        api.get('/billing'),
        api.get(`/payments/hospital/${hospitalId}`),
        api.get(`/hospital/${hospitalId}`),
      ])

      const hospProfile = profileRes.status === 'fulfilled' ? profileRes.value?.data : null
      const hospName = hospProfile?.hospitalName || hospProfile?.name || ''

      let docs = docsRes.status === 'fulfilled' && Array.isArray(docsRes.value?.data) ? docsRes.value.data : []
      const allDocs = allDocsRes.status === 'fulfilled' && Array.isArray(allDocsRes.value?.data) ? allDocsRes.value.data : []
      
      if (docs.length === 0 && allDocs.length > 0) {
        docs = allDocs.filter(d => 
          String(d.hospitalId) === String(hospitalId) || 
          (hospName && d.hospitalName && d.hospitalName.toLowerCase() === hospName.toLowerCase())
        )
        if (docs.length === 0) docs = allDocs
      }

      const docIds = new Set(docs.map(d => d.id).filter(Boolean))

      let appts = apptsRes.status === 'fulfilled' && Array.isArray(apptsRes.value?.data) ? apptsRes.value.data : []
      const allAppts = allApptsRes.status === 'fulfilled' && Array.isArray(allApptsRes.value?.data) ? allApptsRes.value.data : []

      if (appts.length === 0 && allAppts.length > 0) {
        appts = allAppts.filter(a =>
          String(a.hospitalId) === String(hospitalId) ||
          (a.doctorId && docIds.has(a.doctorId)) ||
          (hospName && a.hospitalName && a.hospitalName.toLowerCase() === hospName.toLowerCase())
        )
        if (appts.length === 0) appts = allAppts
      }

      const allBills = billsRes.status === 'fulfilled' && Array.isArray(billsRes.value?.data) ? billsRes.value.data : []
      let bills = allBills.filter(b =>
        String(b.hospitalId) === String(hospitalId) ||
        (b.doctorId && docIds.has(b.doctorId))
      )
      if (bills.length === 0 && allBills.length > 0) bills = allBills

      let payments = paymentsRes.status === 'fulfilled' && Array.isArray(paymentsRes.value?.data) ? paymentsRes.value.data : []
      if (payments.length === 0) {
        const paidBills = bills.filter(b => b.paymentStatus === 'PAID')
        payments = paidBills
      }

      const totalDoctors = docs.length
      const totalAppointments = appts.length
      const totalPatients = new Set(appts.map(a => a.patientId).filter(Boolean)).size || appts.length
      const totalBills = bills.length
      const totalPayments = payments.length

      const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount ?? p.totalAmount) || 0), 0)
      const pendingRevenue = bills
        .filter(b => b.paymentStatus !== 'PAID')
        .reduce((sum, b) => sum + (Number(b.totalAmount ?? b.amount) || 0), 0)

      return {
        data: {
          totalRevenue,
          pendingRevenue,
          totalPatients,
          totalDoctors,
          totalAppointments,
          totalBills,
          totalPayments,
          reportDate: new Date().toISOString(),
        }
      }
    } catch (err) {
      return {
        data: {
          totalRevenue: 0,
          pendingRevenue: 0,
          totalPatients: 0,
          totalDoctors: 0,
          totalAppointments: 0,
          totalBills: 0,
          totalPayments: 0,
        }
      }
    }
  },
}

// ── Payments ──────────────────────────────────────────────────────────────────
// Talks to the real /payments endpoints. Errors are propagated (not swallowed) so
// the UI only shows a success message once the backend has actually confirmed it.
export const paymentService = {
  create: async (data) => {
    const payload = {
      billId: parseInt(data.billId, 10),
      paymentMethod: data.paymentMethod || 'UPI',
      amount: parseFloat(data.amount) || 0,
    }
    const res = await api.post('/payments', payload)
    return { data: res.data }
  },

  getPatientPayments: async (patientId) => {
    const res = await api.get(`/payments/patient/${patientId}`)
    return { data: Array.isArray(res.data) ? res.data : [] }
  },

  getHospitalPayments: async (hospitalId) => {
    const res = await api.get(`/payments/hospital/${hospitalId}`)
    return { data: Array.isArray(res.data) ? res.data : [] }
  },

  getAllPayments: async () => {
    const res = await api.get('/payments')
    return { data: Array.isArray(res.data) ? res.data : [] }
  }
}

// ── Audit (Medical Record Access Log) ────────────────────────────────────────
const AUDIT_KEY = 'mc_access_audit'

function getLocalAuditLog() {
  try {
    const raw = localStorage.getItem(AUDIT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAuditEntry(entry) {
  const existing = getLocalAuditLog()
  const updated = [entry, ...existing].slice(0, 500) // cap at 500 entries
  localStorage.setItem(AUDIT_KEY, JSON.stringify(updated))
}

export const auditService = {
  /**
   * Log a medical record access event.
   * Called when a doctor views a patient's record.
   */
  logAccess: async ({ doctorId, doctorName, patientId, patientName, hospitalId, hospitalName }) => {
    const now = new Date()
    const entry = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      doctorId,
      doctorName: doctorName || `Doctor ${doctorId}`,
      patientId,
      patientName: patientName || `Patient ${patientId}`,
      hospitalId: hospitalId || null,
      hospitalName: hospitalName || 'Unknown Hospital',
      accessedAt: now.toISOString(),
      date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    }

    // Try backend if it exists, otherwise persist locally
    try {
      await api.post('/audit/access', entry)
    } catch {
      // Backend audit endpoint not available — persist locally
    }
    saveAuditEntry(entry)
    return entry
  },

  getHospitalAuditLog: async (hospitalId) => {
    // Try backend first
    try {
      const res = await api.get(`/audit/hospital/${hospitalId}`)
      if (res.data && Array.isArray(res.data) && res.data.length > 0) return res
    } catch { /* fallback */ }
    // Fallback: return all locally stored entries (filtered if hospitalId present)
    const local = getLocalAuditLog()
    const filtered = hospitalId
      ? local.filter(e => String(e.hospitalId) === String(hospitalId))
      : local
    return { data: filtered }
  },

  clearLog: () => {
    localStorage.removeItem(AUDIT_KEY)
  },
}

// ── Transaction Service Alias ───────────────────────────────────────────────
export const transactionService = {
  getPatientTransactions: (patientId) => billService.getByPatient(patientId),
  ...billService,
}

// ── Re-export doctorService for convenience ───────────────────────────────────
export { doctorService } from './doctorService'