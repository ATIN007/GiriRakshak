import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup } from 'react-leaflet';
import { getRiskColor, getRiskBadgeClass } from '../config';
import { AlertTriangle, TrendingUp, Compass, CloudRain } from 'lucide-react';

export default function MapView({ zones = [], selectedZone, onSelectZone }) {
  // Center of Assam/Meghalaya corridor (between Guwahati, Shillong, and Kaziranga)
  const defaultCenter = [25.85, 92.35];
  const defaultZoom = 8;

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-slate-100 overflow-hidden">
      
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

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
