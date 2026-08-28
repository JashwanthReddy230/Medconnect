import { useState } from 'react'
import { CalendarIcon, ClockIcon, CheckCircleIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { doctorService } from '@/api/doctorService'
import Button from '@/components/common/Button.jsx'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const TIMES = ['7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM',
               '1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM']
const DURATIONS = [{ value:15,label:'15 min' },{ value:20,label:'20 min' },{ value:30,label:'30 min' },{ value:45,label:'45 min' },{ value:60,label:'1 hour' }]

const DEFAULT_AVAIL = DAYS.reduce((acc, day) => ({
  ...acc,
  [day]: { enabled: !['Saturday','Sunday'].includes(day), start:'9:00 AM', end:'5:00 PM', slotDuration:30, breaks:[] },
}), {})

function TimeSelect({ value, onChange, label }) {
  return (
    <div>
      {label && <p className="text-xs text-slate-400 mb-1">{label}</p>}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input py-1 text-xs">
        {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
  )
}

export default function DoctorSchedule() {
  const [avail,   setAvail]   = useState(DEFAULT_AVAIL)
  const [loading, setLoading] = useState(false)

  const toggleDay = (day) =>
    setAvail((p) => ({ ...p, [day]: { ...p[day], enabled: !p[day].enabled } }))

  const updateDay = (day, field, value) =>
    setAvail((p) => ({ ...p, [day]: { ...p[day], [field]: value } }))

  const addBreak = (day) =>
    setAvail((p) => ({
      ...p,
      [day]: { ...p[day], breaks: [...p[day].breaks, { start:'12:00 PM', end:'1:00 PM' }] },
    }))

  const removeBreak = (day, idx) =>
    setAvail((p) => ({
      ...p,
      [day]: { ...p[day], breaks: p[day].breaks.filter((_, i) => i !== idx) },
    }))

  const updateBreak = (day, idx, field, value) =>
    setAvail((p) => ({
      ...p,
      [day]: {
        ...p[day],
        breaks: p[day].breaks.map((b, i) => i === idx ? { ...b, [field]: value } : b),
      },
    }))

  const onSave = async () => {
    setLoading(true)
    try {
      await doctorService.updateAvailability(avail)
      toast.success('Schedule saved successfully!')
    } catch {
      toast.error('Failed to save schedule.')
    } finally {
      setLoading(false)
    }
  }

  const enabledCount = Object.values(avail).filter((d) => d.enabled).length

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Manage Schedule</h1>
          <p className="page-sub">{enabledCount} working days · Set your availability for patients</p>
        </div>
        <Button loading={loading} onClick={onSave} icon={<CheckCircleIcon className="w-4 h-4" />}>
          Save schedule
        </Button>
      </div>

      {/* Slot duration global setting */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-primary-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Default appointment slot duration</span>
        </div>
        <div className="flex gap-2">
          {DURATIONS.map((d) => {
            const allSame = Object.values(avail).every((day) => day.slotDuration === d.value)
            return (
              <button
                key={d.value}
                onClick={() => setAvail((p) => Object.fromEntries(Object.entries(p).map(([k,v]) => [k,{...v,slotDuration:d.value}])))}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  allSame
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-border-light dark:border-border-dark text-slate-600 dark:text-slate-300 hover:border-primary-300 dark:hover:border-primary-700'
                )}
              >
                {d.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Day cards */}
      <div className="space-y-3">
        {DAYS.map((day) => {
          const cfg = avail[day]
          return (
            <div key={day} className={clsx(
              'card p-5 transition-all',
              !cfg.enabled && 'opacity-60'
            )}>
              {/* Day header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={clsx(
                      'relative w-11 h-6 rounded-full transition-colors',
                      cfg.enabled ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'
                    )}
                  >
                    <span className={clsx(
                      'absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                      cfg.enabled && 'translate-x-5'
                    )} />
                  </button>
                  <span className={clsx(
                    'font-semibold text-sm',
                    cfg.enabled ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'
                  )}>
                    {day}
                  </span>
                </div>
                {cfg.enabled && (
                  <div className="flex items-center gap-2">
                    <select
                      value={cfg.slotDuration}
                      onChange={(e) => updateDay(day, 'slotDuration', Number(e.target.value))}
                      className="input py-1 text-xs w-28"
                    >
                      {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label} slots</option>)}
                    </select>
                  </div>
                )}
              </div>

              {cfg.enabled && (
                <div className="space-y-4">
                  {/* Working hours */}
                  <div className="flex flex-wrap items-center gap-4">
                    <TimeSelect label="Start time" value={cfg.start} onChange={(v) => updateDay(day, 'start', v)} />
                    <span className="text-slate-400 text-sm mt-4">→</span>
                    <TimeSelect label="End time"   value={cfg.end}   onChange={(v) => updateDay(day, 'end',   v)} />
                    <div className="mt-4">
                      <p className="text-xs text-slate-400 mb-1">Estimated slots</p>
                      <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                        {(() => {
                          const toMins = (t) => {
                            const [time, period] = t.split(' ')
                            let [h, m] = time.split(':').map(Number)
                            if (period === 'PM' && h !== 12) h += 12
                            if (period === 'AM' && h === 12) h = 0
                            return h * 60 + m
                          }
                          const totalMins = toMins(cfg.end) - toMins(cfg.start)
                          const breakMins = cfg.breaks.reduce((acc, b) => acc + toMins(b.end) - toMins(b.start), 0)
                          return Math.max(0, Math.floor((totalMins - breakMins) / cfg.slotDuration))
                        })()} slots/day
                      </p>
                    </div>
                  </div>

                  {/* Breaks */}
                  {cfg.breaks.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-amber-200 dark:border-amber-800">
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Break times</p>
                      {cfg.breaks.map((brk, idx) => (
                        <div key={idx} className="flex flex-wrap items-center gap-3">
                          <TimeSelect value={brk.start} onChange={(v) => updateBreak(day, idx, 'start', v)} />
                          <span className="text-slate-400 text-sm">to</span>
                          <TimeSelect value={brk.end}   onChange={(v) => updateBreak(day, idx, 'end',   v)} />
                          <button
                            type="button"
                            onClick={() => removeBreak(day, idx)}
                            className="mt-0 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => addBreak(day)}
                    className="btn btn-ghost btn-sm gap-1 text-xs text-slate-500"
                  >
                    <PlusIcon className="w-3.5 h-3.5" /> Add break time
                  </button>
                </div>
              )}

              {!cfg.enabled && (
                <p className="text-sm text-slate-400 italic">Not available — click toggle to enable</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="card p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-900">
        <p className="text-xs text-primary-700 dark:text-primary-300">
          <strong>Note:</strong> Changes apply to new bookings only. Existing appointments will not be affected. Patients will see your updated availability within a few minutes.
        </p>
      </div>

      <Button loading={loading} onClick={onSave} className="w-full" icon={<CheckCircleIcon className="w-4 h-4" />}>
        Save schedule
      </Button>
    </div>
  )
}
