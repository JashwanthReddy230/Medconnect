import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  ClipboardDocumentListIcon, CheckCircleIcon,
  CheckBadgeIcon, CalendarIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { medicalRecordService } from '@/api/services'
import { Input, TextArea } from '@/components/common/FormFields.jsx'
import Button from '@/components/common/Button.jsx'
import toast from 'react-hot-toast'

export default function NewMedicalRecord() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const paramAppointmentId = searchParams.get('appointmentId') || ''
  const paramPatientId = searchParams.get('patientId') || ''
  const paramPatientName = searchParams.get('patientName') || ''
  const paramDoctorId = searchParams.get('doctorId') || user?.id || ''

  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      appointmentId: paramAppointmentId,
      patientId: paramPatientId,
      doctorId: paramDoctorId,
      visitDate: new Date().toISOString().split('T')[0],
      diagnosis: '',
      symptoms: '',
      treatment: '',
      doctorNotes: '',
    },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await medicalRecordService.create({
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        diagnosis: data.diagnosis,
        symptoms: data.symptoms,
        treatment: data.treatment,
        doctorNotes: data.doctorNotes,
        visitDate: data.visitDate,
      })
      toast.success('Medical record created successfully!')
      navigate('/doctor/appointments')
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create medical record.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Create Medical Record</h1>
        <p className="page-sub">Document the patient's diagnosis, symptoms, treatment, and clinical notes</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Context: IDs auto-populated */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Appointment & Patient Context
              {(paramAppointmentId || paramPatientId) && (
                <span className="badge-success text-[11px] gap-1">
                  <CheckBadgeIcon className="w-3.5 h-3.5" /> Auto-populated
                </span>
              )}
            </h2>
          </div>
          {paramPatientName && (
            <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold">
              Patient: {paramPatientName}
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Appointment ID"
              readOnly={!!paramAppointmentId}
              disabled={!!paramAppointmentId}
              error={errors.appointmentId?.message}
              {...register('appointmentId')}
            />
            <Input
              label="Patient ID"
              required
              readOnly={!!paramPatientId}
              disabled={!!paramPatientId}
              error={errors.patientId?.message}
              {...register('patientId', { required: 'Patient ID is required' })}
            />
            <Input
              label="Doctor ID"
              required
              readOnly={!!paramDoctorId}
              disabled={!!paramDoctorId}
              error={errors.doctorId?.message}
              {...register('doctorId', { required: 'Doctor ID is required' })}
            />
            <Input
              label="Visit Date"
              type="date"
              required
              error={errors.visitDate?.message}
              {...register('visitDate', { required: 'Visit date is required' })}
            />
          </div>
        </div>

        {/* Clinical Details */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-5 h-5 text-slate-400" />
            Clinical Details
          </h2>

          <TextArea
            label="Diagnosis"
            placeholder="e.g. Upper Respiratory Tract Infection, Hypertensive Heart Disease"
            required
            rows={2}
            error={errors.diagnosis?.message}
            {...register('diagnosis', { required: 'Diagnosis is required' })}
          />

          <TextArea
            label="Symptoms"
            placeholder="e.g. Persistent dry cough, mild fever, chest tightness"
            required
            rows={2}
            error={errors.symptoms?.message}
            {...register('symptoms', { required: 'Symptoms are required' })}
          />

          <TextArea
            label="Treatment"
            placeholder="e.g. Amoxicillin 500mg, Rest, Hydration, follow-up in 1 week"
            required
            rows={2}
            error={errors.treatment?.message}
            {...register('treatment', { required: 'Treatment is required' })}
          />
        </div>

        {/* Doctor Notes */}
        <div className="card p-5">
          <TextArea
            label="Doctor Notes (optional)"
            placeholder="Additional clinical observations, follow-up instructions, or internal remarks"
            rows={3}
            {...register('doctorNotes')}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <Button type="submit" loading={loading} className="flex-1" icon={<CheckCircleIcon className="w-4 h-4" />}>
            Save Medical Record
          </Button>
        </div>
      </form>
    </div>
  )
}
