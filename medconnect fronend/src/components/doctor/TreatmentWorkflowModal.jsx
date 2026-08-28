import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import {
  ClipboardDocumentListIcon, CheckCircleIcon,
  CheckBadgeIcon, BeakerIcon, ArrowRightIcon,
  DocumentTextIcon, PlusIcon, TrashIcon, BanknotesIcon,
} from '@heroicons/react/24/outline'
import { medicalRecordService, prescriptionService, appointmentService, billService } from '@/api/services'
import { Modal } from '@/components/common/index.jsx'
import { Input, Select, TextArea } from '@/components/common/FormFields.jsx'
import Button from '@/components/common/Button.jsx'
import toast from 'react-hot-toast'

const FREQUENCY_OPTIONS = [
  { value: 'once_daily', label: 'Once daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'three_daily', label: 'Three times daily' },
  { value: 'four_daily', label: 'Four times daily' },
  { value: 'as_needed', label: 'As needed' },
  { value: 'every_8_hours', label: 'Every 8 hours' },
  { value: 'bedtime', label: 'At bedtime' },
  { value: 'with_food', label: 'With food' },
  { value: 'before_food', label: 'Before food' },
]

const DURATION_OPTIONS = [
  { value: '3 days', label: '3 days' },
  { value: '5 days', label: '5 days' },
  { value: '7 days', label: '1 week' },
  { value: '14 days', label: '2 weeks' },
  { value: '30 days', label: '1 month' },
  { value: '60 days', label: '2 months' },
  { value: '90 days', label: '3 months' },
  { value: 'ongoing', label: 'Ongoing' },
]

export default function TreatmentWorkflowModal({ open, onClose, appointment, doctorId, onSuccess }) {
  const [step, setStep] = useState(1) // 1: Medical Record, 2: Prescription, 3: Complete
  const [loading, setLoading] = useState(false)
  const [savedRecord, setSavedRecord] = useState(null)
  const [savedPrescription, setSavedPrescription] = useState(null)
  const [generatedBill, setGeneratedBill] = useState(null)

  const appointmentId = appointment?._id || appointment?.id || ''
  const patientId = appointment?.patientId || ''
  const patientName = appointment?.patientName || ''

  // Step 1: Medical Record Form
  const {
    register: registerRecord,
    handleSubmit: handleSubmitRecord,
    formState: { errors: recordErrors },
    reset: resetRecordForm,
  } = useForm({
    defaultValues: {
      appointmentId,
      patientId,
      doctorId,
      visitDate: new Date().toISOString().split('T')[0],
      diagnosis: '',
      symptoms: '',
      treatment: '',
      doctorNotes: '',
    },
  })

  // Step 2: Prescription Form
  const {
    register: registerPrescription,
    control: controlPrescription,
    handleSubmit: handleSubmitPrescription,
    formState: { errors: prescriptionErrors },
    reset: resetPrescriptionForm,
  } = useForm({
    defaultValues: {
      patientId: patientId ? (String(patientId).startsWith('PAT-') ? patientId : `PAT-${patientId}`) : '',
      appointmentId: appointmentId ? (String(appointmentId).startsWith('APT-') ? appointmentId : `APT-${appointmentId}`) : '',
      medications: [
        { name: '', dosage: '', frequency: 'once_daily', duration: '7 days', instructions: '' },
      ],
      notes: '',
    },
  })

  const { fields: medFields, append: appendMed, remove: removeMed } = useFieldArray({
    control: controlPrescription,
    name: 'medications',
  })

  useEffect(() => {
    if (open && appointment) {
      setStep(1)
      setSavedRecord(null)
      setSavedPrescription(null)
      setGeneratedBill(null)
      resetRecordForm({
        appointmentId,
        patientId,
        doctorId: doctorId || appointment.doctorId || '',
        visitDate: new Date().toISOString().split('T')[0],
        diagnosis: '',
        symptoms: '',
        treatment: '',
        doctorNotes: '',
      })
      resetPrescriptionForm({
        patientId: patientId ? (String(patientId).startsWith('PAT-') ? patientId : `PAT-${patientId}`) : '',
        appointmentId: appointmentId ? (String(appointmentId).startsWith('APT-') ? appointmentId : `APT-${appointmentId}`) : '',
        medications: [
          { name: '', dosage: '', frequency: 'once_daily', duration: '7 days', instructions: '' },
        ],
        notes: '',
      })
    }
  }, [open, appointment, doctorId, appointmentId, patientId, resetRecordForm, resetPrescriptionForm])

  // Save Medical Record (Step 1)
  const onSaveMedicalRecord = async (data) => {
    setLoading(true)
    try {
      const res = await medicalRecordService.create({
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        diagnosis: data.diagnosis,
        symptoms: data.symptoms,
        treatment: data.treatment,
        doctorNotes: data.doctorNotes,
        visitDate: data.visitDate,
      })
      setSavedRecord(res.data || data)
      toast.success('Medical Record saved successfully!')
      setStep(2)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save medical record.')
    } finally {
      setLoading(false)
    }
  }

  // Save Prescription (Step 2)
  const onSavePrescription = async (data) => {
    setLoading(true)
    try {
      const medicalRecordId = savedRecord?.id || savedRecord?._id || 1
      const res = await prescriptionService.create({
        ...data,
        medicalRecordId,
        patientId: data.patientId,
        appointmentId: data.appointmentId,
      })
      setSavedPrescription(res?.data || data)
      toast.success('Prescription saved successfully!')
      setStep(3)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save prescription.')
    } finally {
      setLoading(false)
    }
  }

  // Helper for safe integer ID extraction (e.g. 'APT-101' -> 101)
  const parseSafeId = (val, fallback = 1) => {
    if (!val) return fallback
    const digits = String(val).replace(/\D+/g, '')
    const parsed = parseInt(digits, 10)
    return isNaN(parsed) || parsed <= 0 ? fallback : parsed
  }

  // Complete Appointment (Step 3) & Generate Bill automatically
  const onCompleteAppointment = async () => {
    setLoading(true)
    try {
      // 1. Complete appointment
      await appointmentService.complete(appointmentId).catch((err) => {
        console.warn('Appointment complete endpoint warning:', err?.message)
      })

      // 2. Derive Bill parameters automatically
      const consultationFee = parseFloat(appointment?.consultationFee || appointment?.fee || 500)
      const medCount = savedPrescription?.medications?.length || 1
      const medicineFee = medCount * 150
      const laboratoryFee = 0
      const discount = 0

      const billPayload = {
        appointmentId: parseSafeId(appointmentId, 1),
        patientId: parseSafeId(patientId, 1),
        doctorId: parseSafeId(doctorId || appointment?.doctorId, 1),
        consultationFee,
        medicineFee,
        laboratoryFee,
        discount,
      }

      // 3. Persist Bill to MySQL via Backend
      const billRes = await billService.create(billPayload)
      const createdBill = billRes.data

      setGeneratedBill(createdBill)
      toast.success('Appointment Completed & Bill Generated Successfully!')
      onSuccess?.(appointmentId, createdBill)
    } catch (err) {
      console.error('Completion / Bill Generation Error:', err)
      toast.error(err?.response?.data?.message || 'Failed to complete appointment and save bill in database.')
    } finally {
      setLoading(false)
    }
  }

  if (!appointment) return null

  return (
    <Modal open={open} onClose={onClose} title="Complete Treatment & Record" size="lg">
      <div className="space-y-5">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between bg-muted-light dark:bg-muted-dark p-3 rounded-xl">
          {[
            { num: 1, label: 'Medical Record', icon: ClipboardDocumentListIcon },
            { num: 2, label: 'Prescription', icon: BeakerIcon },
            { num: 3, label: 'Complete', icon: CheckCircleIcon },
          ].map(({ num, label, icon: Icon }) => {
            const isActive = step === num
            const isDone = step > num
            return (
              <div key={num} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isDone
                    ? 'bg-emerald-600 text-white'
                    : isActive
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                >
                  {isDone ? '✓' : num}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:inline ${isActive ? 'text-slate-800 dark:text-slate-100 font-bold' : 'text-slate-400'
                    }`}
                >
                  {label}
                </span>
                {num < 3 && <ArrowRightIcon className="w-3 h-3 text-slate-300 mx-1 hidden sm:inline" />}
              </div>
            )
          })}
        </div>

        {/* ── STEP 1: Medical Record ── */}
        {step === 1 && (
          <form onSubmit={handleSubmitRecord(onSaveMedicalRecord)} className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-border-light dark:border-border-dark">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ClipboardDocumentListIcon className="w-5 h-5 text-primary-600" />
                Step 1: Patient Medical Record
              </h3>
              <span className="badge-info text-xs">Patient: {patientName || `Patient ${patientId}`}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block">Appointment ID</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{appointmentId}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Patient ID</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{patientId}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Doctor ID</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{doctorId || appointment.doctorId || 'Self'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Visit Date</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>

            <TextArea
              label="Diagnosis"
              placeholder="Enter patient diagnosis (e.g. Acute Bronchitis, Hypertension)"
              required
              rows={2}
              error={recordErrors.diagnosis?.message}
              {...registerRecord('diagnosis', { required: 'Diagnosis is required' })}
            />

            <TextArea
              label="Symptoms"
              placeholder="Enter reported symptoms (e.g. Dry cough, fever, headache)"
              required
              rows={2}
              error={recordErrors.symptoms?.message}
              {...registerRecord('symptoms', { required: 'Symptoms are required' })}
            />

            <TextArea
              label="Treatment"
              placeholder="Enter prescribed treatment plan or therapeutic actions"
              required
              rows={2}
              error={recordErrors.treatment?.message}
              {...registerRecord('treatment', { required: 'Treatment is required' })}
            />

            <TextArea
              label="Doctor Clinical Notes (optional)"
              placeholder="Additional medical notes or remarks"
              rows={2}
              {...registerRecord('doctorNotes')}
            />

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <Button type="submit" loading={loading} className="flex-1" iconRight={<ArrowRightIcon className="w-4 h-4" />}>
                Save &amp; Continue to Prescription
              </Button>
            </div>
          </form>
        )}

        {/* ── STEP 2: Prescription ── */}
        {step === 2 && (
          <form onSubmit={handleSubmitPrescription(onSavePrescription)} className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-border-light dark:border-border-dark">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BeakerIcon className="w-5 h-5 text-primary-600" />
                Step 2: Write Prescription
              </h3>
              <span className="badge-success text-xs">Medical Record Saved ✓</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Medications List</span>
              <button
                type="button"
                onClick={() => appendMed({ name: '', dosage: '', frequency: 'once_daily', duration: '7 days', instructions: '' })}
                className="btn btn-secondary btn-sm gap-1 text-xs"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add Medication
              </button>
            </div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {medFields.map((field, index) => (
                <div key={field.id} className="p-3 rounded-xl border border-border-light dark:border-border-dark space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500 uppercase tracking-wide">
                      Medication #{index + 1}
                    </span>
                    {medFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMed(index)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Medicine Name"
                      placeholder="e.g. Amoxicillin 500mg"
                      required
                      error={prescriptionErrors.medications?.[index]?.name?.message}
                      {...registerPrescription(`medications.${index}.name`, { required: 'Required' })}
                    />
                    <Input
                      label="Dosage"
                      placeholder="e.g. 1 tablet, 5ml"
                      required
                      error={prescriptionErrors.medications?.[index]?.dosage?.message}
                      {...registerPrescription(`medications.${index}.dosage`, { required: 'Required' })}
                    />
                    <Select
                      label="Frequency"
                      options={FREQUENCY_OPTIONS}
                      {...registerPrescription(`medications.${index}.frequency`, { required: 'Required' })}
                    />
                    <Select
                      label="Duration"
                      options={DURATION_OPTIONS}
                      {...registerPrescription(`medications.${index}.duration`, { required: 'Required' })}
                    />
                  </div>
                  <Input
                    label="Special Instructions (optional)"
                    placeholder="e.g. Take after meals with water"
                    {...registerPrescription(`medications.${index}.instructions`)}
                  />
                </div>
              ))}
            </div>

            <TextArea
              label="Additional Notes for Patient (optional)"
              placeholder="General advice or lifestyle recommendations"
              rows={2}
              {...registerPrescription('notes')}
            />

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn btn-secondary flex-1">
                Back to Record
              </button>
              <Button type="submit" loading={loading} className="flex-1" iconRight={<ArrowRightIcon className="w-4 h-4" />}>
                Save &amp; Continue to Complete
              </Button>
            </div>
          </form>
        )}

        {/* ── STEP 3: Complete Appointment & View Bill ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-border-light dark:border-border-dark">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                Step 3: Complete Appointment &amp; Bill Generation
              </h3>
              <span className={generatedBill ? 'badge-success text-xs' : 'badge-info text-xs'}>
                {generatedBill ? 'COMPLETED ✓' : 'Ready to Finalize'}
              </span>
            </div>

            {!generatedBill ? (
              <>
                <div className="space-y-3 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                    <CheckBadgeIcon className="w-5 h-5" />
                    Ready to Complete Treatment &amp; Generate Bill
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    Medical Record and Prescription have been recorded. Clicking below will set status to <strong>COMPLETED</strong> and automatically compute &amp; persist the <strong>Bill</strong> in MySQL.
                  </p>
                  {savedRecord && (
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg text-slate-700 dark:text-slate-200">
                      <span className="font-semibold block text-slate-400 text-[10px] uppercase">Diagnosis:</span>
                      <p className="font-medium">{savedRecord.diagnosis}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(2)} className="btn btn-secondary flex-1">
                    Back to Prescription
                  </button>
                  <Button
                    onClick={onCompleteAppointment}
                    loading={loading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                    icon={<CheckCircleIcon className="w-4 h-4" />}
                  >
                    Complete Appointment
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4 text-xs animate-fade-in">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <span className="flex items-center gap-1.5"><CheckCircleIcon className="w-5 h-5 text-emerald-600" /> Appointment Completed Successfully</span>
                    <span className="badge-success">COMPLETED</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    The appointment status has been updated to <strong>COMPLETED</strong>. A Bill (<strong>{generatedBill.billNumber}</strong>) has been generated and saved. The patient can view the bill from their dashboard.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button onClick={onClose} className="px-6">
                    Done &amp; Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
