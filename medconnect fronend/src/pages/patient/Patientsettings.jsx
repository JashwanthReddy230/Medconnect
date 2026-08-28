import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
    KeyIcon, BellIcon, ShieldCheckIcon, TrashIcon,
    DevicePhoneMobileIcon, ComputerDesktopIcon,
    CheckCircleIcon, ExclamationTriangleIcon,
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
        <button
            type="button"
            onClick={() => onChange(!enabled)}
            aria-label={label}
            className={clsx(
                'relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                enabled ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'
            )}
        >
            <span className={clsx(
                'absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                enabled && 'translate-x-5'
            )} />
        </button>
    )
}

export default function PatientSettings() {
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


    // Notification prefs
    const [notifPrefs, setNotifPrefs] = useState({
        appointmentReminder: true,
        appointmentConfirmed: true,
        newPrescription: true,
        reviewRequest: false,
        platformUpdates: false,
        emailNotifs: true,
        smsNotifs: false,
    })

    const { register: registerPwd, handleSubmit: handlePwd, getValues, reset: resetPwd, formState: { errors: pwdErrors }, watch } = useForm()
    const passwordVal = watch('newPassword', '')

    const onChangePassword = async (data) => {
        setLoading(true)
        try {
            await authService.resetPassword('', data.newPassword)
            toast.success('Password changed successfully!')
            resetPwd()
        } catch {
            toast.error('Failed to change password. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const toggleNotif = (key) => setNotifPrefs((p) => ({ ...p, [key]: !p[key] }))

    const ACTIVE_SESSIONS = [
        { device: 'Chrome on MacBook Pro', location: 'New York, US', current: true, lastActive: 'Now' },
        { device: 'Safari on iPhone 15', location: 'New York, US', current: false, lastActive: '2 hours ago' },
    ]

    return (
        <div className="max-w-2xl space-y-6 animate-fade-in">
            <div>
                <h1 className="page-title">Settings</h1>
                <p className="page-sub">Manage your account preferences and security</p>
            </div>

            {/* Tab nav */}
            <div className="flex gap-1 bg-muted-light dark:bg-muted-dark rounded-xl p-1 overflow-x-auto no-scrollbar">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={clsx(
                            'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                            activeTab === id
                                ? 'bg-white dark:bg-card-dark shadow-sm text-primary-600 dark:text-primary-400'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        )}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Account Tab ── */}
            {activeTab === 'account' && (
                <div className="space-y-4">
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Account information</h2>
                        <p className="text-xs text-slate-400 mb-4">Your basic account details</p>
                        <SettingRow label="Email address" description={user?.email}>
                            <span className="badge-success">Verified</span>
                        </SettingRow>
                        <SettingRow label="Account type" description="Patient account">
                            <span className="badge-info">Patient</span>
                        </SettingRow>
                        <SettingRow label="Member since" description={memberSince.date}>
                            <span className="text-xs text-slate-400">{memberSince.relative}</span>
                        </SettingRow>
                    </div>

                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Appearance</h2>
                        <p className="text-xs text-slate-400 mb-4">Customize how MedConnect looks for you</p>
                        <SettingRow label="Dark mode" description="Switch between light and dark interface">
                            <Toggle enabled={isDark} onChange={toggleTheme} label="Toggle dark mode" />
                        </SettingRow>
                    </div>

                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Active sessions</h2>
                        <p className="text-xs text-slate-400 mb-4">Devices currently signed in to your account</p>
                        <div className="space-y-3">
                            {ACTIVE_SESSIONS.map((session, i) => (
                                <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted-light dark:bg-muted-dark">
                                    <div className="flex items-center gap-3">
                                        {session.device.includes('iPhone') || session.device.includes('Mobile')
                                            ? <DevicePhoneMobileIcon className="w-5 h-5 text-slate-400" />
                                            : <ComputerDesktopIcon className="w-5 h-5 text-slate-400" />
                                        }
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{session.device}</p>
                                            <p className="text-xs text-slate-400">{session.location} · {session.lastActive}</p>
                                        </div>
                                    </div>
                                    {session.current
                                        ? <span className="badge-success text-xs">Current</span>
                                        : <button className="text-xs text-red-500 hover:underline">Revoke</button>
                                    }
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Password Tab ── */}
            {activeTab === 'password' && (
                <div className="card p-6">
                    <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Change password</h2>
                    <p className="text-xs text-slate-400 mb-5">Choose a strong password to keep your account secure</p>
                    <form onSubmit={handlePwd(onChangePassword)} className="space-y-4" noValidate>
                        <PasswordInput
                            label="Current password"
                            placeholder="••••••••"
                            required
                            error={pwdErrors.currentPassword?.message}
                            {...registerPwd('currentPassword', { required: 'Current password is required' })}
                        />
                        <PasswordInput
                            label="New password"
                            placeholder="••••••••"
                            required
                            showStrength
                            value={passwordVal}
                            error={pwdErrors.newPassword?.message}
                            {...registerPwd('newPassword', validators.password)}
                        />
                        <PasswordInput
                            label="Confirm new password"
                            placeholder="••••••••"
                            required
                            error={pwdErrors.confirmPassword?.message}
                            {...registerPwd('confirmPassword', {
                                required: 'Please confirm your new password',
                                validate: (val) => val === getValues('newPassword') || 'Passwords do not match',
                            })}
                        />
                        <Button type="submit" loading={loading} icon={<KeyIcon className="w-4 h-4" />}>
                            Update password
                        </Button>
                    </form>
                </div>
            )}

            {/* ── Notifications Tab ── */}
            {activeTab === 'notifications' && (
                <div className="space-y-4">
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">In-app notifications</h2>
                        <p className="text-xs text-slate-400 mb-1">Choose which notifications you receive in the app</p>
                        <SettingRow label="Appointment reminders" description="Get notified 24 hours before your appointment">
                            <Toggle enabled={notifPrefs.appointmentReminder} onChange={() => toggleNotif('appointmentReminder')} label="Appointment reminders" />
                        </SettingRow>
                        <SettingRow label="Appointment confirmations" description="When a doctor confirms your booking">
                            <Toggle enabled={notifPrefs.appointmentConfirmed} onChange={() => toggleNotif('appointmentConfirmed')} label="Appointment confirmations" />
                        </SettingRow>
                        <SettingRow label="New prescriptions" description="When a doctor uploads a prescription for you">
                            <Toggle enabled={notifPrefs.newPrescription} onChange={() => toggleNotif('newPrescription')} label="New prescriptions" />
                        </SettingRow>
                        <SettingRow label="Review requests" description="Reminders to review your recent doctors">
                            <Toggle enabled={notifPrefs.reviewRequest} onChange={() => toggleNotif('reviewRequest')} label="Review requests" />
                        </SettingRow>
                        <SettingRow label="Platform updates" description="News and feature announcements from MedConnect">
                            <Toggle enabled={notifPrefs.platformUpdates} onChange={() => toggleNotif('platformUpdates')} label="Platform updates" />
                        </SettingRow>
                    </div>
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Delivery channels</h2>
                        <p className="text-xs text-slate-400 mb-1">How you want to receive notifications</p>
                        <SettingRow label="Email notifications" description="Receive notifications to your email inbox">
                            <Toggle enabled={notifPrefs.emailNotifs} onChange={() => toggleNotif('emailNotifs')} label="Email notifications" />
                        </SettingRow>
                        <SettingRow label="SMS notifications" description="Receive text messages for important updates">
                            <Toggle enabled={notifPrefs.smsNotifs} onChange={() => toggleNotif('smsNotifs')} label="SMS notifications" />
                        </SettingRow>
                    </div>
                    <Button onClick={() => toast.success('Notification preferences saved!')} icon={<CheckCircleIcon className="w-4 h-4" />}>
                        Save preferences
                    </Button>
                </div>
            )}

            {/* ── Danger Zone Tab ── */}
            {activeTab === 'danger' && (
                <div className="space-y-4">
                    <div className="card p-5 border border-amber-200 dark:border-amber-800">
                        <h2 className="font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5" /> Danger zone
                        </h2>
                        <p className="text-xs text-slate-400 mb-4">These actions are irreversible. Please proceed with caution.</p>

                        <SettingRow label="Sign out of all devices" description="This will end all active sessions across all your devices">
                            <Button variant="secondary" size="sm" onClick={() => { logout(); toast.success('Signed out of all devices.') }}>
                                Sign out everywhere
                            </Button>
                        </SettingRow>

                        <SettingRow label="Delete account" description="Permanently delete your MedConnect account and all associated data">
                            <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)} icon={<TrashIcon className="w-4 h-4" />}>
                                Delete account
                            </Button>
                        </SettingRow>
                    </div>

                    {deleteModal && (
                        <div className="card p-5 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 space-y-4">
                            <div className="flex items-start gap-3">
                                <ExclamationTriangleIcon className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-red-700 dark:text-red-400">Are you absolutely sure?</p>
                                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                                        This will permanently delete your account, profile, all appointments and data. This cannot be undone.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                                <Button variant="danger" className="flex-1" onClick={() => { logout(); toast.error('Account deleted.') }}>
                                    Yes, delete my account
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}