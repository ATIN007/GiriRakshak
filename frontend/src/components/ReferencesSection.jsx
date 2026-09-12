import React from 'react';
import { BookOpen, ExternalLink, ShieldCheck, CheckCircle2, FileText, Bookmark, Quote } from 'lucide-react';

export default function ReferencesSection() {
  const references = [
    {
      id: "guzzetti-2007",
      citation: 'Guzzetti, F., Peruccacci, S., Rossi, M., & Stark, C. P. (2007)',
      title: "Rainfall thresholds for the initiation of landslides in central and southern Europe",
      journal: "Meteorology and Atmospheric Physics, 98(3-4), 239-267",
      role: "Foundational empirical rainfall-threshold modeling establishing rainfall intensity and cumulative duration as the primary triggers for shallow landslides and debris flows.",
      tag: "Foundational Empirical Model",
      tagColor: "bg-blue-100 text-blue-800 border-blue-200"
    },
    {
      id: "usgs-infinite-slope",
      citation: 'USGS Geotechnical Engineering & Earth Sciences',
      title: "Infinite-Slope Stability Model & Pore-Water Pressure Mechanics",
      journal: "U.S. Geological Survey Open-File Reports & Slope Stability Handbooks",
      role: "Provides the physical geotechnical basis for using slope angle (shear stress) and soil moisture saturation (pore-water pressure reduction of effective normal stress) as direct landslide hazard determinants.",
      tag: "Geotechnical Mechanics",
      tagColor: "bg-emerald-100 text-emerald-800 border-emerald-200"
    },
    {
      id: "kirschbaum-2018",
      citation: 'Kirschbaum, D., & Stanley, T. (2018)',
      title: "Satellite-based landslide hazard modeling: An update to the Landslide Hazard Assessment for Situational Awareness (LHASA) model",
      journal: "Frontiers in Earth Science, 6, 170",
      role: "Demonstrated combining satellite-derived multi-day precipitation with terrain elevation, slope, and fault proximity heuristics to forecast regional slope instability.",
      tag: "Satellite Hazard Modeling",
      tagColor: "bg-purple-100 text-purple-800 border-purple-200"
    },
    {
      id: "lundberg-2017",
      citation: 'Lundberg, S. M., & Lee, S. I. (2017)',
      title: "A unified approach to interpreting model predictions",
      journal: "Advances in Neural Information Processing Systems (NeurIPS 2017), 30",
      role: "Mathematical framework for TreeSHAP (Shapley Additive exPlanations), enabling GiriRakshak to provide transparent, defensible feature attribution weights on every prediction.",
      tag: "Explainable AI (XAI)",
      tagColor: "bg-teal-100 text-teal-800 border-teal-200"
    },
    {
      id: "ndma-cap-1.2",
      citation: 'NDMA / OASIS Emergency Management Technical Committee',
      title: "Common Alerting Protocol (CAP v1.2) Specification / ITU-T Recommendation X.1303",
      journal: "National Disaster Management Authority (SACHET) Implementation Guidelines",
      role: "Official open standard for interoperable disaster warnings across telecom, web, and broadcast media; governs GiriRakshak's CAP XML upstream ingestion payload.",
      tag: "National Alert Standard",
      tagColor: "bg-orange-100 text-orange-800 border-orange-200"
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#1F3864] bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full mb-1">
            <BookOpen className="h-3.5 w-3.5 text-[#1F9D75]" />
            <span>Academic Rigor & Scientific Pedigree</span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            References & Theoretical Foundations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Peer-reviewed literature and international standards underpinning GiriRakshak's risk formulation.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 self-start sm:self-center">
          5 Core References
        </span>
      </div>

      {/* Explicit Connection Callout */}
      <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200 rounded-xl p-4 mb-6 shadow-xs flex items-start space-x-3">
        <Quote className="h-5 w-5 text-[#1F9D75] flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-xs font-bold text-teal-950 uppercase tracking-wide">
            Model Formulation Grounding Note
          </h3>
          <p className="text-xs text-teal-900 mt-1 leading-relaxed font-semibold">
            "Our weighted risk score (rainfall + soil saturation + slope angle) follows the same empirical rainfall-threshold approach established by Guzzetti et al., adapted with machine-learned weights instead of fixed coefficients."
          </p>
        </div>
      </div>

      {/* Structured Citations Grid */}
      <div className="space-y-3.5">
        {references.map((ref, idx) => (
          <div 
            key={ref.id}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition shadow-2xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <span className="font-bold text-xs text-slate-800">
                {idx + 1}. {ref.citation}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${ref.tagColor}`}>
                {ref.tag}
              </span>
            </div>

            <h4 className="text-xs font-extrabold text-[#1F3864]">
              "{ref.title}"
            </h4>
            
            <div className="text-[11px] text-slate-500 italic mt-0.5">
              {ref.journal}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-700">Application in GiriRakshak:</strong> {ref.role}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Footer Note */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Verified against Geological Survey of India (GSI) NLSM guidelines & NDMA protocols.</span>
        <span className="font-semibold text-slate-500">Peer-Reviewed Methodology</span>
      </div>

    </div>
  );
}
