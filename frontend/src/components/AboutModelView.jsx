import React, { useState, useEffect } from 'react';
import { 
  Cpu, Award, CheckCircle2, TrendingUp, Clock, MapPin, 
  Layers, BarChart2, ShieldCheck, ArrowRight, Zap, Info, ChevronRight 
} from 'lucide-react';
import { apiFetchModelBenchmark, DEFAULT_MODEL_BENCHMARK } from '../api';
import ReferencesSection from './ReferencesSection';

export default function AboutModelView({ onBackToDashboard }) {
  const [benchmark, setBenchmark] = useState(DEFAULT_MODEL_BENCHMARK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiFetchModelBenchmark().then((data) => {
      if (isMounted && data) {
        setBenchmark(data);
      }
    }).finally(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const modelsList = benchmark?.models ? Object.values(benchmark.models) : [];
  const winner = benchmark?.winner || "Random Forest";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Header Banner */}
      <div className="bg-[#1F3864] text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden mb-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-[#1F9D75] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Cpu className="h-3.5 w-3.5" />
            <span>AI Architecture & Model Benchmarks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            About the GiriRakshak AI Model
          </h1>
          <p className="text-slate-200 text-xs sm:text-sm mt-2 leading-relaxed">
            Multi-model evaluation and geotechnical feature engineering incorporating 
            temporal rainfall saturation, spatial neighborhood correlation, and SHAP explainability.
          </p>
        </div>

        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
          <Cpu className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* Champion Model Winner Callout */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-[#1F9D75] text-white rounded-xl shadow-md">
              <Award className="h-7 w-7" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Selected Champion Model
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Holdout Split: 25% (625 test events)
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                {winner} (Ensemble Bagging Architecture)
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                {benchmark.winner_reason || "Selected for optimal F1 performance across critical disaster recall and operational false-alarm precision."}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm border border-emerald-200 rounded-xl px-4 py-3 shadow-xs flex-shrink-0">
            <div className="text-center px-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Accuracy</div>
              <div className="text-lg font-black text-slate-900">
                {benchmark.models?.[winner]?.metrics?.accuracy ? (benchmark.models[winner].metrics.accuracy * 100).toFixed(1) + '%' : '84.2%'}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center px-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Recall (Safety)</div>
              <div className="text-lg font-black text-[#1F9D75]">
                {benchmark.models?.[winner]?.metrics?.recall ? (benchmark.models[winner].metrics.recall * 100).toFixed(1) + '%' : '78.6%'}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center px-2">
              <div className="text-[10px] text-[#E8703A] font-bold uppercase">F1-Score</div>
              <div className="text-lg font-black text-[#E8703A]">
                {benchmark.models?.[winner]?.metrics?.f1 ? benchmark.models[winner].metrics.f1.toFixed(4) : '0.8063'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-10">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <BarChart2 className="h-4 w-4 text-[#1F3864]" />
              <span>3-Model Head-to-Head Comparison</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Trained on identical 2,500 geotechnical sample records with 7 physical, temporal, and spatial features.
            </p>
          </div>
          <span className="text-[11px] bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-semibold">
            Evidence-Based Decision
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-6">Model Architecture</th>
                <th className="py-3.5 px-4">Paradigm</th>
                <th className="py-3.5 px-4 text-center">Accuracy</th>
                <th className="py-3.5 px-4 text-center">Precision</th>
                <th className="py-3.5 px-4 text-center">Recall</th>
                <th className="py-3.5 px-4 text-center">F1-Score</th>
                <th className="py-3.5 px-6 text-right">Selection Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {modelsList.map((m) => {
                const isChampion = m.name === winner;
                return (
                  <tr 
                    key={m.name} 
                    className={isChampion ? "bg-emerald-50/60 font-semibold" : "hover:bg-slate-50 transition"}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2.5">
                        {isChampion ? (
                          <CheckCircle2 className="h-4 w-4 text-[#1F9D75] flex-shrink-0" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-slate-300 flex-shrink-0 ml-1 mr-1" />
                        )}
                        <div>
                          <div className="text-slate-900 font-bold text-xs">{m.name}</div>
                          <div className="text-[10px] text-slate-500 font-normal max-w-xs truncate">{m.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                        {m.type}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-slate-900">
                      {(m.metrics.accuracy * 100).toFixed(2)}%
                    </td>
                    <td className="py-4 px-4 text-center text-slate-900">
                      {(m.metrics.precision * 100).toFixed(2)}%
                    </td>
                    <td className="py-4 px-4 text-center text-slate-900">
                      {(m.metrics.recall * 100).toFixed(2)}%
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded font-bold ${
                        isChampion ? "bg-[#1F9D75] text-white" : "text-slate-800 bg-slate-100"
                      }`}>
                        {m.metrics.f1.toFixed(4)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {isChampion ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase">
                          <Award className="h-3 w-3" />
                          <span>Champion Selected</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Baseline Benchmark</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Engineering Architecture Section */}
      <div className="mb-10">
        <h2 className="text-base font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-2">
          <Layers className="h-4 w-4 text-[#1F9D75]" />
          <span>The 7-Feature Geotechnical Input Vector</span>
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Beyond instantaneous readings: GiriRakshak models the physical dynamics of slope liquefaction through temporal saturation and spatial correlation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Temporal Features Card */}
          <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Clock className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">1. Temporal Saturation Buildup</h3>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Landslides in the North Eastern Region are rarely caused by a single isolated shower; prolonged multi-day precipitation progressively liquefies the slip plane.
            </p>
            <div className="space-y-2 text-xs">
              <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-100">
                <div className="font-bold text-blue-900 font-mono text-[11px]">rolling_rainfall_24h</div>
                <div className="text-[11px] text-blue-700 mt-0.5">Cumulative rainfall over preceding 24 hours. Represents immediate saturation loading.</div>
              </div>
              <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-100">
                <div className="font-bold text-blue-900 font-mono text-[11px]">rolling_rainfall_72h</div>
                <div className="text-[11px] text-blue-700 mt-0.5">Cumulative 3-day monsoon soaking. Drives deep pore-water pressure buildup and loss of shear resistance.</div>
              </div>
            </div>
          </div>

          {/* 2. Spatial Correlation Card */}
          <div className="bg-white rounded-2xl p-5 border border-teal-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="p-2 bg-teal-50 text-[#1F9D75] rounded-lg">
                <MapPin className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">2. Spatial Correlation (3-NN)</h3>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Slopes do not exist in isolation. Geological fault blocks and regional monsoon cloudburst fronts affect entire contiguous highway corridors simultaneously.
            </p>
            <div className="space-y-2 text-xs">
              <div className="bg-teal-50/70 p-2.5 rounded-lg border border-teal-100">
                <div className="font-bold text-teal-900 font-mono text-[11px]">avg_neighbor_risk</div>
                <div className="text-[11px] text-teal-700 mt-0.5">
                  Mean current hazard score of the 3 nearest monitored zones (calculated via Euclidean lat/lon distance).
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg text-slate-600 text-[11px] leading-relaxed">
                Prevents false negatives: if neighboring slopes along NH-6 are actively deteriorating, adjacent sectors receive elevated vigilance even before local sensors spike.
              </div>
            </div>
          </div>

          {/* 3. Physical Terrain & In-Situ Readings Card */}
          <div className="bg-white rounded-2xl p-5 border border-orange-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="p-2 bg-orange-50 text-[#E8703A] rounded-lg">
                <Zap className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">3. Physical & In-Situ Terrain</h3>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Core geotechnical characteristics derived from satellite DEMs and road telemetry sensors.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-orange-50/70 p-2 rounded-lg border border-orange-100">
                <div className="font-bold text-orange-900 font-mono text-[10px]">rainfall_mm</div>
                <div className="text-[10px] text-orange-700">Instantaneous intensity (IMD API)</div>
              </div>
              <div className="bg-orange-50/70 p-2 rounded-lg border border-orange-100">
                <div className="font-bold text-orange-900 font-mono text-[10px]">soil_moisture_pct</div>
                <div className="text-[10px] text-orange-700">Volumetric water saturation %</div>
              </div>
              <div className="bg-orange-50/70 p-2 rounded-lg border border-orange-100">
                <div className="font-bold text-orange-900 font-mono text-[10px]">slope_angle_deg</div>
                <div className="text-[10px] text-orange-700">SRTM DEM gradient angle (°)</div>
              </div>
              <div className="bg-orange-50/70 p-2 rounded-lg border border-orange-100">
                <div className="font-bold text-orange-900 font-mono text-[10px]">elevation_m</div>
                <div className="text-[10px] text-orange-700">Orographic relief (meters)</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* SHAP Explainable AI (XAI) Deep-Dive Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center space-x-2.5 mb-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Explainable AI (USP 1: SHAP TreeExplainer Attribution)
            </h3>
            <p className="text-xs text-slate-500">
              Transforming complex ensemble trees into transparent, defensible disaster management decisions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 text-xs text-slate-600 leading-relaxed">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 text-xs mb-1">Why Black-Box Models Fail in Disaster Management</h4>
            <p>
              When a highway traffic closure is ordered along NH-44 or NDRF evacuation teams are dispatched, incident commanders require concrete justification. Saying "the neural network output 89%" is unacceptable during real emergencies.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 text-xs mb-1">How GiriRakshak Implements SHAP</h4>
            <p>
              GiriRakshak computes exact Shapley values (<code className="text-purple-700 font-semibold font-mono">shap.TreeExplainer</code>) on every inference call. The dashboard displays the exact percentage attribution for each feature, allowing officials to see immediately whether a crisis is driven by acute rain, prolonged 72h saturation, or steep slope instability.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Click any zone marker in the <strong>GIS Dashboard</strong> to inspect its live real-time SHAP attribution chart.
          </div>
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#1F3864] text-white font-bold text-xs hover:bg-[#152747] transition shadow-xs"
          >
            <span>Open GIS Dashboard</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scientific Foundations & References Section */}
      <div className="mt-8 mb-4">
        <ReferencesSection />
      </div>

    </div>
  );
}
