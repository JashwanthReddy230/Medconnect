import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeftIcon, ClipboardDocumentListIcon, CalendarIcon,
  BeakerIcon, HeartIcon, ClockIcon, UserIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { doctorService, appointmentService } from '@/api/services'
import { Avatar, EmptyState } from '@/components/common/index.jsx'
import { normalizePatient, normalizeAppointments } from '@/utils/normalizers'
import { formatDate, formatAppointmentDate, appointmentStatusMap } from '@/utils/formatters'
import clsx from 'clsx'

export default function PatientHistory() {
  const { id } = useParams()
  const { user } = useAuth()
  const [patient,    setPatient]    = useState(null)
  const [history,    setHistory]    = useState([])
  const [appts,      setAppts]      = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)

    const fetchAll = async () => {
      try {
        const [histRes, apptRes] = await Promise.allSettled([
          doctorService.getPatientHistory(id),
          appointmentService.getPatientAppointments(id),
        ])
        if (cancelled) return
        if (histRes.status === 'fulfilled') {
          const data = histRes.value.data
          setHistory(Array.isArray(data) ? data : (data ? [data] : []))
        }
        if (apptRes.status === 'fulfilled') {
          setAppts(normalizeAppointments(apptRes.value.data || []))
        }
        // Try to get patient info from first appointment
        if (apptRes.status === 'fulfilled' && apptRes.value.data?.length > 0) {
          const first = apptRes.value.data[0]
          setPatient({ fullName: first.patientName, id })
        }
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false) }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [id])

  const completed = appts.filter(a => a.status === 'completed')
  const upcoming  = appts.filter(a => a.status === 'confirmed' || a.status === 'pending')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <Link to="/doctor/patients" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 transition-colors">
        <ArrowLeftIcon className="w-4 h-4" /> Back to patients
      </Link>

      {/* Patient header */}
      <div className="card p-6 flex items-center gap-5">
        <Avatar name={patient?.fullName || `Patient ${id}`} size="2xl" />
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {patient?.fullName || `Patient #${id}`}
          </h1>
          <div className="flex flex-wrap gap-3 mt-2">
            <span className="badge-info">{completed.length} Completed visits</span>
            <span className="badge-warning">{upcoming.length} Upcoming</span>
            <span className="badge-success">{history.length} Medical records</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="card p-5 space-y-3 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              {[...Array(3)].map((__, j) => (
                <div key={j} className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Medical records */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardDocumentListIcon className="w-5 h-5 text-slate-400" />
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">Medical Records</h2>
            </div>
            {history.length === 0 ? (
              <EmptyState
                icon={<ClipboardDocumentListIcon className="w-7 h-7" />}
                title="No medical records"
                description="No records have been created for this patient yet."
              />
            ) : (
              <div className="space-y-3">
                {history.map((record, i) => (
                  <div key={record.id || i} className="p-4 rounded-xl bg-muted-light dark:bg-muted-dark space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {record.diagnosis || record.notes || `Record #${record.id || i + 1}`}
                      </p>
                      <span className="badge-primary text-[10px]">Record #{record.id || i + 1}</span>
                    </div>

                    {record.symptoms && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        <span className="font-medium text-slate-400">Symptoms:</span> {record.symptoms}
                      </p>
                    )}
                    {record.treatment && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        <span className="font-medium text-slate-400">Treatment:</span> {record.treatment}
                      </p>
                    )}
                    {(record.doctorNotes || record.notes) && (
                      <p className="text-xs text-slate-500 italic">
                        <span className="font-medium text-slate-400">Doctor Notes:</span> {record.doctorNotes || record.notes}
                      </p>
                    )}

                    <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                      <span>Visit Date: {formatDate(record.visitDate || record.createdAt)}</span>
                      {record.appointmentId && <span>Appt Ref: APT-{record.appointmentId}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Appointment history */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="w-5 h-5 text-slate-400" />
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">Appointment History</h2>
            </div>
            {appts.length === 0 ? (
              <EmptyState
                icon={<CalendarIcon className="w-7 h-7" />}
                title="No appointments"
                description="This patient has no appointment history."
              />
            ) : (
              <div className="space-y-3">
                {appts.slice(0, 10).map((appt) => {
                  const statusInfo = appointmentStatusMap[appt.status]
                  return (
                    <div key={appt._id} className="flex items-center justify-between p-3 rounded-xl bg-muted-light dark:bg-muted-dark">
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {appt.appointmentDate}
                          {appt.slot && ` · ${appt.slot}`}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{appt.notes || appt.reason || 'General consultation'}</p>
                      </div>
                      {statusInfo && (
                        <span className={clsx('badge text-xs', statusInfo.class)}>{statusInfo.label}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Write a prescription CTA */}
      <div className="card p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <BeakerIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Write a prescription</p>
            <p className="text-xs text-slate-400">Create a new prescription for this patient</p>
          </div>
        </div>
        <Link to="/doctor/prescriptions/new" className="btn btn-primary btn-sm gap-2">
          <BeakerIcon className="w-4 h-4" />
          New prescription
        </Link>
      </div>
    </div>
  )
}
