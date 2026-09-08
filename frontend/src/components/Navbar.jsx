import React from 'react';
import { ShieldAlert, Activity, Radio, AlertTriangle, Bell, MapPin, Send } from 'lucide-react';

export default function Navbar({ 
  totalZones = 0, 
  criticalZones = 0, 
  activeTab = 'dashboard', 
  setActiveTab,
  onTriggerTestAlert,
  sendingTestAlert = false
}) {
  return (
    <header className="bg-[#1F3864] text-white shadow-lg border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="bg-[#1F9D75] p-2 rounded-lg shadow-md flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">GiriRakshak</span>
                <span className="text-xs bg-[#E8703A] text-white px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                  SIH Prototype
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                AI Landslide Early Warning System • Assam & Meghalaya (NH-44 / NH-37)
              </p>
            </div>
          </div>

          {/* Center Tabs */}
          <nav className="hidden md:flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-white/15 text-white shadow-sm border border-white/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Activity className="h-4 w-4 text-[#1F9D75]" />
              <span>GIS Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'alerts'
                  ? 'bg-white/15 text-white shadow-sm border border-white/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bell className="h-4 w-4 text-[#E8703A]" />
              <span>Alerts Log</span>
              {criticalZones > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.2 rounded-full font-bold">
                  {criticalZones}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'reports'
                  ? 'bg-white/15 text-white shadow-sm border border-white/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Radio className="h-4 w-4 text-emerald-400" />
              <span>Field Reports</span>
            </button>
          </nav>

          {/* Right KPIs & Test Action */}
          <div className="flex items-center space-x-4">
            
            {/* Monitored Zones Pill */}
            <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-sky-400" />
              <div className="text-left">
                <div className="text-xs text-slate-400 leading-none">Monitored</div>
                <div className="text-sm font-bold text-white leading-tight">{totalZones} Zones</div>
              </div>
            </div>

            {/* Critical Zones Pill */}
            <div className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 border ${
              criticalZones > 0 
                ? 'bg-red-950/60 border-red-700 text-red-300' 
                : 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
            }`}>
              <AlertTriangle className={`h-4 w-4 ${criticalZones > 0 ? 'text-red-400 animate-bounce' : 'text-emerald-400'}`} />
              <div className="text-left">
                <div className="text-xs opacity-75 leading-none">Critical Threat</div>
                <div className="text-sm font-bold leading-tight">{criticalZones} Active</div>
              </div>
            </div>

            {/* Manual Test SMS button */}
            <button
              onClick={onTriggerTestAlert}
              disabled={sendingTestAlert}
              className="hidden lg:flex items-center space-x-1.5 bg-[#E8703A] hover:bg-[#d45f2a] text-white px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition shadow disabled:opacity-50"
              title="Dispatches an instant emergency SMS alert simulation"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{sendingTestAlert ? 'Sending...' : 'Test SMS Alert'}</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
