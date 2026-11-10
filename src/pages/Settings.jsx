// Profile, account security, and notification preferences.

import { useState } from 'react'
import { Bell, Check, Shield, UserRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const PROFILE_KEY = 'itrack.profile'
const defaultProfile = (user) => ({
  name: user.name,
  email: user.email,
  phone: '+234 803 555 0182',
  office: 'ITS · HQ',
  language: 'English',
  timezone: 'Africa/Lagos',
})

function readProfile(user) {
  const key = `${PROFILE_KEY}.${user.id}`
  const raw = window.sessionStorage.getItem(key)
  if (raw === null) return defaultProfile(user)

  const profile = JSON.parse(raw)
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    throw new Error('Invalid profile preferences in browser session storage.')
  }
  return { ...defaultProfile(user), ...profile }
}

const TABS = [
  { label: 'Profile', Icon: UserRound },
  { label: 'Security', Icon: Shield },
  { label: 'Notifications', Icon: Bell },
]

function ToggleRow({ title, description, checked, onChange, isLast }) {
  return (
    <div className={`flex items-center justify-between gap-5 py-4 ${isLast ? '' : 'border-b border-slate-100'}`}>
      <div>
        <h3 className="text-sm font-semibold text-[#111a38]">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 ${
          checked ? 'bg-[#3155ff]' : 'bg-slate-200'
        }`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

function ProfileSettings({ user }) {
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState(() => readProfile(user))
  const update = (key, value) => {
    setSaved(false)
    setProfile((current) => ({ ...current, [key]: value }))
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        window.sessionStorage.setItem(`${PROFILE_KEY}.${user.id}`, JSON.stringify(profile))
        setSaved(true)
      }}
      className="space-y-4"
    >
      <section className="rounded-2xl border border-[#e9edf6] bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-[#111a38]">Profile</h2>
        <p className="mt-1 text-xs text-slate-500">The details shown to people who work with you.</p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">
            Full name
            <input value={profile.name} onChange={(event) => update('name', event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal text-[#202844]" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Work email
            <input type="email" value={profile.email} onChange={(event) => update('email', event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal text-[#202844]" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Phone
            <input value={profile.phone} onChange={(event) => update('phone', event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal text-[#202844]" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Office
            <input value={profile.office} onChange={(event) => update('office', event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal text-[#202844]" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Language
            <select value={profile.language} onChange={(event) => update('language', event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] bg-white px-3 py-2.5 text-sm font-normal text-[#202844]">
              <option>English</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Time zone
            <select value={profile.timezone} onChange={(event) => update('timezone', event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] bg-white px-3 py-2.5 text-sm font-normal text-[#202844]">
              <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
            </select>
          </label>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button type="submit" className="rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700">
            Save profile
          </button>
          {saved && <span role="status" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><Check size={14} /> Saved for this session</span>}
        </div>
      </section>
      <section className="rounded-2xl border border-[#e9edf6] bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-[#111a38]">Signature</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Used on every gate pass and device checkout you approve. A PIN is required to apply it.
        </p>
        <div className="mt-4 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-[#fbfcff]">
          <svg viewBox="0 0 220 50" className="h-14 w-56 stroke-[#111a38]" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Current saved signature">
            <path d="M10,32 Q30,7 46,31 T86,27 T127,21 T168,31 T205,22" />
          </svg>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Set 2 Sep 2026 · used on 41 passes</p>
      </section>
    </form>
  )
}

function SecuritySettings() {
  const [pin, setPin] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')

  return (
    <section className="rounded-2xl border border-[#e9edf6] bg-white p-5 sm:p-6">
      <h2 className="text-base font-bold text-[#111a38]">Account security</h2>
      <p className="mt-1 text-xs text-slate-500">Manage the PIN used to approve passes and reveal device secrets.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (pin.length < 4) {
            setMessage('PIN must be at least 4 characters.')
            return
          }
          if (pin !== confirmation) {
            setMessage('The PINs do not match.')
            return
          }
          setMessage('PIN passed demo validation. Saving it requires a connected backend.')
          setPin('')
          setConfirmation('')
        }}
        className="mt-5 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <label className="text-xs font-semibold text-slate-600">
          New PIN
          <input required minLength={4} type="password" autoComplete="new-password" value={pin} onChange={(event) => setPin(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal" />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Confirm PIN
          <input required minLength={4} type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#e3e8f2] px-3 py-2.5 text-sm font-normal" />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="rounded-full bg-[#3155ff] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700">Change PIN</button>
          {message && <p role="status" className="mt-2 text-xs text-slate-600">{message}</p>}
        </div>
      </form>
      <div className="mt-6 border-t border-[#edf0f7] pt-5">
        <h3 className="text-sm font-semibold text-[#111a38]">Signed in on</h3>
        <p className="mt-1 text-xs text-slate-500">This browser · ITrack desktop on IT-DSK-0003</p>
        <button type="button" className="mt-3 rounded-full border border-[#dce2ef] px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          Sign out everywhere
        </button>
      </div>
    </section>
  )
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    ticketAtRisk: true,
    ticketBreaches: true,
    newGatePass: true,
    stockMinimum: true,
    weeklyReport: false,
  })
  const toggle = (key, value) => setSettings((current) => ({ ...current, [key]: value }))
  const options = [
    ['ticketAtRisk', 'A ticket of mine is at risk', 'At 75% of its time target · toast and email'],
    ['ticketBreaches', 'Any ticket breaches its target', 'IT Admin and the assignee'],
    ['newGatePass', 'New gate pass requests', 'IT Admin only · toast'],
    ['stockMinimum', 'Stock below minimum', 'Daily email at 08:00'],
    ['weeklyReport', 'Weekly report', 'Monday 07:30 email with the PDF'],
  ]
  return (
    <section className="rounded-2xl border border-[#e9edf6] bg-white p-5 sm:p-6">
      <h2 className="text-base font-bold text-[#111a38]">Notification preferences</h2>
      <p className="mt-1 text-xs text-slate-500">Choose what ITrack should bring to your attention.</p>
      <div className="mt-4">
        {options.map(([key, title, description], index) => (
          <ToggleRow
            key={key}
            title={title}
            description={description}
            checked={settings[key]}
            onChange={(value) => toggle(key, value)}
            isLast={index === options.length - 1}
          />
        ))}
      </div>
    </section>
  )
}

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('Profile')
  const ActiveIcon = TABS.find((tab) => tab.label === activeTab)?.Icon ?? UserRound

  return (
    <div className="min-h-full px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div>
        <div className="flex items-center gap-2">
          <ActiveIcon size={19} className="text-[#3155ff]" />
          <h1 className="text-2xl font-bold tracking-tight text-[#111a3b]">Settings</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">Your account, security, and notification preferences.</p>
      </div>
      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-[#e4e9f2]">
        {TABS.map(({ label, Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveTab(label)}
            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold ${
              activeTab === label ? 'border-[#3155ff] text-[#3155ff]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>
      <div className="mt-4 max-w-4xl">
        {activeTab === 'Profile' && <ProfileSettings user={user} />}
        {activeTab === 'Security' && <SecuritySettings />}
        {activeTab === 'Notifications' && <NotificationSettings />}
      </div>
    </div>
  )
}
