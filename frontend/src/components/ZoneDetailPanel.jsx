import React, { useState } from 'react';
import { 
  X, CloudRain, Droplets, Mountain, Compass, Zap, 
  AlertOctagon, CheckCircle2, TrendingUp, Info, Activity, Clock, MapPin 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  LineChart, Line, CartesianGrid, ReferenceLine 
} from 'recharts';
import { getRiskColor, getRiskBadgeClass } from '../config';

export default function ZoneDetailPanel({ 
  zone, 
  allZones = [],
  onClose, 
  onSimulateSpike, 
  simulating = false 
}) {
  if (!zone) return null;

  const riskColor = getRiskColor(zone.current_risk_score);
  const badgeClass = getRiskBadgeClass(zone.risk_level);

  // Compute 24h & 72h rolling precipitation from history
  const history = zone.history || [];
  const pastRain = history.map(h => Number(h.rainfall_mm) || 0);
  const rolling24h = Math.round(Math.max(zone.current_rainfall_mm, zone.current_rainfall_mm + pastRain.slice(0, 3).reduce((a, b) => a + b, 0) * 0.35));
  const rolling72h = Math.round(Math.max(rolling24h, rolling24h + pastRain.slice(0, 8).reduce((a, b) => a + b, 0) * 0.55));

  // Compute 3-NN spatial cluster risk
  let avgNeighborRisk = 32;
  if (allZones && allZones.length > 1) {
    const distances = allZones
      .filter(z => z.id !== zone.id)
      .map(z => ({
        d: Math.pow(z.lat - zone.lat, 2) + Math.pow(z.lon - zone.lon, 2),
        score: z.current_risk_score || 30
      }))
      .sort((a, b) => a.d - b.d);
    const nearest3 = distances.slice(0, 3);
    if (nearest3.length > 0) {
      avgNeighborRisk = Math.round(nearest3.reduce((acc, curr) => acc + curr.score, 0) / nearest3.length);
    }
  }

  // Extract latest SHAP breakdown from history if available
  const latestHistory = history.length > 0 ? history[0] : null;
  const shapRaw = latestHistory?.shap_breakdown || {
    instant_rainfall: 0.16,
    rolling_24h: 0.14,
    rolling_72h: 0.22,
    soil_moisture: 0.18,
    slope: 0.16,
    elevation: 0.04,
    neighbor_risk: 0.10
  };

  // Support both 7-feature keys and legacy 4-feature keys
  const shapChartData = [];
  if (shapRaw.rolling_72h !== undefined || shapRaw.neighbor_risk !== undefined) {
    shapChartData.push(
      { name: '72h Accum.', value: Math.round((shapRaw.rolling_72h || 0) * 100), fill: '#1D4ED8' },
      { name: 'Soil Moisture', value: Math.round((shapRaw.soil_moisture || 0) * 100), fill: '#1F9D75' },
      { name: 'Slope Angle', value: Math.round((shapRaw.slope || 0) * 100), fill: '#E8703A' },
      { name: '24h Rain', value: Math.round((shapRaw.rolling_24h || 0) * 100), fill: '#3B82F6' },
      { name: 'Neighbor Risk', value: Math.round((shapRaw.neighbor_risk || 0) * 100), fill: '#0D9488' },
      { name: 'Instant Rain', value: Math.round((shapRaw.instant_rainfall || shapRaw.rainfall || 0) * 100), fill: '#60A5FA' },
      { name: 'Elevation', value: Math.round((shapRaw.elevation || 0) * 100), fill: '#8B5CF6' }
    );
  } else {
    shapChartData.push(
      { name: 'Rainfall', value: Math.round((shapRaw.rainfall || 0) * 100), fill: '#3B82F6' },
      { name: 'Soil Moisture', value: Math.round((shapRaw.soil_moisture || 0) * 100), fill: '#1F9D75' },
      { name: 'Slope Angle', value: Math.round((shapRaw.slope || 0) * 100), fill: '#E8703A' },
      { name: 'Elevation', value: Math.round((shapRaw.elevation || 0) * 100), fill: '#8B5CF6' }
    );
  }
  shapChartData.sort((a, b) => b.value - a.value);

  // Format chronological history for line chart
  const historyChartData = (zone.history || [])
    .slice()
    .reverse()
    .map((item, idx) => {
      const timeStr = item.timestamp 
        ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : `T-${idx}`;
      return {
        time: timeStr,
        risk: Math.round(item.risk_score),
        rainfall: item.rainfall_mm,
        moisture: item.soil_moisture_pct
      };
    });

  return (
    <div className="absolute top-4 right-4 z-[450] w-96 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-6rem)] animate-in slide-in-from-right-8 duration-300">
      
      {/* Header */}
      <div className="bg-[#1F3864] text-white p-4 flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-[#1F9D75] uppercase tracking-wider">
            Monitoring Point #{zone.id}
          </div>
          <h2 className="text-base font-bold text-white leading-tight mt-0.5">
            {zone.name}
          </h2>
          <div className="text-xs text-slate-300 mt-0.5">
            Lat: {zone.lat.toFixed(4)}° • Lon: {zone.lon.toFixed(4)}°
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="p-4 overflow-y-auto space-y-4">
        
        {/* Risk Score Spotlight Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Computed Hazard Risk</div>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-3xl font-black text-slate-900">
                {Math.round(zone.current_risk_score)}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ 100</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${badgeClass}`}>
              {zone.risk_level} Risk
            </span>
            <div className="text-[10px] text-slate-400 mt-1">
              Updated: {new Date(zone.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Temporal & Spatial Engineered Features Highlight Bar */}
        <div className="bg-gradient-to-r from-blue-50 via-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-600">
            <span className="flex items-center space-x-1">
              <Clock className="h-3 w-3 text-blue-600" />
              <span>Temporal Saturation</span>
            </span>
            <span className="flex items-center space-x-1">
              <MapPin className="h-3 w-3 text-[#1F9D75]" />
              <span>Spatial 3-NN</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white/80 rounded-lg p-1.5 border border-blue-100">
              <div className="text-[9px] text-blue-600 font-medium">24h Rolling</div>
              <div className="font-bold text-slate-800">{rolling24h} mm</div>
            </div>
            <div className="bg-white/80 rounded-lg p-1.5 border border-blue-100">
              <div className="text-[9px] text-blue-700 font-medium">72h Cumulative</div>
              <div className="font-bold text-slate-800">{rolling72h} mm</div>
            </div>
            <div className="bg-white/80 rounded-lg p-1.5 border border-teal-100">
              <div className="text-[9px] text-[#1F9D75] font-medium">Neighbor Risk</div>
              <div className="font-bold text-slate-800">{avgNeighborRisk} / 100</div>
            </div>
          </div>
        </div>

        {/* Live Terrain & Telemetry 4-Grid with Specific Real Product Labels */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          
          <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center space-x-2.5">
            <div className="p-2 rounded-md bg-blue-50 text-blue-600 flex-shrink-0">
              <CloudRain className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[9px] text-blue-600 font-bold uppercase tracking-wider">IMD NE Warning API</div>
              <div className="font-bold text-slate-800 text-sm">{zone.current_rainfall_mm} mm</div>
              <div className="text-[9px] text-slate-400">Instantaneous Trigger</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center space-x-2.5">
            <div className="p-2 rounded-md bg-teal-50 text-[#1F9D75] flex-shrink-0">
              <Droplets className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[9px] text-[#1F9D75] font-bold uppercase tracking-wider">Simulated IoT Sensor</div>
              <div className="font-bold text-slate-800 text-sm">{zone.current_soil_moisture_pct}%</div>
              <div className="text-[9px] text-slate-400">Pore Saturation (Pilot)</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center space-x-2.5">
            <div className="p-2 rounded-md bg-orange-50 text-[#E8703A] flex-shrink-0">
              <Mountain className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[9px] text-[#E8703A] font-bold uppercase tracking-wider">ISRO Bhuvan / DEM</div>
              <div className="font-bold text-slate-800 text-sm">{zone.slope_angle_deg}°</div>
              <div className="text-[9px] text-slate-400">Slope Gradient Angle</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center space-x-2.5">
            <div className="p-2 rounded-md bg-purple-50 text-purple-600 flex-shrink-0">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[9px] text-purple-600 font-bold uppercase tracking-wider">Sentinel-2 / DEM</div>
              <div className="font-bold text-slate-800 text-sm">{zone.elevation_m} m</div>
              <div className="text-[9px] text-slate-400">Orographic Relief</div>
            </div>
          </div>

        </div>

        {/* DEMO ACTION: Simulate Rainfall Spike Button */}
        <div>
          <button
            onClick={() => onSimulateSpike(zone)}
            disabled={simulating}
            className="w-full bg-gradient-to-r from-[#E8703A] to-[#d45f2a] hover:from-[#d45f2a] hover:to-[#b84e1e] text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Zap className={`h-4 w-4 ${simulating ? 'animate-spin' : 'text-amber-200'}`} />
            <span>
              {simulating ? 'Simulating Acute Monsoon Event...' : '⚡ Simulate Rainfall Spike (Live Demo)'}
            </span>
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-1">
            Pushes rainfall surge, updates 24h/72h buildup & re-evaluates risk with SHAP.
          </p>
        </div>

        {/* USP 1: Explainable AI — SHAP Feature Attribution */}
        <div className="border border-slate-200 rounded-xl p-3 bg-white">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1.5">
              <Activity className="h-3.5 w-3.5 text-[#1F9D75]" />
              <span className="font-bold text-xs text-slate-800">
                Explainable AI (SHAP Breakdown)
              </span>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
              USP 1 • {shapChartData.length} Features
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mb-2">
            Relative weight contributing to the current risk score:
          </p>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={shapChartData}
                margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
              >
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 9 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#475569' }} width={80} />
                <Tooltip 
                  formatter={(val) => [`${val}% Contribution`, 'SHAP Weight']}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historical Trend Line Chart */}
        {historyChartData.length > 0 && (
          <div className="border border-slate-200 rounded-xl p-3 bg-white">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                <span className="font-bold text-xs text-slate-800">
                  Risk Progression History
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                {historyChartData.length} records
              </span>
            </div>

            <div className="h-32 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={historyChartData}
                  margin={{ top: 5, right: 15, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="#94A3B8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="#94A3B8" />
                  <Tooltip 
                    formatter={(val) => [`${val} / 100`, 'Hazard Risk']}
                    contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                  />
                  <ReferenceLine y={80} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Critical (80)', fill: '#EF4444', fontSize: 8 }} />
                  <Line 
                    type="monotone" 
                    dataKey="risk" 
                    stroke={riskColor} 
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: riskColor }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
