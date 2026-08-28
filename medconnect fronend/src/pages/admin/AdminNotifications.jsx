import { useState } from 'react'
import { BellIcon, PaperAirplaneIcon, UsersIcon, UserIcon, BuildingOffice2Icon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { notificationService } from '@/api/services'
import { TextArea, Input, Select } from '@/components/common/FormFields.jsx'
import Button from '@/components/common/Button.jsx'
import { formatRelative } from '@/utils/formatters'
import { useForm } from 'react-hook-form'
import { validators } from '@/utils/validators'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const AUDIENCE_OPTIONS = [
  { value: 'all',      label: 'All users'       },
  { value: 'patients', label: 'Patients only'   },
  { value: 'doctors',  label: 'Doctors only'    },
  { value: 'hospitals',label: 'Hospitals only'  },
]

const TYPE_OPTIONS = [
  { value: 'info',    label: 'Information' },
  { value: 'warning', label: 'Warning'     },
  { value: 'success', label: 'Success'     },
  { value: 'system',  label: 'System'      },
]

const MOCK_HISTORY = [
  { _id:'1', title:'Platform Maintenance',    message:'Scheduled maintenance on Sunday 2–4 AM UTC. The platform will be temporarily unavailable.', audience:'all',      sentAt: new Date(Date.now()-86400000).toISOString(),  recipientCount: 52300 },
  { _id:'2', title:'New Feature: Dark Mode',  message:'MedConnect now supports dark mode! Toggle it from your sidebar or profile menu.', audience:'all',      sentAt: new Date(Date.now()-604800000).toISOString(), recipientCount: 51800 },
  { _id:'3', title:'Doctor Verification Update', message:'We have upgraded our doctor verification process. Please re-submit your credentials if prompted.', audience:'doctors', sentAt: new Date(Date.now()-1209600000).toISOString(),recipientCount: 1284  },
  { _id:'4', title:'New Booking Features',    message:'Patients can now filter doctors by language and consultation fee range.', audience:'patients', sentAt: new Date(Date.now()-1814400000).toISOString(),recipientCount: 48920 },
]

const AUDIENCE_ICON = {
  all:       UsersIcon,
  patients:  UserIcon,
  doctors:   UserIcon,
  hospitals: BuildingOffice2Icon,
}

const AUDIENCE_COLOR = {
  all:       'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
  patients:  'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  doctors:   'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  hospitals: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
}

export default function AdminNotifications() {
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [history, setHistory] = useState(MOCK_HISTORY)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { title: '', message: '', audience: 'all', type: 'info' },
  })

  const selectedAudience = watch('audience')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await notificationService.broadcast(data)
      const recipientCount = { all: 52300, patients: 48920, doctors: 1284, hospitals: 312 }[data.audience]
      setHistory((p) => [{
        _id: Date.now().toString(),
        ...data,
        sentAt: new Date().toISOString(),
        recipientCount,
      }, ...p])
      setSent(true)
      toast.success(`Notification sent to ${recipientCount.toLocaleString()} users!`)
      setTimeout(() => { setSent(false); reset() }, 3000)
    } catch {
      toast.error('Failed to send notification.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Broadcast Notifications</h1>
        <p className="page-sub">Send platform-wide announcements to users</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Compose form */}
        <div className="lg:col-span-2">
          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <BellIcon className="w-5 h-5 text-primary-500" />
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">Compose notification</h2>
            </div>

            {sent ? (
              <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Notification sent!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">All recipients will be notified shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <Input
                  label="Notification title"
                  placeholder="e.g. Platform Maintenance Scheduled"
                  required
                  error={errors.title?.message}
                  {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'Too short' } })}
                />
                <TextArea
                  label="Message"
                  rows={4}
                  placeholder="Write a clear and concise message for your users…"
                  required
                  error={errors.message?.message}
                  {...register('message', validators.textArea(10, 500))}
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Select
                    label="Send to"
                    options={AUDIENCE_OPTIONS}
                    required
                    error={errors.audience?.message}
                    {...register('audience', { required: 'Select audience' })}
                  />
                  <Select
                    label="Notification type"
                    options={TYPE_OPTIONS}
                    {...register('type')}
                  />
                </div>

                {/* Audience preview */}
                <div className={clsx('p-3 rounded-xl border', AUDIENCE_COLOR[selectedAudience] || AUDIENCE_COLOR.all)}>
                  <p className="text-xs font-medium">
                    This notification will be sent to:{' '}
                    <strong>
                      {{ all:'All users (52,300+)', patients:'All patients (48,920)', doctors:'All doctors (1,284)', hospitals:'All hospitals (312)' }[selectedAudience]}
                    </strong>
                  </p>
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                  icon={<PaperAirplaneIcon className="w-4 h-4" />}
                >
                  Send notification
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3 text-sm">Best practices</h3>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              {[
                'Keep titles short and descriptive (under 60 chars)',
                'Be specific about what action users should take',
                'Avoid sending multiple broadcasts on the same day',
                'Use warnings sparingly — only for urgent matters',
                'Always test with a small audience first when possible',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Broadcast history */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Broadcast history</h2>
        <div className="space-y-3">
          {history.map((item) => {
            const Icon  = AUDIENCE_ICON[item.audience] || UsersIcon
            const color = AUDIENCE_COLOR[item.audience] || AUDIENCE_COLOR.all
            return (
              <div key={item._id} className="flex items-start gap-4 p-4 rounded-xl bg-muted-light dark:bg-muted-dark">
                <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{item.title}</p>
                    <span className="text-xs text-slate-400 flex-shrink-0">{formatRelative(item.sentAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{item.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="badge-neutral capitalize">{item.audience}</span>
                    <span className="text-xs text-slate-400">{item.recipientCount?.toLocaleString()} recipients</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
