import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import {
  UserIcon, HeartIcon, PhoneIcon, PencilSquareIcon,
  CheckCircleIcon, CameraIcon, PlusIcon, TrashIcon,
} from '@heroicons/react/24/outline'
import { patientService } from '@/api/services'
import { useAuth } from '@/context/AuthContext'
import { Input, Select, TextArea } from '@/components/common/FormFields.jsx'
import { Avatar, Modal } from '@/components/common/index.jsx'
import Button from '@/components/common/Button.jsx'
import { validators } from '@/utils/validators'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(v => ({ value: v, label: v }))
const GENDERS      = [{ value:'male', label:'Male' }, { value:'female', label:'Female' }, { value:'other', label:'Other' }]

// Build the initial profile from the authenticated user's registration data.
// Medical history fields start empty — the user fills them in over time.
function buildInitialProfile(user) {
  return {
    firstName:  user?.firstName || user?.fullName?.split(' ')[0]  || '',
    lastName:   user?.lastName  || user?.fullName?.split(' ').slice(1).join(' ') || '',
    email:      user?.email     || '',
    phone:      user?.phone     || user?.mobile || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender:     user?.gender    || '',
    bloodGroup: user?.bloodGroup || '',
    address:    user?.address   || '',
    allergies:          [],
    chronicConditions:  [],
    pastSurgeries:      [],
    currentMedications: [],
    emergencyContact: { name: '', relation: '', phone: '' },
  }
}

const TABS = ['Personal info', 'Medical history', 'Emergency contact']

function SectionCard({ title, icon: Icon, children, action }) {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function TagList({ items, onRemove, editable }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
          {item}
          {editable && (
            <button onClick={() => onRemove(i)} className="text-slate-400 hover:text-red-500 transition-colors">
              <TrashIcon className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}
      {items.length === 0 && <span className="text-xs text-slate-400 italic">None recorded</span>}
    </div>
  )
}

export default function PatientProfile() {
  const { user, updateUser } = useAuth()
  const [activeTab,  setActiveTab]  = useState(0)
  const [editing,    setEditing]    = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [profile,    setProfile]    = useState(() => buildInitialProfile(user))
  const [addModal,   setAddModal]   = useState(null) // 'allergy' | 'condition' | 'surgery' | 'medication'
  const [newItem,    setNewItem]    = useState('')
  const fileRef = useRef(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: profile })

  useEffect(() => {
    if (user?.id) {
      patientService.getProfile(user.id)
        .then((res) => {
          const fetched = res.data
          // Backend PatientResponse has fullName (not firstName/lastName)
          const nameParts = (fetched.fullName || '').trim().split(/\s+/)
          const firstName = fetched.firstName || nameParts[0] || user?.fullName?.split(' ')[0] || ''
          const lastName  = fetched.lastName  || nameParts.slice(1).join(' ') || user?.fullName?.split(' ').slice(1).join(' ') || ''

          let emergencyContactObj = { name: '', relation: '', phone: '' }
          if (fetched.emergencyContact && typeof fetched.emergencyContact === 'string') {
            const namePart     = fetched.emergencyContact.split(' (')[0] || ''
            const relationMatch = fetched.emergencyContact.match(/\(([^)]+)\)/)
            const relationPart = relationMatch ? relationMatch[1] : ''
            const phonePart    = fetched.emergencyContact.split(' - ')[1] || ''
            emergencyContactObj = { name: namePart, relation: relationPart, phone: phonePart }
          } else if (fetched.emergencyContact && typeof fetched.emergencyContact === 'object') {
            emergencyContactObj = fetched.emergencyContact
          }

          const profileData = {
            firstName,
            lastName,
            email:       fetched.email       || user?.email || '',
            phone:       fetched.mobile       || fetched.phone || user?.phone || '',
            dateOfBirth: fetched.dateOfBirth  || '',
            gender:      fetched.gender       || '',
            bloodGroup:  fetched.bloodGroup   || '',
            address:     fetched.address      || '',
            allergies:          fetched.allergies          || [],
            chronicConditions:  fetched.chronicConditions  || [],
            pastSurgeries:      fetched.pastSurgeries      || [],
            currentMedications: fetched.currentMedications || [],
            emergencyContact:   emergencyContactObj,
          }
          setProfile(profileData)
          reset(profileData)
        })
        .catch((err) => {
          // Fallback to user context data if backend not found
          console.warn('Patient profile not found, using registration data:', err?.response?.status)
        })
    }
  }, [user?.id, reset])

  const onSavePersonal = async (data) => {
    setLoading(true)
    try {
      await patientService.updateProfile(data)
      setProfile((p) => ({ ...p, ...data }))
      updateUser({ fullName: `${data.firstName} ${data.lastName}` })
      toast.success('Profile updated!')
      setEditing(false)
    } catch {
      toast.error('Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  const addItem = (field) => {
    if (!newItem.trim()) return
    setProfile((p) => ({ ...p, [field]: [...(p[field] || []), newItem.trim()] }))
    setNewItem('')
    setAddModal(null)
    toast.success('Added successfully.')
  }

  const removeItem = (field, index) => {
    setProfile((p) => ({ ...p, [field]: p[field].filter((_, i) => i !== index) }))
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-sub">Manage your personal and health information</p>
      </div>

      {/* Profile card */}
      <div className="card p-5 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
        <div className="relative flex-shrink-0">
          <Avatar name={`${profile.firstName} ${profile.lastName}`} src={user?.profilePhoto} size="2xl" />
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md hover:bg-primary-700 transition-colors"
          >
            <CameraIcon className="w-4 h-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files[0]
              if (!file) return
              const fd = new FormData()
              fd.append('photo', file)
              try {
                await patientService.uploadProfilePhoto(fd)
                const reader = new FileReader()
                reader.onloadend = () => {
                  updateUser({ profilePhoto: reader.result })
                }
                reader.readAsDataURL(file)
                toast.success('Profile photo updated!')
              } catch {
                toast.error('Failed to upload photo.')
              }
            }}
          />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {profile.firstName} {profile.lastName}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{profile.email}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
            {profile.patientCode && <span className="badge-info font-mono">{profile.patientCode}</span>}
            <span className="badge-primary">{profile.bloodGroup || 'O+'}</span>
            <span className="badge-neutral capitalize">{profile.gender || 'Patient'}</span>
            <span className="badge-success">{profile.status || 'ACTIVE'}</span>
          </div>
        </div>
        <button
          onClick={() => setEditing((e) => !e)}
          className="btn btn-secondary btn-sm gap-2 self-start"
        >
          <PencilSquareIcon className="w-4 h-4" />
          {editing ? 'Cancel' : 'Edit profile'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted-light dark:bg-muted-dark rounded-xl p-1 overflow-x-auto no-scrollbar">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={clsx(
              'flex-1 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              activeTab === i
                ? 'bg-white dark:bg-card-dark shadow-sm text-primary-600 dark:text-primary-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Personal Info ── */}
      {activeTab === 0 && (
        <form onSubmit={handleSubmit(onSavePersonal)} className="space-y-4" noValidate>
          <SectionCard title="Personal information" icon={UserIcon}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="First name" required disabled={!editing} error={errors.firstName?.message}
                {...register('firstName', validators.name)} />
              <Input label="Last name" required disabled={!editing} error={errors.lastName?.message}
                {...register('lastName', validators.name)} />
              <Input label="Email address" type="email" disabled={!editing} error={errors.email?.message}
                {...register('email', validators.email)} />
              <Input label="Phone number" type="tel" disabled={!editing} error={errors.phone?.message}
                {...register('phone', validators.phone)} />
              <Input label="Date of birth" type="date" disabled={!editing}
                {...register('dateOfBirth')} />
              <Select label="Gender" options={GENDERS} placeholder="Select gender" disabled={!editing}
                {...register('gender')} />
              <Select label="Blood group" options={BLOOD_GROUPS} placeholder="Select" disabled={!editing}
                {...register('bloodGroup')} />
            </div>
            <TextArea label="Address" rows={2} disabled={!editing}
              {...register('address')} />
          </SectionCard>

          {editing && (
            <Button type="submit" loading={loading} className="w-full sm:w-auto" icon={<CheckCircleIcon className="w-4 h-4" />}>
              Save changes
            </Button>
          )}
        </form>
      )}

      {/* ── Tab 1: Medical History ── */}
      {activeTab === 1 && (
        <div className="space-y-4">
          {[
            { label: 'Allergies',            field: 'allergies',          icon: HeartIcon,  addLabel: 'Add allergy'    },
            { label: 'Chronic conditions',   field: 'chronicConditions',  icon: HeartIcon,  addLabel: 'Add condition'  },
            { label: 'Past surgeries',       field: 'pastSurgeries',      icon: HeartIcon,  addLabel: 'Add surgery'    },
            { label: 'Current medications',  field: 'currentMedications', icon: HeartIcon,  addLabel: 'Add medication' },
          ].map(({ label, field, icon, addLabel }) => (
            <SectionCard
              key={field}
              title={label}
              icon={icon}
              action={
                <button
                  onClick={() => { setAddModal(field); setNewItem('') }}
                  className="btn btn-secondary btn-sm gap-1"
                >
                  <PlusIcon className="w-3.5 h-3.5" /> {addLabel}
                </button>
              }
            >
              <TagList items={profile[field] || []} editable onRemove={(i) => removeItem(field, i)} />
            </SectionCard>
          ))}
        </div>
      )}

      {/* ── Tab 2: Emergency Contact ── */}
      {activeTab === 2 && (
        <SectionCard title="Emergency contact" icon={PhoneIcon}>
          {editing ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Contact name" defaultValue={profile.emergencyContact?.name}
                {...register('emergencyContact.name', validators.name)} />
              <Input label="Relationship" placeholder="e.g. Spouse, Parent" defaultValue={profile.emergencyContact?.relation}
                {...register('emergencyContact.relation')} />
              <Input label="Phone number" type="tel" defaultValue={profile.emergencyContact?.phone}
                {...register('emergencyContact.phone', validators.phone)} />
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                ['Name',         profile.emergencyContact?.name     || '—'],
                ['Relationship', profile.emergencyContact?.relation || '—'],
                ['Phone',        profile.emergencyContact?.phone    || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{value}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Add item modal */}
      <Modal open={!!addModal} onClose={() => setAddModal(null)} title={`Add ${addModal?.replace(/([A-Z])/g, ' $1').toLowerCase()}`} size="sm">
        <div className="space-y-4">
          <Input
            label="Enter value"
            placeholder="Type here…"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem(addModal)}
            autoFocus
          />
          <div className="flex gap-3">
            <button onClick={() => setAddModal(null)} className="btn btn-secondary flex-1">Cancel</button>
            <Button onClick={() => addItem(addModal)} className="flex-1" disabled={!newItem.trim()}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
