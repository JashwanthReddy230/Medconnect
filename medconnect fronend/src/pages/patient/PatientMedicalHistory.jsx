import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardDocumentListIcon, CalendarIcon, UserIcon,
  BeakerIcon, DocumentTextIcon, FunnelIcon, ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { doctorService, appointmentService } from '@/api/services'
import { EmptyState, Badge, Skeleton } from '@/components/common/index.jsx'
import { formatDate } from '@/utils/formatters'
import InputField from '@/components/common/FormFields.jsx'

const DEMO_RECORDS = [
  {
    id: 'REC-901',
    appointmentId: '101',
    visitDate: '2026-08-01',
    doctorName: 'Alexander Vance',
    hospitalName: 'MedConnect Central Hospital',
    diagnosis: 'Hypertensive Heart Disease & Arrhythmia',
    symptoms: 'Mild chest tightness, shortness of breath after exertion, fatigue',
    treatment: 'Prescribed Lisinopril 10mg once daily & Beta-blocker. Scheduled follow-up ECG in 30 days.',
    doctorNotes: 'BP on arrival: 142/90 mmHg. Patient advised low-sodium diet and daily cardiovascular exercise.',
  },
  {
    id: 'REC-902',
    appointmentId: '102',
    visitDate: '2026-07-28',
    doctorName: 'Sarah Jenkins',
    hospitalName: 'City Care Health Clinic',
    diagnosis: 'Acute Upper Respiratory Tract Infection',
    symptoms: 'Nasal congestion, sore throat, mild fever (100.4°F), dry cough',
    treatment: 'Amoxicillin 500mg (5-day course), Paracetamol 650mg PRN, Warm saline gargles.',
    doctorNotes: 'Lungs clear on auscultation. Throat shows mild pharyngeal erythema. Instructed patient to complete full antibiotic course.',
  },
  {
    id: 'REC-903',
    appointmentId: '103',
    visitDate: '2026-07-15',
    doctorName: 'Emily Davis',
    hospitalName: 'Apex Medical Center',
    diagnosis: 'Migraine with Aura',
    symptoms: 'Unilateral throbbing headache, photophobia, nausea',
    treatment: 'Sumatriptan 50mg PRN for acute attacks. Magnesium supplements.',
    doctorNotes: 'Neurological exam normal. Advised keeping a headache diary to identify trigger foods and stress factors.',
  },
]

export default function PatientMedicalHistory() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    let cancelled = false
    const fetchHistory = async () => {
      setLoading(true)
      try {
        let fetched = []
        const patientId = user?.id || user?._id

        // Fetch doctors list for name resolution (coerce all IDs to string to avoid type mismatches)
        const docRes = await doctorService.getAll().catch(() => ({ data: [] }))
        const docList = Array.isArray(docRes.data) ? docRes.data : []
        const docMap = {}
        docList.forEach(d => {
          if (d.id !== undefined && d.id !== null) {
            const name = d.doctorName || d.fullName || d.name || ''
            docMap[String(d.id)] = name
          }
        })

        if (patientId) {
          try {
            const res = await doctorService.getPatientHistory(patientId)
            const data = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : [])
            if (data.length > 0) {
              fetched = data.map(rec => {
                const did = rec.doctorId !== undefined ? String(rec.doctorId) : null
                let dName = (did && docMap[did]) ? docMap[did] : null
                if (!dName) {
                  // fallback to stored name if it looks real
                  const stored = rec.doctorName || ''
                  dName = /^Doctor[-\s]*\d+$/i.test(stored) ? null : stored
                }
                if (!dName && did) dName = `Doctor ${did}`
                if (dName && !dName.match(/^Dr\./i)) dName = `Dr. ${dName}`
                return {
                  ...rec,
                  doctorName: dName || 'Doctor'
                }
              })
            }
          } catch (err) {
            console.error('Error fetching medical history from backend:', err)
          }
        }
        if (!cancelled) {
          setRecords(fetched.length > 0 ? fetched : DEMO_RECORDS)
        }
      } catch (err) {
        if (!cancelled) setRecords(DEMO_RECORDS)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchHistory()
    return () => { cancelled = true }
  }, [user?.id, user?._id])

  const filteredRecords = records.filter(rec => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q || (
      rec.diagnosis?.toLowerCase().includes(q) ||
      rec.symptoms?.toLowerCase().includes(q) ||
      rec.treatment?.toLowerCase().includes(q) ||
      rec.doctorName?.toLowerCase().includes(q)
    )

    if (!matchesSearch) return false

    if (filterType === 'recent') {
      const recDate = new Date(rec.visitDate || rec.createdAt || new Date())
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return recDate >= thirtyDaysAgo
    }

    return true
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">My Medical Records</h1>
          <p className="page-sub">Comprehensive overview of your clinical consultations, diagnoses, and medical records.</p>
        </div>
        <Link to="/patient/appointments" className="btn btn-secondary btn-sm gap-2">
          <CalendarIcon className="w-4 h-4" />
          View Appointments
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:max-w-md">
          <InputField
            type="search"
            placeholder="Search by diagnosis, symptoms, or doctor name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <FunnelIcon className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Filter:</span>
          <select
            className="form-select text-xs py-1.5"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Records</option>
            <option value="recent">Recent (30 Days)</option>
          </select>
        </div>
      </div>

      {/* Record list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6 space-y-3 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="card p-10">
          <EmptyState
            icon={<ClipboardDocumentListIcon className="w-10 h-10" />}
            title="No medical records found"
            description={searchQuery ? 'No records matched your search query.' : 'You currently have no recorded medical consultations.'}
          />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRecords.map((record, index) => (
            <div key={record.id || index} className="card p-6 space-y-4 border-l-4 border-l-primary-500 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                    #{record.id || index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">
                      {record.diagnosis || 'Clinical Consultation'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Attending Physician: <span className="font-semibold text-slate-600 dark:text-slate-300">{record.doctorName || 'Doctor'}</span>
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Date: {formatDate(record.visitDate || record.createdAt || new Date())}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                {record.symptoms && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                    <span className="font-semibold text-slate-500 block mb-1">Reported Symptoms</span>
                    <p className="text-slate-700 dark:text-slate-200">{record.symptoms}</p>
                  </div>
                )}
                {record.treatment && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                    <span className="font-semibold text-slate-500 block mb-1">Treatment Plan</span>
                    <p className="text-slate-700 dark:text-slate-200">{record.treatment}</p>
                  </div>
                )}
              </div>

              {(record.doctorNotes || record.notes) && (
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                  <span className="font-semibold text-amber-900 dark:text-amber-300 block mb-1">Clinical Notes</span>
                  <p className="italic">{record.doctorNotes || record.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Appointment Ref: <span className="font-mono text-slate-600 dark:text-slate-300">APT-{record.appointmentId || '001'}</span></span>
                <Link to={`/patient/prescriptions`} className="text-primary-600 dark:text-primary-400 font-semibold hover:underline flex items-center gap-1">
                  <BeakerIcon className="w-4 h-4" /> View Prescriptions →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
