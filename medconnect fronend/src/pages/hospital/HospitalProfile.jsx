import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { CameraIcon, BuildingOffice2Icon, CheckCircleIcon, MapPinIcon, PhoneIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { hospitalService } from '@/api/services'
import { Input, TextArea } from '@/components/common/FormFields.jsx'
import { Avatar } from '@/components/common/index.jsx'
import Button from '@/components/common/Button.jsx'
import { validators } from '@/utils/validators'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

// Build the initial hospital profile from registration data stored in AuthContext
function buildInitialHospital(user) {
  return {
    name:               user?.fullName || user?.name || '',
    email:              user?.email   || '',
    phone:              user?.phone   || user?.mobile || '',
    website:            user?.website || '',
    address:            user?.address || '',
    city:               user?.city    || '',
    state:              user?.state   || '',
    zip:                user?.zip     || user?.pincode || '',
    pincode:            user?.pincode || user?.zip || '',
    registrationNumber: user?.registrationNumber || '',
    status:             user?.status  || 'ACTIVE',
    about:              user?.about   || '',
    logo:               user?.logo    || null,
  }
}

export default function HospitalProfile() {
  const { user, updateUser } = useAuth()
  const hospitalData = buildInitialHospital(user)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const fileRef = useRef(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: hospitalData })

  useEffect(() => {
    if (user?.id) {
      hospitalService.getProfile(user.id)
        .then((res) => {
          const fetched = res.data
          const mapped = {
            name:               fetched.hospitalName || '',
            email:              fetched.email   || '',
            phone:              fetched.phone   || '',
            website:            fetched.website || '',
            address:            fetched.address || '',
            city:               fetched.city    || '',
            state:              fetched.state   || '',
            zip:                fetched.pincode || fetched.zip || '',
            pincode:            fetched.pincode || '',
            registrationNumber: fetched.registrationNumber || '',
            status:             fetched.status  || 'ACTIVE',
            about:              fetched.about   || '',
            logo:               fetched.logo    || null
          }
          reset(mapped)
        })
        .catch((err) => {
          console.error('Failed to fetch hospital profile:', err)
        })
    }
  }, [user?.id, reset])

  const onSave = async (data) => {
    setLoading(true)
    try {
      await hospitalService.updateProfile(data)
      updateUser({ fullName: data.name, ...data })
      toast.success('Profile updated!')
      setEditing(false)
    } catch { toast.error('Failed to update.') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Hospital Profile</h1>
        <p className="page-sub">Manage your facility's public information</p>
      </div>

      {/* Logo + header */}
      <div className="card p-6 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
        <div className="relative flex-shrink-0">
          <div className="w-24 h-24 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden">
            {hospitalData.logo
              ? <img src={hospitalData.logo} alt="Logo" className="w-full h-full object-cover" />
              : <BuildingOffice2Icon className="w-12 h-12 text-primary-400" />
            }
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md hover:bg-primary-700 transition-colors"
          >
            <CameraIcon className="w-4 h-4" />
          </button>
           <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={async (e) => {
              const file = e.target.files[0]
              if (!file) return
              const fd = new FormData(); fd.append('logo', file)
              try {
                await hospitalService.uploadLogo(fd)
                const reader = new FileReader()
                reader.onloadend = () => {
                  updateUser({ logo: reader.result })
                }
                reader.readAsDataURL(file)
                toast.success('Logo updated!')
              }
              catch { toast.error('Upload failed.') }
            }}
          />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{hospitalData.name || 'Your Facility'}</h2>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-2 text-sm text-slate-500 dark:text-slate-400">
            {hospitalData.city && <span className="flex items-center gap-1"><MapPinIcon className="w-3.5 h-3.5" />{hospitalData.city}</span>}
            {hospitalData.phone && <span className="flex items-center gap-1"><PhoneIcon className="w-3.5 h-3.5" />{hospitalData.phone}</span>}
          </div>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
            <span className="badge-success">{hospitalData.status || 'ACTIVE'}</span>
            <span className="badge-primary">Hospital</span>
            {hospitalData.registrationNumber && (
              <span className="badge-neutral font-mono text-[10px]">Reg: {hospitalData.registrationNumber}</span>
            )}
          </div>
        </div>
        <button onClick={() => setEditing((e) => !e)} className="btn btn-secondary btn-sm self-start">
          {editing ? 'Cancel' : 'Edit profile'}
        </button>
      </div>

      <form onSubmit={handleSubmit(onSave)} className="space-y-5" noValidate>
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Facility information</h2>
          <Input label="Facility name" required disabled={!editing} error={errors.name?.message}
            {...register('name', { required: 'Name is required', minLength: { value: 3, message: 'Too short' } })} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Contact email" type="email" disabled={!editing} error={errors.email?.message}
              {...register('email', validators.email)} />
            <Input label="Contact phone" type="tel" disabled={!editing} error={errors.phone?.message}
              {...register('phone', validators.phone)} />
          </div>
          <Input label="Website" type="url" placeholder="https://" disabled={!editing} error={errors.website?.message}
            {...register('website', validators.url)} icon={<GlobeAltIcon className="w-4 h-4" />} />
          <TextArea label="About the facility" rows={4} disabled={!editing}
            {...register('about', validators.textArea(20, 800))} />
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Address & Registration</h2>
          <TextArea label="Street address" rows={2} required disabled={!editing}
            {...register('address', { required: 'Address is required' })} />
          <div className="grid sm:grid-cols-3 gap-4">
            <Input label="City"     required disabled={!editing} {...register('city',  { required: 'Required' })} />
            <Input label="State"    disabled={!editing} {...register('state')} />
            <Input label="Pincode" disabled={!editing} {...register('pincode')} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Registration Number" disabled={!editing} placeholder="e.g. MH-HOS-12345"
              {...register('registrationNumber')} />
            <Input label="Status" disabled value={hospitalData.status || 'ACTIVE'}
              {...register('status')} />
          </div>
        </div>

        {editing && (
          <Button type="submit" loading={loading} icon={<CheckCircleIcon className="w-4 h-4" />}>
            Save profile
          </Button>
        )}
      </form>
    </div>
  )
}
