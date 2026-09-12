import React, { useState } from 'react';
import { MapContainer, TileLayer, WMSTileLayer, CircleMarker, Tooltip, Popup } from 'react-leaflet';
import { getRiskColor, getRiskBadgeClass } from '../config';
import { AlertTriangle, TrendingUp, Compass, CloudRain, CheckCircle2, Layers } from 'lucide-react';

export default function MapView({ zones = [], selectedZone, onSelectZone, onOpenSolutionModal }) {
  // Center of Assam/Meghalaya corridor (between Guwahati, Shillong, and Kaziranga)
  const defaultCenter = [25.85, 92.35];
  const defaultZoom = 8;
  const [activeLayer, setActiveLayer] = useState('bhuvan');

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-slate-100 overflow-hidden">
      
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {activeLayer === 'bhuvan' && (
          <WMSTileLayer
            key="bhuvan-wms"
            url="https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wms/?"
            layers="india3"
            format="image/png"
            transparent={false}
            version="1.1.1"
            attribution='&copy; <a href="https://bhuvan.nrsc.gov.in" target="_blank" rel="noreferrer">ISRO / NRSC Bhuvan</a> (WMS Services)'
          />
        )}
        {activeLayer === 'osm' && (
          <TileLayer
            key="osm-tiles"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        {activeLayer === 'satellite' && (
          <TileLayer
            key="satellite-tiles"
            attribution='&copy; ISRO Bhuvan / Bhoonidhi &bull; Sentinel-2 Imagery'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {zones.map((zone) => {
          const isSelected = selectedZone?.id === zone.id;
          const isCritical = zone.current_risk_score > 80;
          const markerColor = getRiskColor(zone.current_risk_score);

          return (
            <React.Fragment key={zone.id}>
              {/* Outer pulsing halo for Critical threat points */}
              {isCritical && (
                <CircleMarker
                  center={[zone.lat, zone.lon]}
                  radius={20}
                  pathOptions={{
                    color: '#EF4444',
                    fillColor: '#EF4444',
                    fillOpacity: 0.25,
                    weight: 1,
                    dashArray: '4, 4'
                  }}
                />
              )}

              {/* Core Interactive Marker */}
              <CircleMarker
                center={[zone.lat, zone.lon]}
                radius={isSelected ? 14 : (isCritical ? 12 : 9)}
                eventHandlers={{
                  click: () => onSelectZone(zone)
                }}
                pathOptions={{
                  color: isSelected ? '#1F3864' : '#FFFFFF',
                  fillColor: markerColor,
                  fillOpacity: 0.95,
                  weight: isSelected ? 3 : 2
                }}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                  <div className="text-xs p-1">
                    <div className="font-bold text-slate-800">{zone.name}</div>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="font-semibold text-slate-600">Risk Score:</span>
                      <span 
                        className="font-extrabold px-1 rounded text-white text-[10px]"
                        style={{ backgroundColor: markerColor }}
                      >
                        {Math.round(zone.current_risk_score)} ({zone.risk_level})
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Rain: {zone.current_rainfall_mm}mm • Saturation: {zone.current_soil_moisture_pct}%
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Live Map Layer Switcher Control (ISRO Bhuvan WMS / OSM / Satellite) */}
      <div className={`absolute top-4 ${selectedZone ? 'right-4 md:right-[410px]' : 'right-4'} z-[400] transition-all duration-300 pointer-events-auto`}>
        <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-1.5">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 text-slate-600">
            <Layers className="h-3.5 w-3.5 text-[#1F3864]" />
            <span className="text-[11px] font-extrabold uppercase tracking-tight">Base Map:</span>
          </div>
          <div className="flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/60">
            <button
              type="button"
              id="layer-btn-bhuvan"
              onClick={() => setActiveLayer('bhuvan')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeLayer === 'bhuvan'
                  ? 'bg-[#1F3864] text-white shadow-sm ring-1 ring-[#1F3864]/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="ISRO Bhuvan WMS (india3 + DEM Thematic Base)"
            >
              <span>🇮🇳 ISRO Bhuvan (WMS)</span>
            </button>
            <button
              type="button"
              id="layer-btn-osm"
              onClick={() => setActiveLayer('osm')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeLayer === 'osm'
                  ? 'bg-[#1F3864] text-white shadow-sm ring-1 ring-[#1F3864]/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="OpenStreetMap Standard Vector Tiles"
            >
              <span>🗺️ OpenStreetMap</span>
            </button>
            <button
              type="button"
              id="layer-btn-satellite"
              onClick={() => setActiveLayer('satellite')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeLayer === 'satellite'
                  ? 'bg-[#1F3864] text-white shadow-sm ring-1 ring-[#1F3864]/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Satellite / Cartosat & Sentinel-2 Optical Feeds"
            >
              <span>🛰️ Satellite</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Highway Corridor Badges */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col space-y-2 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-md border border-slate-200 text-xs font-semibold text-slate-700 pointer-events-auto flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1F3864]"></span>
          <span>Corridor 1: NH-6 / Old NH-44 (Guwahati - Shillong - Silchar)</span>
        </div>
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-md border border-slate-200 text-xs font-semibold text-slate-700 pointer-events-auto flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1F9D75]"></span>
          <span>Corridor 2: NH-37 (Brahmaputra Valley / Kaziranga Belt)</span>
        </div>
        <button
          onClick={onOpenSolutionModal}
          className="bg-gradient-to-r from-[#1F3864] to-[#1F9D75] hover:from-[#152747] hover:to-[#17805e] text-white px-3 py-1.5 rounded-lg shadow-md border border-white/20 text-xs font-bold pointer-events-auto flex items-center space-x-1.5 transition active:scale-95 self-start cursor-pointer"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
          <span>🎯 How This Solves It (3 Core Problems)</span>
        </button>
      </div>

      {/* Floating Map Legend */}
      <div className="absolute bottom-6 left-4 z-[400] bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-lg border border-slate-200 text-xs max-w-xs">
        <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
          <span>Early Warning Risk Index</span>
          <span className="text-[10px] text-slate-400 font-normal">AI Random Forest</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#10B981] shadow-sm"></span>
            <span className="text-slate-700 font-medium">Low (&lt;30)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#FBBF24] shadow-sm"></span>
            <span className="text-slate-700 font-medium">Moderate (30-60)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#F97316] shadow-sm"></span>
            <span className="text-slate-700 font-medium">High (60-80)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#EF4444] shadow-sm animate-pulse"></span>
            <span className="text-red-600 font-bold">Critical (&gt;80)</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
          Click any point along the highway corridor to inspect explainable AI breakdown.
        </div>
      </div>

    </div>
  );
}
