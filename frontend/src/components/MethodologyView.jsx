import React from 'react';
import { 
  Database, CloudRain, Satellite, Droplets, History, Map, 
  CheckCircle2, ExternalLink, ShieldAlert, Cpu, ArrowRight, Info, AlertCircle 
} from 'lucide-react';

export default function MethodologyView({ onBackToDashboard }) {
  const dataSources = [
    {
      id: 'rainfall',
      name: "IMD's Rainfall-Threshold Based Landslide Early Warning Bulletins for NE India",
      shortTitle: "Precipitation & Acute Downpour Feeds",
      category: "Hydrometeorological Feed",
      categoryColor: "bg-blue-100 text-blue-800 border-blue-200",
      icon: CloudRain,
      iconBg: "bg-blue-50 text-blue-600",
      provides: "Real-time and short-range precipitation intensity (mm/hr, mm/24hr), acute monsoon surge triggers, and basin-specific cumulative antecedent moisture thresholds for the North Eastern Region.",
      acquisition: "Accessed via IMD's Automated Data API / FTP National Data Center (NDC) feeds and regional automated weather stations (AWS).",
      acquisitionType: "REST API & Bulletins",
      statusBadge: "Operational API Spec",
      statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    {
      id: 'satellite',
      name: "Sentinel-2 Optical Imagery & NASA/USGS SRTM 30m Digital Elevation Model (DEM)",
      shortTitle: "Satellite Imagery & Terrain Elevation",
      category: "Geospatial & Remote Sensing",
      categoryColor: "bg-purple-100 text-purple-800 border-purple-200",
      icon: Satellite,
      iconBg: "bg-purple-50 text-purple-600",
      provides: "Continuous topographical slope angle (°), terrain elevation (m), slope aspect, catchment drainage geometry, and Normalized Difference Vegetation Index (NDVI) to track vegetation loss along highway embankments.",
      acquisition: "Accessed programmatically via Google Earth Engine (GEE) REST API (free, open-access, zero acquisition cost).",
      acquisitionType: "GEE API (Open Access)",
      statusBadge: "Free / Open Access",
      statusColor: "bg-purple-50 text-purple-700 border-purple-200"
    },
    {
      id: 'soil_moisture',
      name: "Simulated IoT Capacitive Soil Moisture Sensor Network",
      shortTitle: "Subsurface Saturation & Pore Pressure",
      category: "IoT Sensor Telemetry",
      categoryColor: "bg-teal-100 text-teal-800 border-teal-200",
      icon: Droplets,
      iconBg: "bg-teal-50 text-[#1F9D75]",
      provides: "Volumetric soil water content (VWC %), pore-water pressure buildup index, and drainage saturation levels along road cuts.",
      acquisition: "Explicitly simulated for this prototype stage; to be replaced with real physical telemetry probes deployed along priority highway slopes during the pilot phase.",
      acquisitionType: "Simulated Feed (Pilot Hardware Target)",
      statusBadge: "Prototype Simulation",
      statusColor: "bg-amber-50 text-amber-700 border-amber-200"
    },
    {
      id: 'historical',
      name: "GSI's National Landslide Susceptibility Mapping (NLSM) Programme Data",
      shortTitle: "Historical Landslide Inventory & Susceptibility",
      category: "Geological Baseline",
      categoryColor: "bg-orange-100 text-orange-800 border-orange-200",
      icon: History,
      iconBg: "bg-orange-50 text-[#E8703A]",
      provides: "Geotagged historical landslide incidence polygons, macro-scale landslide susceptibility zoning (1:50,000 scale), fault line proximities, and bedrock lithology attributes for Assam and Meghalaya.",
      acquisition: "Acquired through the GSI Bhukosh geospatial data portal and formal institutional data-sharing partnerships with the Geological Survey of India (GSI) & NDMA.",
      acquisitionType: "Institutional Data Partnership",
      statusBadge: "Government Portal",
      statusColor: "bg-blue-50 text-blue-700 border-blue-200"
    },
    {
      id: 'roads',
      name: "Survey of India (SoI) Topo Sheets & OpenStreetMap Vector Layers",
      shortTitle: "Road Network & Settlement GIS Layers",
      category: "GIS Infrastructure",
      categoryColor: "bg-slate-100 text-slate-800 border-slate-200",
      icon: Map,
      iconBg: "bg-slate-100 text-slate-700",
      provides: "High-precision highway centerlines for NH-6 (Old NH-44) and NH-37, culvert intersections, critical road-cutting coordinates, and settlement population buffers for impact assessment.",
      acquisition: "OpenStreetMap Overpass API (crowdsourced vector layers) and Survey of India National Geospatial Open Data Framework.",
      acquisitionType: "Open Vector API",
      statusBadge: "Open GIS Vectors",
      statusColor: "bg-slate-100 text-slate-700 border-slate-300"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Header Banner */}
      <div className="bg-[#1F3864] text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden mb-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-[#1F9D75] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Database className="h-3.5 w-3.5" />
            <span>Architecture Specification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Data Sources & Methodology
          </h1>
          <p className="text-slate-200 text-xs sm:text-sm mt-2 leading-relaxed">
            GiriRakshak synthesizes 5 heterogenous geospatial, meteorological, and geological indicators 
            to compute real-time landslide susceptibility across India's North Eastern Region (NH-44 & NH-37 corridors).
          </p>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
          <Database className="w-80 h-80 text-white" />
        </div>
      </div>

      {/* Mandatory Prototype Disclaimer Callout */}
      <div className="bg-amber-50 border-l-4 border-[#E8703A] p-4 rounded-xl shadow-sm mb-8 flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-[#E8703A] flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
            Prototype Data Feasibility & Provenance Note
          </h3>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            <strong>Prototype uses representative sample data; production deployment would integrate these sources via formal data-sharing agreements with IMD and GSI.</strong>
            &nbsp;All algorithmic calculations and SHAP explainability models operate identically whether parsing live API feeds or calibrated synthetic representations.
          </p>
        </div>
      </div>

      {/* 4-Stage Architecture Pipeline Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Cpu className="h-4 w-4 text-[#1F9D75]" />
          <span>System Architecture Pipeline (Contract Matching Presentation)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
            <div className="w-6 h-6 rounded-full bg-[#1F3864] text-white flex items-center justify-center font-bold text-xs mb-2">1</div>
            <h4 className="font-bold text-slate-800">Data Input</h4>
            <p className="text-slate-500 text-[11px] mt-1">
              5 streams: IMD rainfall, Sentinel-2/DEM terrain, soil moisture probes, GSI NLSM records, OSM vectors.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
            <div className="w-6 h-6 rounded-full bg-[#1F9D75] text-white flex items-center justify-center font-bold text-xs mb-2">2</div>
            <h4 className="font-bold text-slate-800">Pre-processing</h4>
            <p className="text-slate-500 text-[11px] mt-1">
              Out-of-range value sanitization, highway sector spatial indexing, and standardized feature normalization.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
            <div className="w-6 h-6 rounded-full bg-[#E8703A] text-white flex items-center justify-center font-bold text-xs mb-2">3</div>
            <h4 className="font-bold text-slate-800">AI Inference Engine</h4>
            <p className="text-slate-500 text-[11px] mt-1">
              Random Forest non-linear classifier computing 0-100 risk score paired with real-time SHAP feature attribution (USP 1).
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
            <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs mb-2">4</div>
            <h4 className="font-bold text-slate-800">Dissemination</h4>
            <p className="text-slate-500 text-[11px] mt-1">
              Interactive Web GIS dashboard for officials + automated out-of-band SMS alerts fired at Critical threshold (&gt;80).
            </p>
          </div>

        </div>
      </div>

      {/* The 5 Real Data Sources Detailed Grid */}
      <div className="space-y-6">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center justify-between">
          <span>The 5 Primary Data Inputs (Production Acquisition Strategy)</span>
          <span className="text-xs text-slate-500 font-normal">5 / 5 Sources Specified</span>
        </h2>

        <div className="grid grid-cols-1 gap-5">
          {dataSources.map((source, index) => {
            const Icon = source.icon;
            return (
              <div 
                key={source.id}
                className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 hover:border-slate-300 transition flex flex-col md:flex-row gap-5"
              >
                {/* Left: Icon & Category */}
                <div className="md:w-1/4 flex-shrink-0">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl ${source.iconBg}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${source.categoryColor}`}>
                        {source.category}
                      </span>
                      <div className="text-xs font-semibold text-slate-400 mt-1">
                        Input Feed #{index + 1}
                      </div>
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mt-3 leading-snug">
                    {source.shortTitle}
                  </h3>
                  
                  <div className="mt-2">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border inline-block ${source.statusColor}`}>
                      {source.statusBadge}
                    </span>
                  </div>
                </div>

                {/* Right: Detailed Specification Table */}
                <div className="md:w-3/4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5">
                  
                  {/* Real Product Name */}
                  <div className="sm:col-span-3">
                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Specific Real Product / Agency Dataset
                    </div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {source.name}
                    </div>
                  </div>

                  {/* What it provides */}
                  <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">
                      What It Provides
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {source.provides}
                    </p>
                  </div>

                  {/* How we'd acquire it */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">
                      Acquisition Method
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {source.acquisition}
                    </p>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Return Button */}
      <div className="mt-8 text-center">
        <button
          onClick={onBackToDashboard}
          className="bg-[#1F3864] hover:bg-[#16294a] text-white px-6 py-3 rounded-xl text-xs font-bold shadow-md transition inline-flex items-center space-x-2"
        >
          <span>Return to Live GIS Dashboard</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
}
