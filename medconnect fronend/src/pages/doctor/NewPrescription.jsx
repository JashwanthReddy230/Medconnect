import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import {
  PlusIcon, TrashIcon, ArrowUpTrayIcon,
  DocumentTextIcon, CameraIcon, CheckCircleIcon,
  LockClosedIcon, CheckBadgeIcon,
} from '@heroicons/react/24/outline'
import { prescriptionService } from '@/api/services'
import { Input, Select, TextArea } from '@/components/common/FormFields.jsx'
import Button from '@/components/common/Button.jsx'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const FREQUENCY_OPTIONS = [
  { value: 'once_daily',    label: 'Once daily'         },
  { value: 'twice_daily',   label: 'Twice daily'        },
  { value: 'three_daily',   label: 'Three times daily'  },
  { value: 'four_daily',    label: 'Four times daily'   },
  { value: 'as_needed',     label: 'As needed'          },
  { value: 'every_8_hours', label: 'Every 8 hours'      },
  { value: 'bedtime',       label: 'At bedtime'         },
  { value: 'with_food',     label: 'With food'          },
  { value: 'before_food',   label: 'Before food'        },
]

const DURATION_OPTIONS = [
  { value: '3 days',    label: '3 days'    },
  { value: '5 days',    label: '5 days'    },
  { value: '7 days',    label: '1 week'    },
  { value: '14 days',   label: '2 weeks'   },
  { value: '30 days',   label: '1 month'   },
  { value: '60 days',   label: '2 months'  },
  { value: '90 days',   label: '3 months'  },
  { value: 'ongoing',   label: 'Ongoing'   },
]

export default function NewPrescription() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const paramPatientId = searchParams.get('patientId') || searchParams.get('patient') || ''
  const paramPatientName = searchParams.get('patientName') || ''
  const paramAppointmentId = searchParams.get('appointmentId') || searchParams.get('appointment') || ''

  const [mode,     setMode]     = useState('text') // 'text' | 'scan'
  const [loading,  setLoading]  = useState(false)
  const [preview,  setPreview]  = useState(null)
  const [scanFile, setScanFile] = useState(null)
  const fileRef = useRef(null)

  const { register, control, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      patientId: paramPatientId ? (paramPatientId.startsWith('PAT-') ? paramPatientId : `PAT-${paramPatientId}`) : '',
      appointmentId: paramAppointmentId ? (paramAppointmentId.startsWith('APT-') ? paramAppointmentId : `APT-${paramAppointmentId}`) : '',
      medications: [
        { name: '', dosage: '', frequency: 'once_daily', duration: '7 days', instructions: '' },
      ],
      notes: '',
    },
  })

  useEffect(() => {
    if (paramPatientId) {
      setValue('patientId', paramPatientId.startsWith('PAT-') ? paramPatientId : `PAT-${paramPatientId}`)
    }
    if (paramAppointmentId) {
      setValue('appointmentId', paramAppointmentId.startsWith('APT-') ? paramAppointmentId : `APT-${paramAppointmentId}`)
    }
  }, [paramPatientId, paramAppointmentId, setValue])

  const { fields, append, remove } = useFieldArray({ control, name: 'medications' })

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Only images and PDFs are allowed.')
      return
    }
    setScanFile(file)
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }

  const onSubmitText = async (data) => {
    setLoading(true)
    try {
      await prescriptionService.create({ ...data, type: 'text' })
      toast.success('Prescription created successfully!')
      navigate('/doctor/prescriptions')
    } catch {
      toast.error('Failed to create prescription.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmitScan = async () => {
    if (!scanFile) { toast.error('Please select a file to upload.'); return }
    const watch_pid = watch('patientId')
    if (!watch_pid) { toast.error('Please enter a patient ID.'); return }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('scan', scanFile)
      formData.append('patientId', watch_pid)
      await prescriptionService.uploadScan(formData)
      toast.success('Prescription scan uploaded!')
      navigate('/doctor/prescriptions')
    } catch {
      toast.error('Failed to upload scan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Create Prescription</h1>
        <p className="page-sub">Write a prescription manually or upload a scanned copy</p>
      </div>

      {/* Mode toggle */}
      <div className="card p-1.5 inline-flex gap-1">
        <button
          onClick={() => setMode('text')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            mode === 'text'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          )}
        >
          <DocumentTextIcon className="w-4 h-4" />
          Write manually
        </button>
        <button
          onClick={() => setMode('scan')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            mode === 'scan'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          )}
        >
          <CameraIcon className="w-4 h-4" />
          Upload scan
        </button>
      </div>

      {/* ── TEXT MODE ── */}
      {mode === 'text' && (
        <form onSubmit={handleSubmit(onSubmitText)} className="space-y-5" noValidate>
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Patient &amp; Appointment Context
                {(paramPatientId || paramAppointmentId) && (
                  <span className="badge-success text-[11px] gap-1">
                    <CheckBadgeIcon className="w-3.5 h-3.5" /> Auto-populated
                  </span>
                )}
              </h2>
            </div>
            {paramPatientName && (
              <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold">
                Patient Name: {paramPatientName}
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Patient ID"
                placeholder="PAT-000123"
                required
                readOnly={!!paramPatientId}
                disabled={!!paramPatientId}
                error={errors.patientId?.message}
                {...register('patientId', { required: 'Patient ID is required' })}
              />
              <Input
                label="Appointment ID"
                placeholder="APT-000456"
                readOnly={!!paramAppointmentId}
                disabled={!!paramAppointmentId}
                error={errors.appointmentId?.message}
                {...register('appointmentId')}
              />
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">Medications</h2>
              <button
                type="button"
                onClick={() => append({ name: '', dosage: '', frequency: 'once_daily', duration: '7 days', instructions: '' })}
                className="btn btn-secondary btn-sm gap-1"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add medication
              </button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="p-4 rounded-xl border border-border-light dark:border-border-dark space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Medication {index + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300"
                      aria-label="Remove medication"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <Input
                    label="Medicine name"
                    placeholder="e.g. Amoxicillin 500mg"
                    required
                    error={errors.medications?.[index]?.name?.message}
                    {...register(`medications.${index}.name`, { required: 'Required' })}
                  />
                  <Input
                    label="Dosage"
                    placeholder="e.g. 1 tablet, 5ml"
                    required
                    error={errors.medications?.[index]?.dosage?.message}
                    {...register(`medications.${index}.dosage`, { required: 'Required' })}
                  />
                  <Select
                    label="Frequency"
                    options={FREQUENCY_OPTIONS}
                    error={errors.medications?.[index]?.frequency?.message}
                    {...register(`medications.${index}.frequency`, { required: 'Required' })}
                  />
                  <Select
                    label="Duration"
                    options={DURATION_OPTIONS}
                    error={errors.medications?.[index]?.duration?.message}
                    {...register(`medications.${index}.duration`, { required: 'Required' })}
                  />
                </div>
                <Input
                  label="Special instructions (optional)"
                  placeholder="e.g. Take with plenty of water, avoid dairy"
                  {...register(`medications.${index}.instructions`)}
                />
              </div>
            ))}
          </div>

          <div className="card p-5">
            <TextArea
              label="Additional notes for patient"
              placeholder="e.g. Rest well, avoid strenuous activity. Follow up in 1 week if symptoms persist."
              rows={3}
              {...register('notes')}
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <Button type="submit" loading={loading} className="flex-1" icon={<CheckCircleIcon className="w-4 h-4" />}>
              Create prescription
            </Button>
          </div>
        </form>
      )}

      {/* ── SCAN MODE ── */}
      {mode === 'scan' && (
        <div className="space-y-5">
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Patient information</h2>
            <Input
              label="Patient ID"
              placeholder="PAT-000123"
              required
              {...register('patientId', { required: 'Patient ID is required' })}
            />
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Upload prescription scan</h2>
            <div
              onClick={() => fileRef.current?.click()}
              className={clsx(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                scanFile
                  ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-border-light dark:border-border-dark hover:border-primary-300 dark:hover:border-primary-700 hover:bg-muted-light dark:hover:bg-muted-dark'
              )}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {preview ? (
                <div className="space-y-3">
                  <img src={preview} alt="Scan preview" className="max-h-64 mx-auto rounded-lg object-contain" />
                  <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">{scanFile?.name}</p>
                  <p className="text-xs text-slate-400">Click to change file</p>
                </div>
              ) : scanFile ? (
                <div className="space-y-2">
                  <DocumentTextIcon className="w-10 h-10 text-primary-500 mx-auto" />
                  <p className="text-sm font-medium text-primary-600 dark:text-primary-400">{scanFile.name}</p>
                  <p className="text-xs text-slate-400">PDF uploaded · click to change</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <ArrowUpTrayIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Drop a file here, or click to browse
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Images (JPG, PNG) or PDF · max 10MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <Button
              loading={loading}
              onClick={onSubmitScan}
              disabled={!scanFile}
              className="flex-1"
              icon={<ArrowUpTrayIcon className="w-4 h-4" />}
            >
              Upload prescription
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
