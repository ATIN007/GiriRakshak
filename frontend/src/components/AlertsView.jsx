import React from 'react';
import { Bell, AlertOctagon, PhoneCall, Radio, Send, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getRiskColor, getRiskBadgeClass } from '../config';

export default function AlertsView({ 
  alerts = [], 
  loading = false, 
  onRefresh, 
  onTriggerTestAlert, 
  sendingTestAlert = false 
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
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
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-red-50 text-red-600 mt-0.5 border border-red-100">
                    <AlertOctagon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
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

                    <p className="text-xs text-slate-600 mt-1.5 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{alert.message}"
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-medium text-slate-700">
                    {new Date(alert.sent_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(alert.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <span className="inline-block text-[10px] text-emerald-600 font-semibold mt-1">
                    ✓ Transmitted
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
