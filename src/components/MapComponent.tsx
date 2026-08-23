'use client';

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface BairroData {
  nome: string;
  qtd: number;
  coords: [number, number];
}

interface MapProps {
  data: BairroData[];
  maxQtd: number;
}

export default function MapComponent({ data, maxQtd }: MapProps) {
  // Center of Niterói
  const center: [number, number] = [-22.8986, -43.1020];

  return (
    <div style={{ height: '100%', width: '100%', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        {/* Dark theme tiles to match the premium dashboard look */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {data.map((bairro, idx) => {
          // Normalize radius between 5 and 40 based on qtd vs maxQtd
          const radius = Math.max(5, (bairro.qtd / maxQtd) * 40);
          
          return (
            <CircleMarker
              key={idx}
              center={bairro.coords}
              radius={radius}
              fillColor="var(--accent-warning)"
              color="var(--accent-warning)"
              weight={1}
              opacity={0.8}
              fillOpacity={0.6}
            >
              <Tooltip 
                direction="top" 
                offset={[0, -10]} 
                opacity={0.9} 
                className="custom-leaflet-tooltip"
              >
                <div style={{ padding: '4px', textAlign: 'center' }}>
                  <strong>{bairro.nome}</strong>
                  <br/>
                  <span style={{ color: 'var(--accent-warning)' }}>{bairro.qtd.toLocaleString('pt-BR')} comércios</span>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
      
      {/* Custom styles for leaflet tooltip to fit dark theme */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-leaflet-tooltip {
          background-color: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          color: var(--text-primary);
          border-radius: 8px;
          box-shadow: var(--glass-shadow);
        }
        .custom-leaflet-tooltip::before {
          border-top-color: var(--glass-border);
        }
        /* Hide leaflet controls if needed, but we keep zoom */
        .leaflet-bar a {
          background-color: var(--bg-secondary) !important;
          color: var(--text-primary) !important;
          border-color: var(--glass-border) !important;
        }
        .leaflet-bar a:hover {
          background-color: var(--bg-tertiary) !important;
        }
      `}} />
    </div>
  );
}
