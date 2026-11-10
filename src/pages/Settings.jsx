import { useState } from "react";

// Reusable toggle component for settings rows
function ToggleRow({ title, description, checked, onChange, isLast }) {
  return (
    <div className={`flex items-center justify-between py-5 ${!isLast ? 'border-b border-slate-100' : ''}`}>
      <div className="pr-4">
        <h3 className="text-[15px] font-bold text-[#111a38] leading-snug mb-0.5">{title}</h3>
        <p className="text-[13px] font-medium text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-[#3155ff]' : 'bg-slate-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("My signature");
  const [pin, setPin] = useState("....");
  
  // Settings State
  const [settings, setSettings] = useState({
    openOnStart: true,
    keepInTray: true,
    ticketAtRisk: true,
    ticketBreaches: true,
    newGatePass: true,
    quietHours: true
  });

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const navItems = ["My signature", "Start-up", "Notifications", "Gate station", "Account"];

  return (
    <main className="min-h-screen bg-[#0B184C] p-4 sm:p-6 lg:p-8 font-sans text-slate-800 flex items-center justify-center">
      {/* MAIN CONTAINER[cite: 7] */}
      <div className="flex h-[calc(100vh-4rem)] w-full max-w-[1400px] overflow-hidden rounded-[32px] bg-[#f4f6fc] shadow-2xl">
        
        {/* SIDEBAR[cite: 7] */}
        <aside className="w-64 shrink-0 bg-[#f4f6fc] p-8 pr-4">
          <h1 className="mb-6 text-2xl font-bold tracking-tight text-[#111a38]">Settings</h1>
          <nav className="flex flex-col gap-1">
            {navItems.map(item => (
              <button
                key={item}
                onClick={() => setActiveTab(item)}
                className={`px-4 py-2.5 text-left text-sm font-semibold transition-colors rounded-xl ${
                  activeTab === item 
                    ? "bg-[#e5ecfa] text-[#3155ff]" 
                    : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-800"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        {/* SCROLLABLE CONTENT AREA[cite: 7] */}
        <div className="flex-1 overflow-y-auto p-8 pl-4 pr-10">
          <div className="mx-auto max-w-4xl space-y-6">
            
            {/* MY SIGNATURE CARD[cite: 7] */}
            <section className="rounded-3xl bg-white p-7 shadow-sm">
              <h2 className="mb-2 text-lg font-bold text-[#111a38]">My signature</h2>
              
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
                {/* Left Side: Signature Input[cite: 7] */}
                <div>
                  <p className="mb-5 text-[13px] text-slate-500 leading-relaxed">
                    Goes on every gate pass and checkout you issue. Applying it always asks for your PIN. Passes you already signed keep the old copy if you change it.
                  </p>
                  
                  <div className="mb-4 flex h-32 flex-col justify-end rounded-2xl border-2 border-dashed border-slate-200 p-4">
                    <div className="w-full border-b border-slate-200"></div>
                    <span className="mt-1 text-xs font-medium text-slate-300">Sign above the line</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <button className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      Clear
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">PIN</span>
                      <input 
                        type="password" 
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-16 rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-bold tracking-widest outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <button className="rounded-full bg-[#3155ff] px-6 py-2 text-sm font-bold text-white shadow-md transition hover:bg-blue-600">
                      Save signature
                    </button>
                  </div>
                </div>

                {/* Right Side: Current Signature[cite: 7] */}
                <div className="border-t border-slate-100 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                  <h3 className="mb-3 text-sm font-bold text-[#111a38]">Current signature</h3>
                  
                  {/* Mock Signature SVG */}
                  <div className="mb-4 h-16 w-full">
                    <svg viewBox="0 0 200 50" className="h-full w-full stroke-[#111a38]" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10,30 Q30,10 50,30 T90,30 T130,20 T180,25" />
                    </svg>
                  </div>
                  
                  <div className="space-y-1.5 text-xs text-slate-400 font-medium">
                    <p>Set 2 Sep 2026 · used on 41 passes</p>
                    <p className="font-mono text-[10px]">sha256 9f3c..a71e</p>
                    <p className="pt-2 leading-relaxed">
                      Only you can replace it. IT Admin can revoke it if you leave.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* START-UP CARD[cite: 7] */}
            <section className="rounded-3xl bg-white p-7 shadow-sm">
              <h2 className="mb-1 text-lg font-bold text-[#111a38]">Start-up</h2>
              <div className="flex flex-col">
                <ToggleRow 
                  title="Open ITrack when Windows starts"
                  description="Signs you in with this workstation's saved sign-in."
                  checked={settings.openOnStart}
                  onChange={(val) => updateSetting("openOnStart", val)}
                  isLast={false}
                />
                <ToggleRow 
                  title="Keep running in the tray when closed"
                  description="You still get SLA and gate alerts."
                  checked={settings.keepInTray}
                  onChange={(val) => updateSetting("keepInTray", val)}
                  isLast={true}
                />
              </div>
            </section>

            {/* NOTIFICATIONS CARD[cite: 7] */}
            <section className="rounded-3xl bg-white p-7 shadow-sm">
              <h2 className="mb-1 text-lg font-bold text-[#111a38]">Notifications</h2>
              <div className="flex flex-col">
                <ToggleRow 
                  title="A ticket of mine is at risk"
                  description="At 75% of its time target."
                  checked={settings.ticketAtRisk}
                  onChange={(val) => updateSetting("ticketAtRisk", val)}
                  isLast={false}
                />
                <ToggleRow 
                  title="Any ticket breaches its target"
                  description="IT Admin and the assignee."
                  checked={settings.ticketBreaches}
                  onChange={(val) => updateSetting("ticketBreaches", val)}
                  isLast={false}
                />
                <ToggleRow 
                  title="New gate pass requests"
                  description="IT Admin only."
                  checked={settings.newGatePass}
                  onChange={(val) => updateSetting("newGatePass", val)}
                  isLast={false}
                />
                <ToggleRow 
                  title="Quiet hours, 18:00 to 07:00"
                  description="Mutes non-critical alerts overnight."
                  checked={settings.quietHours}
                  onChange={(val) => updateSetting("quietHours", val)}
                  isLast={true}
                />
              </div>
            </section>
            
          </div>
        </div>
      </div>
    </main>
  );
}