import React from 'react';
import { 
  AlertTriangle, Target, Radio, ArrowRight, ShieldAlert, 
  Map, Activity, WifiOff, BellRing, CheckCircle2, ChevronRight 
} from 'lucide-react';

export default function SolutionMatrix({ onNavigateTab, onSelectZone }) {
  const problems = [
    {
      id: "isolation",
      problemTitle: "Chronic Highway Isolation",
      problemDesc: "Severe monsoons sever NH-6 (old NH-44) and NH-37 without warning, stranding essential supply lines and cutting off Tripura, Mizoram, and Barak Valley for weeks.",
      tag: "Problem #1: Corridor Breakdown",
      tagColor: "bg-red-100 text-red-800 border-red-200",
      solutionHeadline: "Real-Time Risk Map + 3-6hr Advance Alerts",
      solutionDetail: "Continuous telemetry synthesizes IMD rain bulletins and spatial 3-NN cluster hazards, projecting slope failure 3-6 hours before road obstruction.",
      solvedIcon: Map,
      solvedColor: "text-red-600 bg-red-50",
      cardBorder: "border-red-200 hover:border-red-300",
      cardBg: "bg-gradient-to-br from-white via-red-50/20 to-white",
      actionLabel: "View on Zones Map",
      actionIcon: ArrowRight,
      actionClick: () => {
        if (onNavigateTab) onNavigateTab('dashboard');
      }
    },
    {
      id: "generic_data",
      problemTitle: "Outdated & Generic Data",
      problemDesc: "Conventional advisories rely on district-level averages and static maps that fail to identify specific slope failure thresholds along road cuts.",
      tag: "Problem #2: Spatial Resolution",
      tagColor: "bg-blue-100 text-blue-800 border-blue-200",
      solutionHeadline: "Hyper-Local 30m-Grid Predictions Recalibrated Per Zone",
      solutionDetail: "Trained Random Forest AI engine recalibrates risk dynamically per monitoring point using SRTM 30m elevation and 24h/72h rainfall saturation (not generic national thresholds).",
      solvedIcon: Target,
      solvedColor: "text-blue-600 bg-blue-50",
      cardBorder: "border-blue-200 hover:border-blue-300",
      cardBg: "bg-gradient-to-br from-white via-blue-50/20 to-white",
      actionLabel: "Inspect Zone Risk History & SHAP",
      actionIcon: ArrowRight,
      actionClick: () => {
        if (onSelectZone) onSelectZone(5); // Default to Sonapur Tunnel or active zone
        else if (onNavigateTab) onNavigateTab('dashboard');
      }
    },
    {
      id: "operational_gaps",
      problemTitle: "Critical Operational Gaps (Sensor Cost + Outages)",
      problemDesc: "Physical slope sensors cost ₹10–25 Lakhs per slope and fail when telecom towers lose power during monsoon storm landslides.",
      tag: "Problem #3: Resilience & Cost",
      tagColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      solutionHeadline: "Sensor-Free Satellite Ingestion + Offline PWA + SMS Fallback",
      solutionDetail: "Operates sensor-free via open Sentinel-2 & IMD feeds. Field workers report ground cracks offline via browser localStorage, and alerts dispatch via carrier SMS without internet.",
      solvedIcon: WifiOff,
      solvedColor: "text-[#1F9D75] bg-emerald-50",
      cardBorder: "border-emerald-200 hover:border-emerald-300",
      cardBg: "bg-gradient-to-br from-white via-emerald-50/20 to-white",
      actionLabel: "Try Offline Field Reports & Alerts",
      actionIcon: ArrowRight,
      actionClick: () => {
        if (onNavigateTab) onNavigateTab('reports');
      }
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#1F9D75] bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full mb-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Problem-Solution Traceability</span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            How GiriRakshak Solves the 3 Core Challenges
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Explicitly tracing every operational problem to an active, clickable prototype feature.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full self-start sm:self-center">
          3 / 3 Challenges Addressed
        </span>
      </div>

      {/* 3 Interactive Solution Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {problems.map((p) => {
          const SolvedIcon = p.solvedIcon;
          return (
            <div
              key={p.id}
              className={`rounded-xl border ${p.cardBorder} ${p.cardBg} p-5 flex flex-col justify-between shadow-xs transition-all hover:shadow-md`}
            >
              <div>
                
                {/* Problem Tag & Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${p.tagColor}`}>
                    {p.tag}
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                  {p.problemTitle}
                </h3>
                
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  {p.problemDesc}
                </p>

                {/* Divider arrow */}
                <div className="my-3.5 flex items-center space-x-2 text-slate-300">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                    Solved By
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                {/* Solution Block */}
                <div className="flex items-start space-x-3 bg-white/90 p-3 rounded-lg border border-slate-100 shadow-2xs">
                  <div className={`p-2 rounded-lg ${p.solvedColor} flex-shrink-0 mt-0.5`}>
                    <SolvedIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      {p.solutionHeadline}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {p.solutionDetail}
                    </p>
                  </div>
                </div>

              </div>

              {/* Interactive Demo Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={p.actionClick}
                  className="w-full inline-flex items-center justify-between text-xs font-bold text-[#1F3864] bg-slate-100 hover:bg-[#1F3864] hover:text-white px-3 py-2 rounded-lg transition-colors group"
                >
                  <span>{p.actionLabel}</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
