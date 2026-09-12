import React, { useState } from 'react';
import { 
  Bell, AlertOctagon, PhoneCall, Radio, Send, RefreshCw, 
  CheckCircle2, FileCode, Copy, Check, Download, X, ExternalLink, ShieldAlert, Cpu 
} from 'lucide-react';
import { getRiskColor, getRiskBadgeClass } from '../config';
import { apiExportCapAlert, formatClientCAPXml } from '../api';

export default function AlertsView({ 
  alerts = [], 
  loading = false, 
  onRefresh, 
  onTriggerTestAlert, 
  sendingTestAlert = false 
}) {
  const [selectedCapXml, setSelectedCapXml] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loadingCap, setLoadingCap] = useState(false);

  const handleOpenCapModal = async (alert) => {
    setSelectedAlert(alert);
    setLoadingCap(true);
    try {
      const xml = await apiExportCapAlert(alert.id, alert, alert.zones);
      setSelectedCapXml(xml);
    } catch (e) {
      setSelectedCapXml(formatClientCAPXml(alert, alert.zones));
    } finally {
      setLoadingCap(false);
    }
  };

  const handleCopyXml = () => {
    if (!selectedCapXml) return;
    navigator.clipboard.writeText(selectedCapXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadXml = () => {
    if (!selectedCapXml) return;
    const blob = new Blob([selectedCapXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cap_alert_${selectedAlert?.id || 'export'}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                Dissemination Audit Log & SMS Broadcasts
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Out-of-band alerts automatically dispatched when hazard risk exceeds 80 (Critical)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Log</span>
          </button>

          <button
            onClick={onTriggerTestAlert}
            disabled={sendingTestAlert}
            className="flex items-center space-x-1.5 bg-[#E8703A] hover:bg-[#d45f2a] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{sendingTestAlert ? 'Transmitting...' : 'Dispatch Test Alert'}</span>
          </button>
        </div>
      </div>

      {/* Government Integration / NDMA SACHET Platform Callout Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 shadow-xs flex items-start space-x-3.5">
        <div className="p-2 bg-[#1F3864] text-white rounded-xl flex-shrink-0 mt-0.5 shadow-sm">
          <ShieldAlert className="h-5 w-5 text-sky-300" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-extrabold text-[#1F3864] uppercase tracking-wider">
              Government Integration • NDMA SACHET Standard Compliance
            </h3>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
              OASIS CAP v1.2 / ITU-T X.1303
            </span>
          </div>
          <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-medium">
            <strong>In production, this CAP-formatted alert would be submitted to NDMA's SACHET platform, so GiriRakshak's warnings reach the public through India's existing official alert infrastructure rather than a separate, siloed app.</strong>
          </p>
          <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>• Direct upstream feed to NDMA / ASDMA command centers</span>
            <span>• Standardized interoperability with IMD, CWC & GSI feeds</span>
            <span>• Disseminated via Pan-India Cell Broadcast & sirens</span>
          </div>
        </div>
      </div>

      {/* Alerts Stream */}
      {alerts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Emergency Alerts Dispatched Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Emergency SMS broadcasts trigger automatically when a monitored highway sector crosses the 80/100 risk threshold.
          </p>
          <button
            onClick={onTriggerTestAlert}
            className="mt-4 inline-flex items-center space-x-1.5 text-xs font-semibold text-[#1F9D75] hover:underline"
          >
            <span>Simulate test SMS alert now</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const riskColor = getRiskColor(alert.risk_score);
            const zoneName = alert.zones?.name || `Monitoring Zone #${alert.zone_id}`;

            return (
              <div 
                key={alert.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 transition hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3.5 flex-1">
                  <div className="p-2.5 rounded-xl bg-red-50 text-red-600 mt-0.5 border border-red-100 flex-shrink-0">
                    <AlertOctagon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{zoneName}</span>
                      <span 
                        className="text-[11px] font-extrabold px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: riskColor }}
                      >
                        Risk: {Math.round(alert.risk_score)}/100
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium border border-slate-200 flex items-center space-x-1">
                        <PhoneCall className="h-3 w-3 text-emerald-600" />
                        <span>{alert.channel}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1.5 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100 break-words">
                      "{alert.message}"
                    </p>

                    {/* CAP XML Action Button */}
                    <div className="mt-2.5 flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenCapModal(alert)}
                        className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-md transition"
                      >
                        <FileCode className="h-3.5 w-3.5 text-blue-600" />
                        <span>View CAP XML (NDMA SACHET)</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-left md:text-right flex-shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                  <div className="text-xs font-medium text-slate-700">
                    {new Date(alert.sent_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(alert.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <span className="inline-block text-[10px] text-emerald-600 font-semibold mt-1">
                    ✓ Dispatched & Logged
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CAP XML Viewer Modal */}
      {selectedCapXml && (
        <div className="fixed inset-0 z-[650] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-[#1F3864] text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-[#1F9D75] rounded-lg text-white">
                  <FileCode className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    OASIS CAP v1.2 XML Payload (NDMA SACHET Format)
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    ITU-T Recommendation X.1303 Open Standard • Upstream Alert Feed
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCapXml(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Note banner inside modal */}
            <div className="bg-amber-50 px-6 py-2.5 border-b border-amber-200 text-xs text-amber-800 flex items-center justify-between">
              <span>
                <strong>NDMA SACHET Protocol:</strong> In production, this payload is POSTed directly to the national gateway.
              </span>
              <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                <button
                  onClick={handleCopyXml}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white border border-amber-300 text-amber-900 text-[11px] font-bold hover:bg-amber-100 transition shadow-2xs"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied!' : 'Copy XML'}</span>
                </button>
                <button
                  onClick={handleDownloadXml}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white border border-amber-300 text-amber-900 text-[11px] font-bold hover:bg-amber-100 transition shadow-2xs"
                >
                  <Download className="h-3 w-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Formatted Code Block */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-900 text-emerald-300 font-mono text-xs leading-relaxed selection:bg-emerald-800 selection:text-white">
              <pre className="whitespace-pre-wrap break-all">
                {selectedCapXml}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Target Platform: <strong>NDMA SACHET Integrated Early Warning Platform</strong></span>
              <button
                onClick={() => setSelectedCapXml(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition text-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
