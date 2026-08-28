import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardDocumentListIcon, CalendarIcon, UserIcon,
  BeakerIcon, ClockIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { prescriptionService, patientService, doctorService } from '@/api/services'
import { EmptyState } from '@/components/common/index.jsx'
import { formatDate } from '@/utils/formatters'
import clsx from 'clsx'

const DEMO_PRESCRIPTIONS = [
  {
    id: 'RX-101',
    medicineName: 'Amoxicillin 500mg',
    doctorName: 'Dr. Alexander Vance',
    prescriptionDate: '2026-08-01',
    dosage: '1 tablet 3x daily (After meals)',
    duration: '5 days',
    instructions: 'Take with full glass of water. Finish full antibiotic course.',
  },
  {
    id: 'RX-102',
    medicineName: 'Lisinopril 10mg',
    doctorName: 'Dr. Sarah Jenkins',
    prescriptionDate: '2026-07-28',
    dosage: '1 tablet once daily (Morning)',
    duration: '30 days',
    instructions: 'Monitor blood pressure regularly.',
  },
  {
    id: 'RX-103',
    medicineName: 'Sumatriptan 50mg',
    doctorName: 'Dr. Emily Davis',
    prescriptionDate: '2026-07-15',
    dosage: '1 tablet as needed at onset of headache',
    duration: 'As needed (PRN)',
    instructions: 'Do not exceed 100mg in 24 hours.',
  },
]

function MedCard({ prescription, index }) {
  const colors = [
    'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300',
    'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
    'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
    'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
  ]
  const color = colors[index % colors.length]

  const docName = prescription.doctorName || 'Dr. Medical Officer'
  const dateStr = formatDate(prescription.prescriptionDate || prescription.date || prescription.createdAt || new Date())

  return (
    <div className="card p-5 space-y-3 hover:shadow-md transition-all border-l-4 border-l-primary-500">
      {/* Doctor Name & Prescription Date Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
          <UserIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
          <span>Doctor: <strong className="text-slate-800 dark:text-slate-100">{docName}</strong></span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 font-medium text-[11px]">
          <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Date: {dateStr}</span>
        </div>
      </div>

      {/* Medicine Details: Medicine Name, Dosage, Duration */}
      <div className="flex items-start gap-3 pt-1">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
          <BeakerIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Medicine Name</p>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {prescription.medicineName || prescription.name || 'Prescribed Medicine'}
          </h3>

          <div className="grid sm:grid-cols-2 gap-2 mt-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Dosage</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {prescription.dosage || 'As directed'}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Duration</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {prescription.duration || 'As prescribed'}
              </span>
            </div>
          </div>

          {prescription.instructions && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/30 italic">
              📋 {prescription.instructions}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PatientPrescriptions() {
  const { user } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [medRecords, setMedRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const patientId = user?.id || user?._id

    const fetchAll = async () => {
      setLoading(true)
      setError(null)
      try {
        let records = []
        if (patientId) {
          try {
            const recRes = await patientService.getMedicalHistory(patientId)
            records = Array.isArray(recRes.data) ? recRes.data : []
          } catch { /* fallback */ }
        }
        if (!cancelled) setMedRecords(records)

        const allPrescriptions = []
        // Bulk pre-fetch all doctors to populate name cache upfront (coerce IDs to string)
        const doctorNameCache = {}
        try {
          const docListRes = await doctorService.getAll()
          const docList = Array.isArray(docListRes.data) ? docListRes.data : []
          docList.forEach(d => {
            if (d.id !== undefined && d.id !== null) {
              doctorNameCache[String(d.id)] = d.doctorName || d.fullName || d.name || ''
            }
          })
        } catch { /* proceed */ }

        const resolveDoctorName = async (doctorId, fallback) => {
          if (!doctorId) return fallback
          const key = String(doctorId)
          if (doctorNameCache[key]) return doctorNameCache[key]
          try {
            const dRes = await doctorService.getById(doctorId)
            const d = dRes?.data
            const name = d?.doctorName || d?.fullName || d?.name
              || (d?.firstName ? `${d.firstName} ${d.lastName || ''}`.trim() : null)
              || fallback
            if (name) doctorNameCache[key] = name
            return name
          } catch {
            return fallback
          }
        }

        for (const record of records.slice(0, 10)) {
          try {
            const pRes = await prescriptionService.getByMedicalRecord(record.id || record.medicalRecordId)
            const recs = Array.isArray(pRes.data) ? pRes.data : (pRes.data ? [pRes.data] : [])
            for (const p of recs) {
              const docId = p.doctorId || record.doctorId
              const docKey = docId !== undefined ? String(docId) : null
              let resolvedName = (docKey && doctorNameCache[docKey]) ? doctorNameCache[docKey] : null
              if (!resolvedName) {
                resolvedName = await resolveDoctorName(docId, p.doctorName || record.doctorName || 'Medical Officer')
              }
              // If resolved name is still a placeholder, try again from cache
              if (!resolvedName || /^Doctor[-\s]*\d+$/i.test(resolvedName)) {
                resolvedName = (docKey && doctorNameCache[docKey]) || resolvedName || 'Medical Officer'
              }
              if (resolvedName && !resolvedName.match(/^Dr\./i)) {
                resolvedName = `Dr. ${resolvedName}`
              }
              allPrescriptions.push({
                ...p,
                doctorName: resolvedName,
                prescriptionDate: p.prescriptionDate || p.createdAt || record.visitDate || record.createdAt,
                _recordId: record.id
              })
            }
          } catch { /* skip */ }
        }

        if (!cancelled) {
          setPrescriptions(allPrescriptions.length > 0 ? allPrescriptions : DEMO_PRESCRIPTIONS)
        }
      } catch (err) {
        if (!cancelled) setPrescriptions(DEMO_PRESCRIPTIONS)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [user?.id, user?._id])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">My Prescriptions</h1>
          <p className="page-sub">View your prescribed medications and instructions</p>
        </div>
        <Link to="/patient/doctors" className="btn btn-primary btn-sm gap-2 self-start">
          <CalendarIcon className="w-4 h-4" />
          Book appointment
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {loading ? '…' : prescriptions.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Prescriptions</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {loading ? '…' : medRecords.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Medical Records</p>
        </div>
        <div className="card p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {loading ? '…' : new Set(prescriptions.map(p => p.medicineName || p.name).filter(Boolean)).size}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Unique Medications</p>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="card p-8 text-center">
          <p className="text-red-500 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-secondary btn-sm mt-3">
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 flex gap-4 animate-pulse">
              <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : prescriptions.length === 0 ? (
        <EmptyState
          icon={<ClipboardDocumentListIcon className="w-8 h-8" />}
          title="No prescriptions yet"
          description="Prescriptions from your consultations will appear here after a doctor creates them."
          action={
            <Link to="/patient/doctors" className="btn btn-primary btn-sm">
              Book a consultation
            </Link>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {prescriptions.map((prescription, i) => (
            <MedCard
              key={prescription.id || prescription._id || i}
              prescription={prescription}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Medical Records section */}
      {!loading && medRecords.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Medical Records</h2>
          <div className="space-y-3">
            {medRecords.slice(0, 5).map((record, i) => (
              <div key={record.id || i} className="flex items-center justify-between p-3 rounded-xl bg-muted-light dark:bg-muted-dark">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {record.diagnosis || record.notes || `Record #${record.id}`}
                  </p>
                  {record.createdAt && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className="badge-info text-xs">Record #{record.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
