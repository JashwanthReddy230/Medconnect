import { useState } from 'react'
import {
  LockClosedIcon, KeyIcon, ClockIcon, CheckCircleIcon,
  XCircleIcon, ShieldCheckIcon, DocumentCheckIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import Button from '@/components/common/Button.jsx'
import { formatDate } from '@/utils/formatters'

// ── Access Request Dialog ──────────────────────────────────────────────────
export function AccessRequestDialog({ isOpen, onClose, onRequestAccess, patientName, recordId, doctorName }) {
  const [reason, setReason] = useState('')
  const [urgency, setUrgency] = useState('Standard')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    await onRequestAccess({ reason, urgency })
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4 text-amber-600 dark:text-amber-400">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
            <KeyIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Request Medical Record Access</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">HIPAA Restricted Data Access Request</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 mb-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Patient:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{patientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Record ID:</span>
            <span className="font-mono text-primary-600 dark:text-primary-400">{recordId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Requesting Practitioner:</span>
            <span>Dr. {doctorName || 'Logged In Doctor'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Clinical Reason for Access Request <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              className="form-input text-xs w-full"
              placeholder="Provide clinical justification (e.g., Emergency consultation, Second opinion, Cross-department treatment...)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Urgency Level</label>
            <div className="grid grid-cols-3 gap-2">
              {['Standard', 'Urgent', 'Emergency'].map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setUrgency(lvl)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    urgency === lvl
                      ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>All access requests are audited and submitted for Administrator approval.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Submit Access Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Access Pending Status ──────────────────────────────────────────────────
export function AccessPendingStatus({ requestDate, onSimulateApprove }) {
  return (
    <div className="card p-6 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 animate-pulse">
            <ClockIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 dark:text-amber-200">Access Request Pending Approval</h4>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Submitted on {formatDate(requestDate || new Date())}. Awaiting Admin authorization.
            </p>
          </div>
        </div>

        {onSimulateApprove && (
          <Button variant="secondary" size="xs" onClick={onSimulateApprove} className="flex-shrink-0">
            Simulate Admin Approval
          </Button>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 pl-13">
        You will receive a notification as soon as access is granted. Temporary access automatically expires when you finish review.
      </p>
    </div>
  )
}

// ── Access Approved Banner ─────────────────────────────────────────────────
export function AccessApprovedBanner({ approvedAt, onRevoke }) {
  return (
    <div className="card p-4 border-l-4 border-l-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <ShieldCheckIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200">Temporary Medical Record Access Active</span>
            <span className="badge-success text-[10px]">Authorized by Admin</span>
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            Access Granted: {formatDate(approvedAt || new Date())}. Record access will automatically revoke when closed.
          </p>
        </div>
      </div>

      <Button variant="danger" size="xs" onClick={onRevoke} className="gap-1">
        <XCircleIcon className="w-3.5 h-3.5" />
        Close & Revoke Access
      </Button>
    </div>
  )
}

// ── Access Denied View ─────────────────────────────────────────────────────
export function AccessDeniedView({ onRequestClick, recordDoctorName }) {
  return (
    <div className="card p-10 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 border-slate-200 dark:border-slate-700">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-500">
        <LockClosedIcon className="w-8 h-8" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Restricted Medical Record</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          This record was created by <span className="font-semibold text-slate-700 dark:text-slate-300">Dr. {recordDoctorName || 'Another Physician'}</span>. Under health privacy policy, access is restricted to the primary attending doctor unless explicit admin approval is granted.
        </p>
      </div>

      <Button variant="primary" onClick={onRequestClick} className="gap-2">
        <KeyIcon className="w-4 h-4" />
        Request Admin Access Permission
      </Button>
    </div>
  )
}

// ── Audit Log Viewer ──────────────────────────────────────────────────────
export function AuditLogViewer({ auditLogs = [] }) {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
        <DocumentCheckIcon className="w-4 h-4 text-slate-400" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Record Security Audit Trail</h4>
      </div>

      {auditLogs.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No access audit events recorded yet.</p>
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto text-xs">
          {auditLogs.map((log, index) => (
            <div key={index} className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  log.action.includes('Approved') ? 'bg-emerald-500' :
                  log.action.includes('Revoked') ? 'bg-rose-500' : 'bg-amber-500'
                }`} />
                <span className="font-semibold text-slate-800 dark:text-slate-200">{log.action}</span>
                <span className="text-slate-400">by Dr. {log.doctorName || 'User'}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{formatDate(log.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
