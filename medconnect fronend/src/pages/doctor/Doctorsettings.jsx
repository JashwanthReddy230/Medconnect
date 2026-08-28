import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
    KeyIcon, BellIcon, ShieldCheckIcon, TrashIcon,
    DevicePhoneMobileIcon, ComputerDesktopIcon,
    CheckCircleIcon, ExclamationTriangleIcon,
    EyeSlashIcon, CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { PasswordInput, Input } from '@/components/common/FormFields.jsx'
import Button from '@/components/common/Button.jsx'
import { validators } from '@/utils/validators'
import { authService } from '@/api/authService'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const TABS = [
    { id: 'account', label: 'Account', icon: ShieldCheckIcon },
    { id: 'password', label: 'Password', icon: KeyIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'privacy', label: 'Privacy', icon: EyeSlashIcon },
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

export default function DoctorSettings() {
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
        newBooking: true,
        cancellation: true,
        patientMessage: true,
        newReview: true,
        reminderUpcoming: true,
        platformUpdates: false,
        emailNotifs: true,
        smsNotifs: true,
    })

    const [privacyPrefs, setPrivacyPrefs] = useState({
        showEmail: false,
        showPhone: false,
        showFee: true,
        publicProfile: true,
        searchVisible: true,
    })

    const { register: regPwd, handleSubmit: handlePwd, getValues, reset: resetPwd, formState: { errors: pwdErrors }, watch } = useForm()
    const passwordVal = watch('newPassword', '')

    const onChangePassword = async (data) => {
        setLoading(true)
        try {
            await authService.resetPassword('', data.newPassword)
            toast.success('Password updated!')
            resetPwd()
        } catch { toast.error('Failed to update password.') }
        finally { setLoading(false) }
    }

    const toggleNotif = (k) => setNotifPrefs((p) => ({ ...p, [k]: !p[k] }))
    const togglePrivacy = (k) => setPrivacyPrefs((p) => ({ ...p, [k]: !p[k] }))

    return (
        <div className="max-w-2xl space-y-6 animate-fade-in">
            <div>
                <h1 className="page-title">Settings</h1>
                <p className="page-sub">Manage your doctor account preferences and privacy</p>
            </div>

            <div className="flex gap-1 bg-muted-light dark:bg-muted-dark rounded-xl p-1 overflow-x-auto no-scrollbar">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                        className={clsx(
                            'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                            activeTab === id
                                ? 'bg-white dark:bg-card-dark shadow-sm text-primary-600 dark:text-primary-400'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        )}>
                        <Icon className="w-3.5 h-3.5" />{label}
                    </button>
                ))}
            </div>

            {/* Account */}
            {activeTab === 'account' && (
                <div className="space-y-4">
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Account information</h2>
                        <SettingRow label="Email address" description={user?.email}>
                            <span className="badge-success">Verified</span>
                        </SettingRow>
                        <SettingRow label="Account type">
                            <span className="badge-primary">Doctor</span>
                        </SettingRow>
                        <SettingRow label="Approval status">
                            <span className="badge-success flex items-center gap-1"><ShieldCheckIcon className="w-3 h-3" />Approved</span>
                        </SettingRow>
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
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Active sessions</h2>
                        {[
                            { device: 'Chrome on MacBook Pro', location: 'New York, US', current: true, lastActive: 'Now' },
                            { device: 'Mobile App – iPhone', location: 'New York, US', current: false, lastActive: '1 hour ago' },
                        ].map((s, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted-light dark:bg-muted-dark mb-2 last:mb-0">
                                <div className="flex items-center gap-3">
                                    {s.device.includes('Mobile') || s.device.includes('iPhone')
                                        ? <DevicePhoneMobileIcon className="w-5 h-5 text-slate-400" />
                                        : <ComputerDesktopIcon className="w-5 h-5 text-slate-400" />}
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{s.device}</p>
                                        <p className="text-xs text-slate-400">{s.location} · {s.lastActive}</p>
                                    </div>
                                </div>
                                {s.current ? <span className="badge-success">Current</span> : <button className="text-xs text-red-500 hover:underline">Revoke</button>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Password */}
            {activeTab === 'password' && (
                <div className="card p-6">
                    <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-5">Change password</h2>
                    <form onSubmit={handlePwd(onChangePassword)} className="space-y-4" noValidate>
                        <PasswordInput label="Current password" placeholder="••••••••" required
                            error={pwdErrors.currentPassword?.message}
                            {...regPwd('currentPassword', { required: 'Required' })} />
                        <PasswordInput label="New password" placeholder="••••••••" required showStrength value={passwordVal}
                            error={pwdErrors.newPassword?.message}
                            {...regPwd('newPassword', validators.password)} />
                        <PasswordInput label="Confirm new password" placeholder="••••••••" required
                            error={pwdErrors.confirmPassword?.message}
                            {...regPwd('confirmPassword', {
                                required: 'Required',
                                validate: (v) => v === getValues('newPassword') || 'Passwords do not match',
                            })} />
                        <Button type="submit" loading={loading} icon={<KeyIcon className="w-4 h-4" />}>Update password</Button>
                    </form>
                </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
                <div className="space-y-4">
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Practice notifications</h2>
                        <p className="text-xs text-slate-400 mb-1">Stay updated on your appointments and patients</p>
                        <SettingRow label="New appointment booked" description="When a patient books a slot with you">
                            <Toggle enabled={notifPrefs.newBooking} onChange={() => toggleNotif('newBooking')} label="New bookings" /></SettingRow>
                        <SettingRow label="Appointment cancellation" description="When a patient cancels their appointment">
                            <Toggle enabled={notifPrefs.cancellation} onChange={() => toggleNotif('cancellation')} label="Cancellations" /></SettingRow>
                        <SettingRow label="Upcoming appointment reminders" description="30-minute reminders before each appointment">
                            <Toggle enabled={notifPrefs.reminderUpcoming} onChange={() => toggleNotif('reminderUpcoming')} label="Reminders" /></SettingRow>
                        <SettingRow label="New patient reviews" description="When a patient leaves you a review">
                            <Toggle enabled={notifPrefs.newReview} onChange={() => toggleNotif('newReview')} label="New reviews" /></SettingRow>
                        <SettingRow label="Platform announcements" description="MedConnect news and feature updates">
                            <Toggle enabled={notifPrefs.platformUpdates} onChange={() => toggleNotif('platformUpdates')} label="Platform updates" /></SettingRow>
                    </div>
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Delivery channels</h2>
                        <SettingRow label="Email notifications"><Toggle enabled={notifPrefs.emailNotifs} onChange={() => toggleNotif('emailNotifs')} label="Email" /></SettingRow>
                        <SettingRow label="SMS notifications"><Toggle enabled={notifPrefs.smsNotifs} onChange={() => toggleNotif('smsNotifs')} label="SMS" /></SettingRow>
                    </div>
                    <Button onClick={() => toast.success('Preferences saved!')} icon={<CheckCircleIcon className="w-4 h-4" />}>Save preferences</Button>
                </div>
            )}

            {/* Privacy */}
            {activeTab === 'privacy' && (
                <div className="space-y-4">
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Profile visibility</h2>
                        <p className="text-xs text-slate-400 mb-1">Control what patients and the public can see</p>
                        <SettingRow label="Public profile" description="Your profile appears in doctor search results">
                            <Toggle enabled={privacyPrefs.publicProfile} onChange={() => togglePrivacy('publicProfile')} label="Public profile" /></SettingRow>
                        <SettingRow label="Search visibility" description="Allow patients to find you via search">
                            <Toggle enabled={privacyPrefs.searchVisible} onChange={() => togglePrivacy('searchVisible')} label="Search visibility" /></SettingRow>
                        <SettingRow label="Show consultation fee" description="Display your fee on your public profile">
                            <Toggle enabled={privacyPrefs.showFee} onChange={() => togglePrivacy('showFee')} label="Show fee" /></SettingRow>
                        <SettingRow label="Show email address" description="Display your email on your public profile">
                            <Toggle enabled={privacyPrefs.showEmail} onChange={() => togglePrivacy('showEmail')} label="Show email" /></SettingRow>
                        <SettingRow label="Show phone number" description="Display your phone on your public profile">
                            <Toggle enabled={privacyPrefs.showPhone} onChange={() => togglePrivacy('showPhone')} label="Show phone" /></SettingRow>
                    </div>
                    <Button onClick={() => toast.success('Privacy settings saved!')} icon={<CheckCircleIcon className="w-4 h-4" />}>Save privacy settings</Button>
                </div>
            )}

            {/* Danger */}
            {activeTab === 'danger' && (
                <div className="card p-5 border border-red-200 dark:border-red-800 space-y-0">
                    <h2 className="font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5" /> Danger zone
                    </h2>
                    <SettingRow label="Sign out all devices" description="End all active sessions on every device">
                        <Button variant="secondary" size="sm" onClick={() => logout()}>Sign out everywhere</Button>
                    </SettingRow>
                    <SettingRow label="Delete account" description="Permanently delete your doctor account and all data">
                        <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)} icon={<TrashIcon className="w-4 h-4" />}>Delete account</Button>
                    </SettingRow>
                    {deleteModal && (
                        <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 space-y-3">
                            <p className="text-sm text-red-700 dark:text-red-300 font-medium">This will permanently remove your profile, availability, all appointments, prescriptions, and reviews. This cannot be undone.</p>
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