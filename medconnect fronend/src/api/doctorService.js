import api from './axiosInstance'
import { tokenManager } from '@/utils/tokenManager'

export const doctorService = {
  create: (data) =>
    api.post('/doctor', data),

  getAll: (params) =>
    api.get('/doctor', { params }),

  getById: (id) =>
    api.get(`/doctor/${id}`),

  getProfile: (id) =>
    api.get(`/doctor/${id}`),

  updateProfile: async (data) => {
    const profile = tokenManager.loadProfile() || {}
    const id = profile.id
    const payload = {
      doctorName: data.doctorName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || '',
      specialization: data.specialization || '',
      qualification: data.qualification || 'MBBS',
      experience: parseInt(data.experience, 10) || 0,
      consultationFee: parseFloat(data.consultationFee) || 0.0,
      email: data.email || '',
      mobile: data.mobile || data.phone || '',
      hospitalId: parseInt(data.hospitalId, 10) || 1
    }
    const res = await api.put(`/doctor/${id}`, payload)
    try {
      const token = tokenManager.getAccessToken()
      const decoded = tokenManager.decodeToken(token)
      const authUserId = decoded?.userId
      if (authUserId) {
        await api.put(`/auth/update/${authUserId}`, {
          fullName: payload.doctorName,
          email: payload.email,
          mobile: payload.mobile,
          password: 'PasswordUnchanged123', // required validation fallback
          roleName: 'DOCTOR'
        })
      }
    } catch (err) {
      console.error('Failed to sync doctor details to auth-service:', err)
    }
    return res
  },

  updateAvailability: (slots) =>
    Promise.resolve({ data: { slots } }),

  getAvailableSlots: (doctorId, date) =>
    Promise.resolve({ data: [] }),

  getPatientHistory: (patientId) =>
    api.get(`/medical-record/patient/${patientId}`),

  search: (params) => {
    return api.get('/doctor/search', {
      params: {
        doctorName: params.query || params.name || '',
        page: params.page || 0,
        size: params.limit || 5
      }
    })
  },

  getPendingApprovals: (params) =>
    api.get('/doctor', { params }),

  approve: (doctorId) =>
    api.put(`/doctor/${doctorId}/activate`),

  reject: (doctorId, reason) =>
    api.put(`/doctor/${doctorId}/deactivate`),

  uploadProfilePhoto: (formData) =>
    Promise.resolve({ data: { status: 'success' } }),
}
