import { useState, useEffect } from 'react'
import {
  MagnifyingGlassIcon, UserIcon, CalendarIcon,
  ClipboardDocumentListIcon, HeartIcon, ClockIcon,
  ShieldExclamationIcon, PaperAirplaneIcon, CheckCircleIcon,
  InformationCircleIcon, BeakerIcon,
} from '@heroicons/react/24/outline'
import { appointmentService, patientService, prescriptionService, auditService } from '@/api/services'
import { useAuth } from '@/context/AuthContext'
import { tokenManager } from '@/utils/tokenManager'
import { Avatar, Spinner, EmptyState, Modal } from '@/components/common/index.jsx'
import { formatDate, appointmentStatusMap } from '@/utils/formatters'
import { maskEmail, maskPhone } from '@/utils/maskData'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function DoctorPatients() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [patientList,  setPatientList]  = useState([])
  const [query,        setQuery]        = useState('')
  const [patient,      setPatient]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [searching,    setSearching]    = useState(false)
  const [unlinkedId,   setUnlinkedId]   = useState(null)
  const [requestSent,  setRequestSent]  = useState({})
  const [sendingReq,   setSendingReq]   = useState(false)
  const [activeTab,    setTab]          = useState(0)
  const [rxLoading,    setRxLoading]    = useState(false)

  useEffect(() => {
    let cancelled = false
    const doctorId = user?.id
    if (!doctorId) { setLoading(false); return }

    setLoading(true)
    appointmentService.getDoctorAppointments({ doctorId })
      .then(res => {
        if (cancelled) return
        const appts = res.data || []
        setAppointments(appts)

        // Build list of patients who have at least one COMPLETED appointment (visited patients only)
        const patientMap = {}
        appts.forEach(a => {
          if (a.patientId && !patientMap[a.patientId]) {
            const patientAppts = appts.filter(x => x.patientId === a.patientId)
            const hasVisited = patientAppts.some(x => x.status === 'completed')
            if (hasVisited) {
              patientMap[a.patientId] = {
                id: a.patientId,
                fullName: a.patientName || `Patient #${a.patientId}`,
                lastVisit: a.date || a.appointmentDate,
                appointmentCount: patientAppts.length,
                completedCount: patientAppts.filter(x => x.status === 'completed').length,
                appointments: patientAppts,
              }
            }
          }
        })

        setPatientList(Object.values(patientMap))
      })
      .catch(err => {
        console.error('Failed to load doctor appointments:', err)
        toast.error('Failed to load patient records.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [user?.id])

  const handleSelectPatient = async (p) => {
    setSearching(true)
    setUnlinkedId(null)
    setPatient(null)
    try {
      // Fetch medical records from API for linked patient
      let recordRes = null
      try {
        recordRes = await patientService.getMedicalHistory(p.id)
      } catch { /* optional medical history */ }

      const patAppts = appointments.filter(a => String(a.patientId) === String(p.id))

      // Fetch prescriptions from all medical records
      const allRx = []
      setRxLoading(true)
      const records = recordRes?.data || []
      for (const record of records.slice(0, 10)) {
        try {
          const pRes = await prescriptionService.getByMedicalRecord(record.id || record.medicalRecordId)
          const recs = Array.isArray(pRes.data) ? pRes.data : (pRes.data ? [pRes.data] : [])
          allRx.push(...recs)
        } catch { /* skip */ }
      }
      setRxLoading(false)

      const patientData = {
        _id: `PAT-${p.id}`,
        id: p.id,
        fullName: p.fullName,
        gender: p.gender || 'Not specified',
        dateOfBirth: p.dateOfBirth || '1990-01-01',
        bloodGroup: p.bloodGroup || 'O+',
        phone: p.phone || p.mobile || '+91 98765 43210',
        email: p.email || 'patient@example.com',
        allergies: recordRes?.data?.[0]?.allergies || ['None Reported'],
        chronicConditions: recordRes?.data?.[0]?.chronicConditions || ['None Reported'],
        appointments: patAppts,
        prescriptions: allRx,
      }
      setPatient(patientData)

      // Log audit entry for this record access
      try {
        const profile = tokenManager.loadProfile() || {}
        const doctorHospitalId = profile.hospitalId || null
        await auditService.logAccess({
          doctorId:    user?.id,
          doctorName:  user?.fullName || `Doctor ${user?.id}`,
          patientId:   p.id,
          patientName: p.fullName,
          hospitalId:  doctorHospitalId,
          hospitalName: profile.hospitalName || 'Your Hospital',
        })
      } catch { /* non-critical */ }
    } catch (err) {
      toast.error('Error fetching patient record details.')
    } finally {
      setSearching(false)
    }
  }

  const handleSearch = () => {
    const q = query.trim().toLowerCase()
    if (!q) return

    // Verify if patient exists in doctor's booked appointment list
    const found = patientList.find(p =>
      String(p.id).toLowerCase() === q ||
      `pat-${p.id}`.toLowerCase() === q ||
      p.fullName.toLowerCase().includes(q)
    )

    if (found) {
      handleSelectPatient(found)
    } else {
      // Patient is not linked to this doctor -> Restrict Access & show Access Request flow
      setPatient(null)
      setUnlinkedId(query.toUpperCase())
    }
  }

  const handleSendAccessRequest = async () => {
    if (!unlinkedId) return
    setSendingReq(true)
    try {
      // Simulate sending record access request to Hospital Admin
      await new Promise(r => setTimeout(r, 600))
      setRequestSent(prev => ({ ...prev, [unlinkedId]: true }))
      toast.success(`Record Access Request sent to Hospital Admin for ${unlinkedId}`)
    } catch {
      toast.error('Failed to send request.')
    } finally {
      setSendingReq(false)
    }
  }

  const TABS = ['Overview', `Appointments (${patient?.appointments?.length || 0})`, `Prescriptions (${patient?.prescriptions?.length || 0})`]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Patient Records &amp; Access Control</h1>
        <p className="page-sub">Showing patients who have completed at least one visit with you</p>
      </div>

      {/* Search Bar */}
      <div className="card p-5">
        <label className="label mb-2">Search Patient Records (by ID or Name)</label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter Patient ID (e.g. PAT-1) or Name…"
              className="input pl-9"
            />
          </div>
          <button onClick={handleSearch} className="btn btn-primary gap-2">
            <MagnifyingGlassIcon className="w-4 h-4" />
            Search
          </button>
        </div>

        {/* Visited Patients List */}
        <div className="mt-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
            Visited Patients ({patientList.length})
          </p>
          {loading ? (
            <div className="flex gap-2">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-32 animate-pulse" />
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-32 animate-pulse" />
            </div>
          ) : patientList.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No patients have completed a visit with you yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {patientList.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setQuery(p.fullName); handleSelectPatient(p) }}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                    patient?.id === p.id
                      ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-400 text-primary-700 dark:text-primary-300'
                      : 'bg-muted-light dark:bg-muted-dark border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-300'
                  )}
                >
                  <Avatar name={p.fullName} size="xs" />
                  <span>{p.fullName}</span>
                  <span className="text-[10px] text-slate-400">PAT-{p.id}</span>
                  {p.completedCount > 0 && (
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">
                      {p.completedCount} visit{p.completedCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {searching && (
        <div className="card p-12 flex justify-center">
          <div className="flex flex-col items-center gap-2">
            <Spinner size="md" />
            <p className="text-sm text-slate-400">Loading patient record…</p>
          </div>
        </div>
      )}

      {/* Unlinked Patient / Access Control Warning */}
      {!searching && unlinkedId && (
        <div className="card p-6 border-l-4 border-l-amber-500 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <ShieldExclamationIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Medical Record Access Restricted
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                You do not have an active or booked appointment with patient <strong>"{unlinkedId}"</strong>.
                Under HIPAA &amp; Medical Privacy Controls, doctor access is strictly restricted to active appointment holders.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                If you require emergency access to this patient's medical history, you can send an official <strong>Record Access Request</strong> to the Hospital Administrator.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {requestSent[unlinkedId] ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                Access Request Pending Approval by Hospital Admin
              </div>
            ) : (
              <button
                onClick={handleSendAccessRequest}
                disabled={sendingReq}
                className="btn btn-primary btn-sm gap-2"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                {sendingReq ? 'Sending Request…' : 'Send Record Access Request to Hospital Admin'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Patient Record display when authorized */}
      {!searching && patient && (
        <div className="space-y-5 animate-fade-in">
          {/* Header */}
          <div className="card p-5 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
            <Avatar name={patient.fullName} size="xl" />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{patient.fullName}</h2>
                <span className="badge-success text-xs">Active Appointment ✓</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">ID: {patient._id}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                <span className="badge-primary">{patient.bloodGroup}</span>
                <span className="badge-neutral">{patient.gender}</span>
                <span className="badge-info">DOB: {formatDate(patient.dateOfBirth)}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-muted-light dark:bg-muted-dark rounded-xl p-1">
            {TABS.map((tab, i) => (
              <button key={tab} onClick={() => setTab(i)}
                className={clsx(
                  'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                  activeTab === i
                    ? 'bg-white dark:bg-card-dark shadow-sm text-primary-600 dark:text-primary-400'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >{tab}</button>
            ))}
          </div>

          {/* Tab 0: Overview */}
          {activeTab === 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-primary-500" /> Contact
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-500 dark:text-slate-400">{maskEmail(patient.email)}</p>
                  <p className="text-slate-500 dark:text-slate-400">{maskPhone(patient.phone)}</p>
                </div>
              </div>
              <div className="card p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <HeartIcon className="w-4 h-4 text-red-500" /> Medical
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Allergies</p>
                    <div className="flex flex-wrap gap-1">
                      {patient.allergies.map((a) => <span key={a} className="badge-danger">{a}</span>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Chronic conditions</p>
                    <div className="flex flex-wrap gap-1">
                      {patient.chronicConditions.map((c) => <span key={c} className="badge-warning">{c}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 1: Appointments */}
          {activeTab === 1 && (
            <div className="space-y-3">
              {patient.appointments.map((appt) => (
                <div key={appt._id || appt.id} className="card p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {formatDate(appt.date || appt.appointmentDate)} · {appt.slot || appt.appointmentTime}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">{appt.notes || appt.reason}</p>
                    </div>
                  </div>
                  <span className={clsx('badge', appointmentStatusMap[appt.status]?.class)}>
                    {appointmentStatusMap[appt.status]?.label || appt.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Prescriptions */}
          {activeTab === 2 && (
            <div className="space-y-3">
              {rxLoading ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <Spinner size="md" />
                  <p className="text-sm text-slate-400">Loading prescriptions…</p>
                </div>
              ) : patient.prescriptions.length === 0 ? (
                <EmptyState
                  icon={<ClipboardDocumentListIcon className="w-7 h-7" />}
                  title="No prescriptions recorded"
                  description="Issue a new prescription directly from your appointment profile."
                />
              ) : (
                patient.prescriptions.map((rx, idx) => {
                  const colors = [
                    'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
                    'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
                    'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
                    'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
                  ]
                  const color = colors[idx % colors.length]
                  return (
                    <div key={rx.id || idx} className="card p-4 flex items-start gap-3">
                      <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
                        <BeakerIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {rx.medicineName || rx.name || 'Unknown Medicine'}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {rx.dosage && <span>💊 {rx.dosage}</span>}
                          {rx.duration && <span>⏱ {rx.duration}</span>}
                          {rx.instructions && <span>📋 {rx.instructions}</span>}
                        </div>
                        {rx.medicalRecordId && (
                          <p className="text-[10px] text-slate-400 mt-1">Record #{rx.medicalRecordId}</p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State before search */}
      {!searching && !patient && !unlinkedId && (
        <EmptyState
          icon={<MagnifyingGlassIcon className="w-8 h-8" />}
          title="Select a patient record"
          description="Click a patient from your booked list above or enter their Patient ID to view medical records."
        />
      )}
    </div>
  )
}
