import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
    KeyIcon, BellIcon, ShieldCheckIcon, TrashIcon,
    CheckCircleIcon, ExclamationTriangleIcon, EyeSlashIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { PasswordInput } from '@/components/common/FormFields.jsx'
import Button from '@/components/common/Button.jsx'
import { validators } from '@/utils/validators'
import { authService } from '@/api/authService'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const TABS = [
    { id: 'account', label: 'Account', icon: ShieldCheckIcon },
    { id: 'password', label: 'Password', icon: KeyIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'danger', label: 'Danger zone', icon: ExclamationTriangleIcon },
]

function SettingRow({ label, description, children }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 border-b border-border-light dark:border-border-dark last:border-0">
            <div className="flex-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
                {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    )
}

function Toggle({ enabled, onChange, label }) {
    return (
        <button type="button" onClick={() => onChange(!enabled)} aria-label={label}
            className={clsx('relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                enabled ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600')}>
            <span className={clsx('absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform', enabled && 'translate-x-5')} />
        </button>
    )
}

export default function HospitalSettings() {
    const { user, logout } = useAuth()
    const { isDark, toggleTheme } = useTheme()
    const [activeTab, setActiveTab] = useState('account')
    const [loading, setLoading] = useState(false)
    const [deleteModal, setDeleteModal] = useState(false)

    const getMemberSince = () => {
        if (!user?.iat) return { date: 'Recent', relative: 'Just joined' }
        const dateObj = new Date(user.iat * 1000)
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        const diffMs = Date.now() - dateObj.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const diffMonths = Math.floor(diffDays / 30)
        const diffYears = Math.floor(diffDays / 365)
        
        let relative = 'Just joined'
        if (diffYears > 0) {
            relative = `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
        } else if (diffMonths > 0) {
            relative = `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
        } else if (diffDays > 0) {
            relative = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
        } else {
            relative = 'Today'
        }
        return { date: dateStr, relative }
    }
    const memberSince = getMemberSince()


    const [notifPrefs, setNotifPrefs] = useState({
        newDoctorAffiliated: true,
        appointmentAlerts: true,
        patientFeedback: true,
        systemUpdates: false,
        emailNotifs: true,
        smsNotifs: false,
    })

    const { register, handleSubmit, getValues, reset, formState: { errors }, watch } = useForm()
    const passwordVal = watch('newPassword', '')

    const onChangePassword = async (data) => {
        setLoading(true)
        try {
            await authService.resetPassword('', data.newPassword)
            toast.success('Password updated!')
            reset()
        } catch { toast.error('Failed.') }
        finally { setLoading(false) }
    }

    const toggleNotif = (k) => setNotifPrefs((p) => ({ ...p, [k]: !p[k] }))

    return (
        <div className="max-w-2xl space-y-6 animate-fade-in">
            <div>
                <h1 className="page-title">Settings</h1>
                <p className="page-sub">Manage your hospital account and preferences</p>
            </div>

            <div className="flex gap-1 bg-muted-light dark:bg-muted-dark rounded-xl p-1 overflow-x-auto no-scrollbar">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                        className={clsx(
                            'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                            activeTab === id
                                ? 'bg-white dark:bg-card-dark shadow-sm text-primary-600 dark:text-primary-400'
                                : 'text-slate-500 dark:text-slate-400'
                        )}>
                        <Icon className="w-3.5 h-3.5" />{label}
                    </button>
                ))}
            </div>

            {activeTab === 'account' && (
                <div className="space-y-4">
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Account information</h2>
                        <SettingRow label="Email address" description={user?.email}><span className="badge-success">Verified</span></SettingRow>
                        <SettingRow label="Account type"><span className="badge-info">Hospital</span></SettingRow>
                        <SettingRow label="Approval status"><span className="badge-success flex items-center gap-1"><ShieldCheckIcon className="w-3 h-3" />Approved</span></SettingRow>
                        <SettingRow label="Member since" description={memberSince.date}>
                            <span className="text-xs text-slate-400">{memberSince.relative}</span>
                        </SettingRow>
                    </div>
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Appearance</h2>
                        <SettingRow label="Dark mode" description="Switch between light and dark interface">
                            <Toggle enabled={isDark} onChange={toggleTheme} label="Toggle dark mode" />
                        </SettingRow>
                    </div>
                </div>
            )}

            {activeTab === 'password' && (
                <div className="card p-6">
                    <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-5">Change password</h2>
                    <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4" noValidate>
                        <PasswordInput label="Current password" placeholder="••••••••" required error={errors.currentPassword?.message}
                            {...register('currentPassword', { required: 'Required' })} />
                        <PasswordInput label="New password" placeholder="••••••••" required showStrength value={passwordVal} error={errors.newPassword?.message}
                            {...register('newPassword', validators.password)} />
                        <PasswordInput label="Confirm new password" placeholder="••••••••" required error={errors.confirmPassword?.message}
                            {...register('confirmPassword', { required: 'Required', validate: (v) => v === getValues('newPassword') || 'Passwords do not match' })} />
                        <Button type="submit" loading={loading} icon={<KeyIcon className="w-4 h-4" />}>Update password</Button>
                    </form>
                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="space-y-4">
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Facility notifications</h2>
                        <p className="text-xs text-slate-400 mb-1">Stay informed about your hospital's activity</p>
                        <SettingRow label="New doctor affiliated" description="When a doctor joins your facility">
                            <Toggle enabled={notifPrefs.newDoctorAffiliated} onChange={() => toggleNotif('newDoctorAffiliated')} label="New doctor" /></SettingRow>
                        <SettingRow label="Appointment alerts" description="High-volume appointment notifications">
                            <Toggle enabled={notifPrefs.appointmentAlerts} onChange={() => toggleNotif('appointmentAlerts')} label="Appointment alerts" /></SettingRow>
                        <SettingRow label="Patient feedback" description="Reviews and feedback about your facility">
                            <Toggle enabled={notifPrefs.patientFeedback} onChange={() => toggleNotif('patientFeedback')} label="Patient feedback" /></SettingRow>
                        <SettingRow label="System updates" description="MedConnect platform announcements">
                            <Toggle enabled={notifPrefs.systemUpdates} onChange={() => toggleNotif('systemUpdates')} label="System updates" /></SettingRow>
                    </div>
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Delivery channels</h2>
                        <SettingRow label="Email notifications"><Toggle enabled={notifPrefs.emailNotifs} onChange={() => toggleNotif('emailNotifs')} label="Email" /></SettingRow>
                        <SettingRow label="SMS notifications"><Toggle enabled={notifPrefs.smsNotifs} onChange={() => toggleNotif('smsNotifs')} label="SMS" /></SettingRow>
                    </div>
                    <Button onClick={() => toast.success('Preferences saved!')} icon={<CheckCircleIcon className="w-4 h-4" />}>Save preferences</Button>
                </div>
            )}

            {activeTab === 'danger' && (
                <div className="card p-5 border border-red-200 dark:border-red-800 space-y-0">
                    <h2 className="font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5" /> Danger zone
                    </h2>
                    <SettingRow label="Sign out all devices" description="End all active sessions">
                        <Button variant="secondary" size="sm" onClick={() => logout()}>Sign out everywhere</Button>
                    </SettingRow>
                    <SettingRow label="Delete facility account" description="Permanently remove your hospital account and all data">
                        <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)} icon={<TrashIcon className="w-4 h-4" />}>Delete account</Button>
                    </SettingRow>
                    {deleteModal && (
                        <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 space-y-3">
                            <p className="text-sm text-red-700 dark:text-red-300">This will permanently delete your hospital account, all affiliated doctors, departments and data.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                                <Button variant="danger" className="flex-1" onClick={() => logout()}>Confirm delete</Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}