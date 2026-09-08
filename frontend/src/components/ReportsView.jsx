import React, { useState, useEffect } from 'react';
import { 
  Radio, MapPin, User, FileText, CheckCircle2, Clock, 
  Wifi, WifiOff, RefreshCw, Navigation, AlertTriangle, CloudOff, Send 
} from 'lucide-react';
import { getLocalReports, saveLocalReport, syncLocalReports } from '../offlineSync';
import { API_BASE } from '../config';

export default function ReportsView({ 
  cloudReports = [], 
  onRefreshCloud, 
  zones = [] 
}) {
  const [formData, setFormData] = useState({
    reporter_name: '',
    hazard_type: 'crack',
    description: '',
    lat: 25.6025,
    lon: 91.8860,
    zone_id: zones[0]?.id || 1
  });

  const [localQueue, setLocalQueue] = useState([]);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load offline reports from localStorage
  const refreshLocalQueue = () => {
    setLocalQueue(getLocalReports());
  };

  useEffect(() => {
    refreshLocalQueue();

    const handleOnline = async () => {
      setIsOnline(true);
      setFeedbackBanner({
        type: 'info',
        text: 'Network restored! Triggering automatic synchronization of queued field reports...'
      });
      await handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setFeedbackBanner({
        type: 'warning',
        text: 'Network offline. Offline-First mode active. Submissions will be stored locally in browser.'
      });
    };

    const handleStorageUpdate = () => {
      refreshLocalQueue();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('girirakshak_storage_updated', handleStorageUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('girirakshak_storage_updated', handleStorageUpdate);
    };
  }, []);

  // Use Browser Geolocation API
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          lat: parseFloat(position.coords.latitude.toFixed(5)),
          lon: parseFloat(position.coords.longitude.toFixed(5))
        }));
        setLocating(false);
      },
      (error) => {
        console.warn("Geolocation denied or unavailable:", error);
        // Fallback to Shillong corridor coords
        setFormData(prev => ({
          ...prev,
          lat: 25.5788,
          lon: 91.8933
        }));
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // Submit Handler with Offline Resilience
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reporter_name || !formData.description) return;

    setSubmitting(true);

    const payload = {
      reporter_name: formData.reporter_name,
      hazard_type: formData.hazard_type,
      description: formData.description,
      lat: parseFloat(formData.lat),
      lon: parseFloat(formData.lon),
      zone_id: parseInt(formData.zone_id)
    };

    // If simulated offline or physically offline:
    if (simulateOffline || !navigator.onLine) {
      saveLocalReport(payload);
      setFeedbackBanner({
        type: 'offline',
        text: 'Saved offline — will sync automatically.'
      });
      setFormData(prev => ({ ...prev, description: '' }));
      setSubmitting(false);
      return;
    }

    // Attempt direct submission
    try {
      const serverPayload = {
        zone_id: payload.zone_id,
        reporter_name: payload.reporter_name,
        description: `[${payload.hazard_type.toUpperCase()}] ${payload.description}`,
        lat: payload.lat,
        lon: payload.lon,
        synced: true
      };

      const res = await fetch(`${API_BASE}/hazard-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serverPayload)
      });

      if (!res.ok) throw new Error("Server error");

      setFeedbackBanner({
        type: 'success',
        text: 'Report submitted and synchronized directly to central database!'
      });
      setFormData(prev => ({ ...prev, description: '' }));
      onRefreshCloud();
    } catch (err) {
      // Fallback to offline queue
      console.warn("Network error during submission, falling back to local queue:", err);
      saveLocalReport(payload);
      setFeedbackBanner({
        type: 'offline',
        text: 'Saved offline — will sync automatically.'
      });
      setFormData(prev => ({ ...prev, description: '' }));
    } finally {
      setSubmitting(false);
    }
  };

  // Manual trigger to sync offline queue
  const handleSync = async () => {
    setSyncing(true);
    const { syncedCount } = await syncLocalReports(API_BASE);
    refreshLocalQueue();
    await onRefreshCloud();
    setSyncing(false);

    if (syncedCount > 0) {
      setFeedbackBanner({
        type: 'success',
        text: `Successfully synced ${syncedCount} queued report(s) to cloud database!`
      });
    }
  };

  // Combine reports for display: local un-synced queue on top, then cloud reports
  const pendingCount = localQueue.filter(r => !r.synced).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Banner & Offline Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-100 rounded-lg text-[#1F9D75]">
                <Radio className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-extrabold text-slate-900">
                    Offline-First Citizen & Officer Field Reporting
                  </h1>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    USP 3
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                    PWA Ready
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Designed for remote North Eastern mountain corridors with intermittent cellular connectivity.
                </p>
              </div>
            </div>
          </div>

          {/* Network State & Demo Offline Toggle */}
          <div className="flex items-center space-x-3">
            
            {/* Live Network Status Pill */}
            <div className={`px-3 py-1.5 rounded-xl border flex items-center space-x-2 text-xs font-semibold ${
              isOnline && !simulateOffline
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              {isOnline && !simulateOffline ? (
                <>
                  <Wifi className="h-4 w-4 text-emerald-600" />
                  <span>Network Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-amber-600" />
                  <span>Offline Mode (Local Storage)</span>
                </>
              )}
            </div>

            {/* Judges Demo Toggle: Simulate Zero-Connectivity */}
            <button
              onClick={() => setSimulateOffline(!simulateOffline)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center space-x-1.5 ${
                simulateOffline
                  ? 'bg-amber-600 text-white border-amber-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Allows testing offline submission without disabling your computer's internet"
            >
              <CloudOff className="h-3.5 w-3.5" />
              <span>{simulateOffline ? 'Disable Sim. Offline' : 'Demo: Simulate Offline'}</span>
            </button>

            {/* Manual Sync Button */}
            {pendingCount > 0 && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="bg-[#1F9D75] hover:bg-[#167d5d] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>Sync Now ({pendingCount})</span>
              </button>
            )}

          </div>

        </div>

        {/* Feedback Alert Banner */}
        {feedbackBanner && (
          <div className={`mt-4 p-3 rounded-xl text-xs font-medium border flex items-center justify-between ${
            feedbackBanner.type === 'offline' 
              ? 'bg-amber-50 text-amber-900 border-amber-300' 
              : feedbackBanner.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-blue-50 text-blue-900 border-blue-300'
          }`}>
            <span>{feedbackBanner.text}</span>
            <button 
              onClick={() => setFeedbackBanner(null)} 
              className="text-slate-400 hover:text-slate-600 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Main Two-Column Grid: Form on Left, List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Field Hazard Report Submission Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
            <FileText className="h-4 w-4 text-[#1F9D75]" />
            <span>File New Hazard Observation</span>
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Submissions queue in local memory if connectivity drops.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Reporter Name */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Reporter Name / Identity
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Officer D. Sangma / Citizen Patrol"
                value={formData.reporter_name}
                onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-[#1F9D75] focus:outline-none"
              />
            </div>

            {/* Hazard Type Dropdown */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Hazard Type
              </label>
              <select
                value={formData.hazard_type}
                onChange={(e) => setFormData({ ...formData, hazard_type: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-[#1F9D75] focus:outline-none bg-white font-medium text-slate-800"
              >
                <option value="crack">Tension Ground Crack</option>
                <option value="debris">Falling Rocks / Mud Debris</option>
                <option value="blocked_road">Blocked Road / Highway Culvert</option>
                <option value="other">Other Slope Movement / Spring Seepage</option>
              </select>
            </div>

            {/* Highway Corridor Sector */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Monitored Highway Sector
              </label>
              <select
                value={formData.zone_id}
                onChange={(e) => {
                  const z = zones.find(item => item.id === parseInt(e.target.value));
                  setFormData({
                    ...formData,
                    zone_id: e.target.value,
                    lat: z ? z.lat : formData.lat,
                    lon: z ? z.lon : formData.lon
                  });
                }}
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-[#1F9D75] focus:outline-none bg-white font-medium text-slate-800"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} (Risk: {z.current_risk_score})
                  </option>
                ))}
              </select>
            </div>

            {/* Coordinates with "Use My Location" */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">GPS Coordinates</span>
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={locating}
                  className="inline-flex items-center space-x-1 text-[#1F9D75] hover:text-[#167d5d] font-bold text-[11px] disabled:opacity-50"
                >
                  <Navigation className={`h-3 w-3 ${locating ? 'animate-spin' : ''}`} />
                  <span>{locating ? 'Acquiring GPS...' : 'Use My Location'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase block mb-0.5">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase block mb-0.5">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.lon}
                    onChange={(e) => setFormData({ ...formData, lon: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Hazard Description */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Hazard Description & Ground Context
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. 5cm wide diagonal fracture observed across NH-6 retaining wall after 2hr heavy downpour."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-[#1F9D75] focus:outline-none"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1F3864] hover:bg-[#16294a] text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow transition"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? 'Processing...' : 'Submit Hazard Report'}</span>
            </button>

          </form>
        </div>

        {/* Right: Field Reports Stream with Synced / Pending Badges (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>Ground Observation Reports</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                {cloudReports.length + pendingCount} total
              </span>
            </h2>

            <button
              onClick={onRefreshCloud}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Pending Local Queue Banner */}
          {pendingCount > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                <span className="text-xs text-amber-900 font-semibold">
                  {pendingCount} report(s) stored locally in browser offline queue
                </span>
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg font-bold transition"
              >
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          )}

          {/* Reports Feed */}
          <div className="space-y-3">
            
            {/* 1. Show Unsynced Local Reports on top */}
            {localQueue.filter(r => !r.synced).map((item) => (
              <div 
                key={item.id}
                className="bg-amber-50/70 border-2 border-amber-300 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-amber-700" />
                    <span className="font-bold text-sm text-slate-900">{item.reporter_name}</span>
                    <span className="text-[10px] uppercase font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                      {item.hazard_type || 'HAZARD'}
                    </span>
                  </div>

                  {/* Pending Badge */}
                  <span className="text-[10px] bg-amber-500 text-white font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-sm">
                    <Clock className="h-3 w-3" />
                    <span>Pending Sync (Offline)</span>
                  </span>
                </div>

                <p className="text-xs text-slate-700 mt-2 font-medium bg-white/80 p-2.5 rounded-lg border border-amber-200">
                  "{item.description}"
                </p>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center space-x-1 font-mono">
                    <MapPin className="h-3 w-3 text-amber-600" />
                    <span>{item.lat.toFixed(4)}°, {item.lon.toFixed(4)}°</span>
                  </span>
                  <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}

            {/* 2. Show Cloud Synced Reports */}
            {cloudReports.map((report) => (
              <div 
                key={report.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 transition hover:shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="font-bold text-sm text-slate-900">{report.reporter_name}</span>
                  </div>

                  {/* Synced Badge */}
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span>Synced to Cloud</span>
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  "{report.description}"
                </p>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1 font-mono">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span>{report.lat.toFixed(4)}°, {report.lon.toFixed(4)}°</span>
                  </span>
                  <span>
                    {new Date(report.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                    {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {cloudReports.length === 0 && pendingCount === 0 && (
              <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
                <p className="text-xs text-slate-500">No field reports submitted yet. Use the form to file an observation.</p>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
