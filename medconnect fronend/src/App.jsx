import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { FullPageLoader } from '@/components/common/index.jsx'
import { PublicLayout, DashboardLayout } from '@/components/layout/Layouts.jsx'
import { ProtectedRoute, RoleGuard, PublicOnlyRoute } from '@/components/guards/RouteGuards.jsx'

import ContinueAppointment from '@/pages/patient/ContinueAppointment'

// ── Public ────────────────────────────────────────────────────────────────────
const LandingPage = lazy(() => import('@/pages/public/LandingPage'))
const DoctorListingPage = lazy(() => import('@/pages/public/DoctorListingPage'))
const DoctorPublicProfile = lazy(() => import('@/pages/public/DoctorPublicProfile'))
const HospitalListingPage = lazy(() => import('@/pages/public/HospitalListingPage'))
const HospitalPublicProfile = lazy(() => import('@/pages/public/HospitalPublicProfile'))
const LoginPage = lazy(() => import('@/pages/public/LoginPage'))
const Register = lazy(() => import('@/pages/public/RegisterPages.jsx').then(m => ({ default: m.RegisterPage })))
const PatientRegister = lazy(() => import('@/pages/public/RegisterPages.jsx').then(m => ({ default: m.PatientRegisterPage })))
const DoctorRegister = lazy(() => import('@/pages/public/RegisterPages.jsx').then(m => ({ default: m.DoctorRegisterPage })))
const HospitalRegister = lazy(() => import('@/pages/public/RegisterPages.jsx').then(m => ({ default: m.HospitalRegisterPage })))
const ForgotPassword = lazy(() => import('@/pages/public/RegisterPages.jsx').then(m => ({ default: m.ForgotPasswordPage })))
const AboutPage = lazy(() => import('@/pages/public/StaticPages.jsx').then(m => ({ default: m.AboutPage })))
const ContactPage = lazy(() => import('@/pages/public/StaticPages.jsx').then(m => ({ default: m.ContactPage })))
const BlogPage = lazy(() => import('@/pages/public/StaticPages.jsx').then(m => ({ default: m.BlogPage })))
const NotFoundPage = lazy(() => import('@/pages/public/StaticPages.jsx').then(m => ({ default: m.NotFoundPage })))

// ── Patient ───────────────────────────────────────────────────────────────────
const PatientDashboard = lazy(() => import('@/pages/patient/PatientDashboard'))
const PatientProfile = lazy(() => import('@/pages/patient/PatientProfile'))
const PatientAppointments = lazy(() => import('@/pages/patient/PatientAppointments'))
const PatientTransactions = lazy(() => import('@/pages/patient/PatientTransactions'))
const PatientNotifications = lazy(() => import('@/pages/patient/PatientNotifications'))
const PatientPrescriptions = lazy(() => import('@/pages/patient/PatientPrescriptions'))
const PatientMedicalHistory = lazy(() => import('@/pages/patient/PatientMedicalHistory'))
const PatientBills = lazy(() => import('@/pages/patient/PatientBills'))
const PatientSettings = lazy(() => import('@/pages/patient/Patientsettings'))

// ── Doctor ────────────────────────────────────────────────────────────────────
const DoctorDashboard = lazy(() => import('@/pages/doctor/DoctorDashboard'))
const DoctorProfile = lazy(() => import('@/pages/doctor/DoctorProfile'))
const DoctorAppointments = lazy(() => import('@/pages/doctor/DoctorAppointments'))
const DoctorSchedule = lazy(() => import('@/pages/doctor/DoctorSchedule'))
const DoctorPatients = lazy(() => import('@/pages/doctor/DoctorPatients'))
const DoctorMedicalRecords = lazy(() => import('@/pages/doctor/DoctorMedicalRecords'))
const NewMedicalRecord = lazy(() => import('@/pages/doctor/NewMedicalRecord'))
const NewPrescription = lazy(() => import('@/pages/doctor/NewPrescription'))
const DoctorNotifications = lazy(() => import('@/pages/doctor/DoctorNotifications'))
const PatientHistory = lazy(() => import('@/pages/doctor/PatientHistory'))
const DoctorSettings = lazy(() => import('@/pages/doctor/Doctorsettings'))

// ── Hospital ──────────────────────────────────────────────────────────────────
const HospitalDashboard = lazy(() => import('@/pages/hospital/HospitalDashboard'))
const HospitalProfile = lazy(() => import('@/pages/hospital/HospitalProfile'))
const HospitalDoctors = lazy(() => import('@/pages/hospital/HospitalDoctors'))
const HospitalPatients = lazy(() => import('@/pages/hospital/HospitalPatients'))
const HospitalAppointments = lazy(() => import('@/pages/hospital/HospitalAppointments'))
const HospitalReports = lazy(() => import('@/pages/hospital/HospitalReports'))
const HospitalDepartments = lazy(() => import('@/pages/hospital/HospitalDepartments'))
const HospitalTransactions = lazy(() => import('@/pages/hospital/HospitalTransactions'))
const HospitalAudit = lazy(() => import('@/pages/hospital/HospitalAudit'))
const HospitalSettings = lazy(() => import('@/pages/hospital/Hospitalsettings'))

// ── Admin ─────────────────────────────────────────────────────────────────────
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminDoctorsPending = lazy(() => import('@/pages/admin/AdminDoctorsPending'))
const AdminDoctors = lazy(() => import('@/pages/admin/AdminDoctors'))
const AdminPatients = lazy(() => import('@/pages/admin/AdminPatients'))
const AdminHospitals = lazy(() => import('@/pages/admin/AdminHospitals'))
const AdminAppointments = lazy(() => import('@/pages/admin/AdminAppointments'))
const AdminReviews = lazy(() => import('@/pages/admin/AdminReviews'))
const AdminBlog = lazy(() => import('@/pages/admin/AdminBlog'))
const AdminNotifications = lazy(() => import('@/pages/admin/AdminNotifications'))
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'))
const AdminSettings = lazy(() => import('@/pages/admin/Adminsettings'))

// ── Shared ────────────────────────────────────────────────────────────────────
const AppointmentDetail = lazy(() => import('@/pages/shared/AppointmentDetail'))

// ── Placeholder ───────────────────────────────────────────────────────────────
function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-1">{title || 'Coming soon'}</h2>
      <p className="text-sm text-slate-400">This page is part of the next development sprint.</p>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '10px' } }} />
      <Suspense fallback={<FullPageLoader />}>
        <Routes>

          {/* ── PUBLIC ── */}
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="doctors" element={<DoctorListingPage />} />
            <Route path="doctors/:id" element={<DoctorPublicProfile />} />
            <Route path="hospitals" element={<HospitalListingPage />} />
            <Route
              path="/appointment/continue"
              element={<ContinueAppointment />}
            />
            <Route path="hospitals/:id" element={<HospitalPublicProfile />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="blog/:slug" element={<ComingSoon title="Article" />} />
            <Route path="login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
            <Route path="register/patient" element={<PublicOnlyRoute><PatientRegister /></PublicOnlyRoute>} />
            <Route path="register/doctor" element={<PublicOnlyRoute><DoctorRegister /></PublicOnlyRoute>} />
            <Route path="register/hospital" element={<PublicOnlyRoute><HospitalRegister /></PublicOnlyRoute>} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password/:token" element={<ComingSoon title="Reset Password" />} />
          </Route>

          {/* ── PATIENT ── */}
          <Route path="patient" element={
            <ProtectedRoute><RoleGuard roles={['patient']}><DashboardLayout /></RoleGuard></ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="profile" element={<PatientProfile />} />
            <Route path="appointments" element={<PatientAppointments />} />
            <Route path="appointments/:id" element={<AppointmentDetail />} />
            <Route path="transactions" element={<PatientTransactions />} />
            <Route path="prescriptions" element={<PatientPrescriptions />} />
            <Route path="medical-history" element={<PatientMedicalHistory />} />
            <Route path="bills" element={<PatientBills />} />
            <Route path="hospitals" element={<HospitalListingPage />} />
            <Route path="hospitals/:id" element={<HospitalPublicProfile />} />
            <Route path="doctors" element={<DoctorListingPage />} />
            <Route path="doctors/:id" element={<DoctorPublicProfile />} />
            <Route path="notifications" element={<PatientNotifications />} />
            <Route path="settings" element={<PatientSettings />} />
          </Route>

          {/* ── DOCTOR ── */}
          <Route path="doctor" element={
            <ProtectedRoute><RoleGuard roles={['doctor']}><DashboardLayout /></RoleGuard></ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="profile" element={<DoctorProfile />} />
            <Route path="appointments" element={<DoctorAppointments />} />
            <Route path="appointments/:id" element={<AppointmentDetail />} />
            <Route path="schedule" element={<DoctorSchedule />} />
            <Route path="patients" element={<DoctorPatients />} />
            <Route path="patients/:id" element={<PatientHistory />} />
            <Route path="records" element={<DoctorMedicalRecords />} />
            <Route path="records/new" element={<NewMedicalRecord />} />
            <Route path="prescriptions/new" element={<NewPrescription />} />
            <Route path="prescriptions" element={<ComingSoon title="Prescriptions" />} />
            <Route path="reviews" element={<ComingSoon title="My Reviews" />} />
            <Route path="notifications" element={<DoctorNotifications />} />
            <Route path="settings" element={<DoctorSettings />} />
          </Route>

          {/* ── HOSPITAL ── */}
          <Route path="hospital" element={
            <ProtectedRoute><RoleGuard roles={['hospital']}><DashboardLayout /></RoleGuard></ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HospitalDashboard />} />
            <Route path="profile" element={<HospitalProfile />} />
            <Route path="doctors" element={<HospitalDoctors />} />
            <Route path="patients" element={<HospitalPatients />} />
            <Route path="appointments" element={<HospitalAppointments />} />
            <Route path="reports" element={<HospitalReports />} />
            <Route path="departments" element={<HospitalDepartments />} />
            <Route path="transactions" element={<HospitalTransactions />} />
            <Route path="audit" element={<HospitalAudit />} />
            <Route path="notifications" element={<ComingSoon title="Notifications" />} />
            <Route path="settings" element={<HospitalSettings />} />
          </Route>

          {/* ── ADMIN ── */}
          <Route path="admin" element={
            <ProtectedRoute><RoleGuard roles={['admin']}><DashboardLayout /></RoleGuard></ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="doctors/pending" element={<AdminDoctorsPending />} />
            <Route path="doctors" element={<AdminDoctors />} />
            <Route path="patients" element={<AdminPatients />} />
            <Route path="hospitals" element={<AdminHospitals />} />
            <Route path="appointments" element={<AdminAppointments />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="blog" element={<AdminBlog />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* ── 404 ── */}
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </Suspense>
    </>
  )
}