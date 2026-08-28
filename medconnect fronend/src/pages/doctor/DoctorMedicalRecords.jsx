import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MagnifyingGlassIcon, ClipboardDocumentListIcon, LockClosedIcon,
  ShieldCheckIcon, FunnelIcon, UserIcon, EyeIcon, XMarkIcon, PlusIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { doctorService, patientService, medicalRecordService } from '@/api/services'
import { EmptyState, Badge } from '@/components/common/index.jsx'
import { formatDate } from '@/utils/formatters'
import InputField from '@/components/common/FormFields.jsx'
import Button from '@/components/common/Button.jsx'
import toast from 'react-hot-toast'
import {
  AccessRequestDialog, AccessPendingStatus, AccessApprovedBanner,
  AccessDeniedView, AuditLogViewer,
} from '@/components/doctor/AccessControlComponents.jsx'

// Mock records database covering both owned and unowned records
const MOCK_RECORDS = [
  {
    id: 'REC-101',
    patientId: 'PAT-8801',
    patientName: 'Sarah Jenkins',
    doctorId: 'DOC-55',
    doctorName: 'Dr. Current Doctor (You)',
    visitDate: '2026-08-01',
    symptoms: 'Persistent dry cough, mild fever (100.2°F)',
    diagnosis: 'Upper Respiratory Tract Infection',
    treatment: 'Amoxicillin 500mg, Rest, Hydration',
    doctorNotes: 'Patient responding well to antibiotics.',
  },
  {
    id: 'REC-102',
    patientId: 'PAT-8802',
    patientName: 'Michael Brown',
    doctorId: 'DOC-99', // Different doctor ID -> triggers permission flow
    doctorName: 'Dr. Alexander Vance',
    visitDate: '2026-07-28',
    symptoms: 'Acute chest pain radiating to left shoulder',
    diagnosis: 'Hypertensive Heart Disease',
    treatment: 'Lisinopril 10mg, Aspirin 81mg daily',
    doctorNotes: 'Confidential Cardiology Assessment.',
  },
  {
    id: 'REC-103',
    patientId: 'PAT-8803',
    patientName: 'Emily Davis',
    doctorId: 'DOC-55',
    doctorName: 'Dr. Current Doctor (You)',
    visitDate: '2026-07-15',
    symptoms: 'Severe migraine, nausea, photophobia',
    diagnosis: 'Migraine with Aura',
    treatment: 'Sumatriptan 50mg PRN',
    doctorNotes: 'Advised lifestyle trigger tracking.',
  },
]

export default function DoctorMedicalRecords() {
  const { user } = useAuth()
  const loggedInDoctorId = user?.id || 'DOC-55'
  const doctorName = user?.fullName || 'Logged In Doctor'

  const [records, setRecords] = useState(MOCK_RECORDS)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchField, setSearchField] = useState('all')

  useEffect(() => {
    let cancelled = false
    const fetchBackendRecords = async () => {
      try {
        const res = await doctorService.getPatientHistory(loggedInDoctorId)
        if (!cancelled && res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const backendRecs = res.data.map(r => ({
            id: `REC-${r.id}`,
            patientId: `PAT-${r.patientId}`,
            patientName: r.patientName || `Patient ${r.patientId}`,
            doctorId: String(r.doctorId),
            doctorName: r.doctorName || (String(r.doctorId) === String(loggedInDoctorId) ? 'Dr. Current Doctor (You)' : `Dr. ${r.doctorId}`),
            visitDate: r.visitDate || r.createdAt || new Date().toISOString().split('T')[0],
            symptoms: r.symptoms || 'None recorded',
            diagnosis: r.diagnosis || 'General Consultation',
            treatment: r.treatment || 'N/A',
            doctorNotes: r.doctorNotes || r.notes || '',
          }))
          setRecords([...backendRecs, ...MOCK_RECORDS])
        }
      } catch {
        /* fallback to MOCK_RECORDS */
      }
    }
    fetchBackendRecords()
    return () => { cancelled = true }
  }, [loggedInDoctorId])

  // Selected record for viewing
  const [selectedRecord, setSelectedRecord] = useState(null)
  
  // Permission state per record ID: 'none' | 'pending' | 'approved'
  const [permissions, setPermissions] = useState({})
  const [auditLogs, setAuditLogs] = useState([])
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)

  const handleOpenRecord = (record) => {
    setSelectedRecord(record)
  }

  const handleCloseRecord = () => {
    if (!selectedRecord) return
    const isOwner = selectedRecord.doctorId === loggedInDoctorId
    
    // Automatically revoke temporary granted access upon close
    if (!isOwner && permissions[selectedRecord.id] === 'approved') {
      setPermissions(prev => ({ ...prev, [selectedRecord.id]: 'none' }))
      setAuditLogs(prev => [
        { action: `Access Auto-Revoked (${selectedRecord.id})`, doctorName, timestamp: new Date() },
        ...prev
      ])
      toast.success(`Temporary access to record ${selectedRecord.id} automatically revoked upon close.`)
    }
    setSelectedRecord(null)
  }

  const handleRequestAccessSubmit = async ({ reason, urgency }) => {
    if (!selectedRecord) return
    const recordId = selectedRecord.id
    setPermissions(prev => ({ ...prev, [recordId]: 'pending' }))
    setAuditLogs(prev => [
      { action: `Access Requested (${recordId} - ${urgency})`, doctorName, timestamp: new Date() },
      ...prev
    ])
    toast.success('Access request submitted for Admin authorization!')
  }

  const handleSimulateApprove = (recordId) => {
    setPermissions(prev => ({ ...prev, [recordId]: 'approved' }))
    setAuditLogs(prev => [
      { action: `Access Approved by Admin (${recordId})`, doctorName, timestamp: new Date() },
      ...prev
    ])
    toast.success(`Access GRANTED for record ${recordId}!`)
  }

  const handleManualRevoke = (recordId) => {
    setPermissions(prev => ({ ...prev, [recordId]: 'none' }))
    setAuditLogs(prev => [
      { action: `Access Revoked Manually (${recordId})`, doctorName, timestamp: new Date() },
      ...prev
    ])
    toast.error(`Access revoked for ${recordId}.`)
  }

  // Filter records based on search criteria
  const filteredRecords = records.filter(r => {
    const q = searchQuery.toLowerCase()
    if (!q) return true
    if (searchField === 'name') return r.patientName.toLowerCase().includes(q)
    if (searchField === 'id') return r.patientId.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
    if (searchField === 'symptoms') return r.symptoms.toLowerCase().includes(q)
    if (searchField === 'diagnosis') return r.diagnosis.toLowerCase().includes(q)
    return (
      r.patientName.toLowerCase().includes(q) ||
      r.patientId.toLowerCase().includes(q) ||
      r.symptoms.toLowerCase().includes(q) ||
      r.diagnosis.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Medical Records Search</h1>
          <p className="page-sub">Access patient medical records with strict HIPAA role-based access control.</p>
        </div>
        <Link to="/doctor/records/new" className="btn btn-primary btn-sm gap-2">
          <PlusIcon className="w-4 h-4" />
          New Medical Record
        </Link>
      </div>

      {/* Search Bar */}
      <div className="card p-5 space-y-4">
        <div className="grid sm:grid-cols-4 gap-4">
          <div className="sm:col-span-3">
            <InputField
              type="search"
              placeholder="Search medical records by patient name, ID, symptoms, or diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select
              className="form-select text-xs w-full h-[42px]"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
            >
              <option value="all">Search All Fields</option>
              <option value="name">Patient Name</option>
              <option value="id">Patient / Record ID</option>
              <option value="symptoms">Symptoms</option>
              <option value="diagnosis">Diagnosis</option>
            </select>
          </div>
        </div>
      </div>

      {/* Record directory list */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Available Medical Records ({filteredRecords.length})</h2>

          {filteredRecords.length === 0 ? (
            <div className="card p-8">
              <EmptyState
                icon={<ClipboardDocumentListIcon className="w-8 h-8" />}
                title="No matching records found"
                description="Try refining your search query or filter settings."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((rec) => {
                const isOwner = rec.doctorId === loggedInDoctorId
                const permState = permissions[rec.id] || 'none'
                const isSelected = selectedRecord?.id === rec.id

                return (
                  <div
                    key={rec.id}
                    onClick={() => handleOpenRecord(rec)}
                    className={`card p-4 transition-all cursor-pointer border-2 ${
                      isSelected
                        ? 'border-primary-500 shadow-md'
                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isOwner
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {isOwner ? <ShieldCheckIcon className="w-5 h-5" /> : <LockClosedIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{rec.patientName}</h3>
                            <span className="text-xs font-mono text-slate-400">({rec.patientId})</span>
                          </div>
                          <p className="text-xs text-slate-500">Diagnosis: <span className="font-semibold text-slate-700 dark:text-slate-300">{rec.diagnosis}</span></p>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        {isOwner ? (
                          <span className="badge-success text-[10px]">Your Record</span>
                        ) : permState === 'approved' ? (
                          <span className="badge-info text-[10px]">Access Granted</span>
                        ) : permState === 'pending' ? (
                          <span className="badge-warning text-[10px]">Access Pending</span>
                        ) : (
                          <span className="badge-danger text-[10px]">Restricted</span>
                        )}
                        <p className="text-[11px] text-slate-400">{rec.visitDate}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Selected Record Viewer / Permission Inspector */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Record Inspection Detail</h2>

          {!selectedRecord ? (
            <div className="card p-8 text-center text-xs text-slate-400 space-y-2">
              <EyeIcon className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p>Select a medical record from the list to inspect details or request permission.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Check Ownership / Permissions */}
              {selectedRecord.doctorId === loggedInDoctorId ? (
                // ── Direct View Granted for Owner ──
                <div className="card p-5 space-y-4 border-t-4 border-t-emerald-500">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                    <div>
                      <span className="badge-success text-[10px] mb-1 inline-block">Direct Attending Doctor Access</span>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100">{selectedRecord.patientName}</h3>
                    </div>
                    <button onClick={handleCloseRecord} className="text-slate-400 hover:text-slate-600">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Diagnosis:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{selectedRecord.diagnosis}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Reported Symptoms:</span>
                      <p className="text-slate-600 dark:text-slate-300">{selectedRecord.symptoms}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Prescribed Treatment:</span>
                      <p className="text-slate-600 dark:text-slate-300">{selectedRecord.treatment}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                      <span className="text-slate-400 font-medium block">Doctor Clinical Notes:</span>
                      <p className="italic text-slate-700 dark:text-slate-200">{selectedRecord.doctorNotes}</p>
                    </div>
                  </div>
                </div>
              ) : permissions[selectedRecord.id] === 'approved' ? (
                // ── Approved Access View ──
                <div className="space-y-4">
                  <AccessApprovedBanner
                    approvedAt={new Date()}
                    onRevoke={() => handleManualRevoke(selectedRecord.id)}
                  />

                  <div className="card p-5 space-y-4 border-t-4 border-t-emerald-500">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">{selectedRecord.patientName}</h3>
                        <p className="text-xs text-slate-400">Created by {selectedRecord.doctorName}</p>
                      </div>
                      <button onClick={handleCloseRecord} className="text-slate-400 hover:text-slate-600">
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium block">Diagnosis:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{selectedRecord.diagnosis}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Symptoms:</span>
                        <p className="text-slate-600 dark:text-slate-300">{selectedRecord.symptoms}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Treatment:</span>
                        <p className="text-slate-600 dark:text-slate-300">{selectedRecord.treatment}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                        <span className="text-slate-400 font-medium block">Doctor Notes:</span>
                        <p className="italic text-slate-700 dark:text-slate-200">{selectedRecord.doctorNotes}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : permissions[selectedRecord.id] === 'pending' ? (
                // ── Pending Access View ──
                <AccessPendingStatus
                  requestDate={new Date()}
                  onSimulateApprove={() => handleSimulateApprove(selectedRecord.id)}
                />
              ) : (
                // ── Access Denied View ──
                <AccessDeniedView
                  recordDoctorName={selectedRecord.doctorName}
                  onRequestClick={() => setIsRequestModalOpen(true)}
                />
              )}

              {/* Security Audit Log */}
              <AuditLogViewer auditLogs={auditLogs} />
            </div>
          )}
        </div>
      </div>

      {/* Access Request Dialog */}
      <AccessRequestDialog
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onRequestAccess={handleRequestAccessSubmit}
        patientName={selectedRecord?.patientName}
        recordId={selectedRecord?.id}
        doctorName={doctorName}
      />
    </div>
  )
}
