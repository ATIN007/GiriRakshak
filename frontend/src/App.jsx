import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import ZoneDetailPanel from './components/ZoneDetailPanel';
import AlertsView from './components/AlertsView';
import ReportsView from './components/ReportsView';
import MethodologyView from './components/MethodologyView';
import { 
  apiFetchZones, 
  apiFetchZoneDetails, 
  apiSimulateZone, 
  apiFetchAlerts, 
  apiFetchReports, 
  apiSendTestAlert 
} from './api';
import { syncLocalReports, getLocalReports } from './offlineSync';
import { AlertTriangle, CheckCircle, BellRing, Sparkles, Loader2, RefreshCw } from 'lucide-react';

export default function App() {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [sendingTestAlert, setSendingTestAlert] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Trigger temporary notification toast
  const showToast = (title, message, type = 'info') => {
    setToastMessage({ title, message, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // 1. Fetch Zones (Direct Supabase + Backend Hybrid)
  const fetchZones = async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    try {
      const data = await apiFetchZones();
      setZones(data);

      // If a zone is active, refresh its details quietly
      if (selectedZone) {
        const updated = data.find(z => z.id === selectedZone.id);
        if (updated) {
          fetchZoneDetails(updated.id, true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch zones:", err);
      showToast("Telemetry Notice", "Retrying telemetry connection...", "warning");
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  };

  // 2. Fetch Zone Details (with history & SHAP)
  const fetchZoneDetails = async (zoneId, isSilent = false) => {
    try {
      const data = await apiFetchZoneDetails(zoneId);
      setSelectedZone(data);
    } catch (err) {
      console.error(`Failed to fetch zone ${zoneId} details:`, err);
      if (!isSilent) {
        showToast("Zone Telemetry Warning", "Unable to load real-time SHAP history for this sector.", "error");
      }
    }
  };

  // 3. Fetch Alerts Log
  const fetchAlerts = async () => {
    try {
      const data = await apiFetchAlerts();
      setAlerts(data);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    }
  };

  // 4. Fetch Hazard Reports
  const fetchReports = async () => {
    try {
      const data = await apiFetchReports();
      setReports(data);
    } catch (err) {
      console.error("Failed to fetch hazard reports:", err);
    }
  };

  // Initial Boot & Recurring Auto-Sync
  useEffect(() => {
    fetchZones();
    fetchAlerts();
    fetchReports();

    // Auto-sync offline reports if online upon boot
    if (navigator.onLine) {
      syncLocalReports().then(({ syncedCount }) => {
        if (syncedCount > 0) {
          fetchReports();
          showToast(
            "Auto-Sync Complete", 
            `Synchronized ${syncedCount} queued field report(s) to central database.`,
            "success"
          );
        }
      });
    }

    // Periodic check every 15s: auto-sync local queue if connection is healthy
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        const local = getLocalReports();
        if (local.some(r => !r.synced)) {
          syncLocalReports().then(({ syncedCount }) => {
            if (syncedCount > 0) fetchReports();
          });
        }
      }
    }, 15000);

    return () => clearInterval(syncInterval);
  }, []);

  // Handle marker click
  const handleSelectZone = (zone) => {
    fetchZoneDetails(zone.id);
  };

  // DEMO ACTION: Instantaneous state update on Simulate Rainfall Spike
  const handleSimulateSpike = async (zone) => {
    if (!zone) return;
    setSimulating(true);

    try {
      // Calculate realistic acute monsoon surge
      const newRainfall = Math.min(260, Math.round(zone.current_rainfall_mm + 60 + Math.random() * 30));
      const newMoisture = Math.min(98, Math.round(zone.current_soil_moisture_pct + 20 + Math.random() * 15));

      const result = await apiSimulateZone(zone, newRainfall, newMoisture);
      const newScore = result.prediction.risk_score;
      const newLevel = result.prediction.risk_level;
      const newShap = result.prediction.shap_breakdown;
      const nowIso = new Date().toISOString();

      // OPTIMISTIC & IMMEDIATE LOCAL UPDATE (< 100ms UI response)
      setZones(prev => prev.map(z => z.id === zone.id ? {
        ...z,
        current_rainfall_mm: newRainfall,
        current_soil_moisture_pct: newMoisture,
        current_risk_score: newScore,
        risk_level: newLevel,
        last_updated: nowIso
      } : z));

      setSelectedZone(prev => ({
        ...prev,
        current_rainfall_mm: newRainfall,
        current_soil_moisture_pct: newMoisture,
        current_risk_score: newScore,
        risk_level: newLevel,
        last_updated: nowIso,
        history: [
          {
            timestamp: nowIso,
            risk_score: newScore,
            rainfall_mm: newRainfall,
            soil_moisture_pct: newMoisture,
            slope_angle_deg: prev.slope_angle_deg,
            shap_breakdown: newShap
          },
          ...(prev.history || [])
        ]
      }));

      // Refresh alerts in background
      fetchAlerts();

      if (result.alert_dispatched) {
        showToast(
          "🚨 CRITICAL ALERT DISPATCHED",
          `Hazard threshold exceeded (Risk: ${newScore}/100). Emergency SMS broadcast queued!`,
          "critical"
        );
      } else {
        showToast(
          "⚡ Telemetry Updated",
          `Rainfall surged to ${newRainfall}mm. New Risk: ${newScore}/100 (${newLevel})`,
          "success"
        );
      }
    } catch (err) {
      console.error("Simulation error:", err);
      showToast("Simulation Notice", err.message, "error");
    } finally {
      setSimulating(false);
    }
  };

  // Trigger test SMS alert
  const handleTriggerTestAlert = async () => {
    setSendingTestAlert(true);
    try {
      const targetId = selectedZone ? selectedZone.id : 5;
      await apiSendTestAlert(targetId, '+91-9876543210');
      await fetchAlerts();
      showToast(
        "📲 Emergency SMS Broadcast Sent",
        "Test alert transmitted to district disaster response authorities.",
        "success"
      );
    } catch (err) {
      console.error("Test alert error:", err);
      showToast("Alert Dispatch Warning", "Logged alert to dissemination record.", "error");
    } finally {
      setSendingTestAlert(false);
    }
  };

  const criticalCount = zones.filter(z => z.current_risk_score > 80).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-[#1F9D75] selection:text-white">
      
      {/* Top Navigation Bar */}
      <Navbar
        totalZones={zones.length}
        criticalZones={criticalCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTriggerTestAlert={handleTriggerTestAlert}
        sendingTestAlert={sendingTestAlert}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[999] max-w-sm animate-in slide-in-from-top-4 duration-300">
          <div className={`p-4 rounded-xl shadow-2xl border flex items-start space-x-3 ${
            toastMessage.type === 'critical'
              ? 'bg-red-600 text-white border-red-700'
              : toastMessage.type === 'success'
              ? 'bg-[#1F9D75] text-white border-emerald-700'
              : toastMessage.type === 'error'
              ? 'bg-amber-600 text-white border-amber-700'
              : 'bg-slate-900 text-white border-slate-800'
          }`}>
            <BellRing className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-xs uppercase tracking-wider">{toastMessage.title}</div>
              <div className="text-xs opacity-95 mt-0.5">{toastMessage.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative">
        
        {/* Loading Overlay for Initial Boot */}
        {initialLoading && (
          <div className="absolute inset-0 z-[500] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-[#1F3864] animate-spin" />
            <div className="text-sm font-bold text-slate-800">
              Connecting to GiriRakshak Neural Grid...
            </div>
            <p className="text-xs text-slate-500">
              Loading NH-44 & NH-37 highway monitoring sensors & ML models
            </p>
          </div>
        )}

        {/* Tab 1: GIS Map Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="relative w-full h-full">
            <MapView
              zones={zones}
              selectedZone={selectedZone}
              onSelectZone={handleSelectZone}
            />

            {selectedZone && (
              <ZoneDetailPanel
                zone={selectedZone}
                onClose={() => setSelectedZone(null)}
                onSimulateSpike={handleSimulateSpike}
                simulating={simulating}
              />
            )}
          </div>
        )}

        {/* Tab 2: Alerts Log */}
        {activeTab === 'alerts' && (
          <AlertsView
            alerts={alerts}
            loading={refreshing}
            onRefresh={fetchAlerts}
            onTriggerTestAlert={handleTriggerTestAlert}
            sendingTestAlert={sendingTestAlert}
          />
        )}

        {/* Tab 3: Offline-First Field Reports */}
        {activeTab === 'reports' && (
          <ReportsView
            cloudReports={reports}
            onRefreshCloud={fetchReports}
            zones={zones}
          />
        )}

        {/* Tab 4: Data Sources & Methodology */}
        {activeTab === 'methodology' && (
          <MethodologyView
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}

      </main>

    </div>
  );
}
