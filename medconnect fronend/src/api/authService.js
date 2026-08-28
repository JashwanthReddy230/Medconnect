import api from './axiosInstance'

export const authService = {
  /**
   * POST /auth/login
   * Request:  { email, password }
   * Response: { userId, name, role, token }
   */
  login: (data) =>
    api.post('/auth/login', data),

  /**
   * POST /auth/register
   * Request:  { fullName, email, password, mobile, roleName }
   * roleName: 'USER' | 'HOSPITAL' | 'ADMIN'
   * Response: String "User Registered Successfully"
   */
  register: (data) =>
    api.post('/auth/register', data),

  /**
   * POST /auth/otp/send
   * Request:  { mobile }
   */
  sendOtp: (mobile) =>
    api.post('/auth/otp/send', { mobile }),

  /**
   * POST /auth/otp/verify
   * Request:  { mobile, otp }
   */
  verifyOtp: (mobile, otp) =>
    api.post('/auth/otp/verify', { mobile, otp }),

  /**
   * Simulated/mocked endpoints for features not supported by the current backend
   */
  resetPassword: (currentPassword, newPassword) => {
    return new Promise((resolve) => setTimeout(resolve, 800))
  },

  forgotPassword: (email) => {
    return new Promise((resolve) => setTimeout(resolve, 800))
  },
}

