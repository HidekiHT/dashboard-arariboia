'use client';

import { useEffect, useState } from 'react';
import { GeoJSON, MapContainer, useMap } from 'react-leaflet';
import { geoJSON, type Layer } from 'leaflet';
import type { FeatureCollection, Geometry } from 'geojson';
import 'leaflet/dist/leaflet.css';

type IBPProperties = {
  tx_nome: string;
  tx_regiao?: string;
  ibp?: number | null;
  regiao?: string;
  populacaoEstimada2010?: number;
};

type IBPMapData = {
  geojson: FeatureCollection<Geometry, IBPProperties>;
  minimo: number;
  maximo: number;
};

const faixas = [
  { cor: '#c7d2fe', legenda: 'Menor IBP' },
  { cor: '#818cf8', legenda: 'IBP baixo' },
  { cor: '#6366f1', legenda: 'IBP intermediário' },
  { cor: '#4338ca', legenda: 'IBP alto' },
  { cor: '#312e81', legenda: 'Maior IBP' },
];

function formatarIBP(valor: number) {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function corDoIBP(valor: number | null | undefined, minimo: number, maximo: number) {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '#64748b';
  const faixa = (maximo - minimo) / faixas.length || 1;
  return faixas[Math.min(faixas.length - 1, Math.max(0, Math.floor((valor - minimo) / faixa)))].cor;
}

function AjustarMapa({ dados }: { dados: FeatureCollection<Geometry, IBPProperties> }) {
  const mapa = useMap();
  useEffect(() => {
    const limites = geoJSON(dados).getBounds();
    if (!limites.isValid()) return;
    const ajustar = () => {
      mapa.invalidateSize(false);
      mapa.fitBounds(limites, { maxZoom: 14, padding: [8, 8] });
    };
    ajustar();
    const temporizador = window.setTimeout(ajustar, 120);
    return () => window.clearTimeout(temporizador);
  }, [dados, mapa]);
  return null;
}

export default function IBPMap() {
  const [dados, setDados] = useState<IBPMapData | null>(null);
  const [erro, setErro] = useState(false);
  useEffect(() => {
    fetch('/api/ibp')
      .then((resposta) => resposta.json())
      .then((resultado) => {
        if (resultado.success) setDados(resultado.data);
        else setErro(true);
      })
      .catch(() => setErro(true));
  }, []);

  if (erro) return <p style={{ color: 'var(--accent-danger)' }}>Não foi possível carregar o mapa do IBP.</p>;
  if (!dados) return <div style={{ alignItems: 'center', color: 'var(--text-muted)', display: 'flex', height: '100%', justifyContent: 'center' }}><p className="animate-fade-in">Carregando mapa do IBP...</p></div>;

  const estilo = (feature?: { properties?: IBPProperties }) => ({
    color: '#cbd5e1',
    fillColor: corDoIBP(feature?.properties?.ibp, dados.minimo, dados.maximo),
    fillOpacity: 0.88,
    weight: 1.1,
  });

  const vincularTooltip = (feature: { properties?: IBPProperties }, camada: Layer) => {
    const propriedades = feature.properties;
    if (!propriedades) return;
    const ibp = propriedades.ibp === null || propriedades.ibp === undefined ? 'Sem dado' : formatarIBP(propriedades.ibp);
    camada.bindTooltip(`<strong>${propriedades.tx_nome}</strong><br/>IBP: ${ibp}${propriedades.regiao ? `<br/>Região: ${propriedades.regiao}` : ''}`, { className: 'ibp-map-tooltip', sticky: true });
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius)', height: '580px', overflow: 'hidden', position: 'relative', width: '100%' }}>
      <MapContainer center={[-22.9, -43.1]} zoom={12} scrollWheelZoom={false} style={{ background: 'var(--bg-secondary)', height: '100%', width: '100%' }} attributionControl={false} zoomControl={false}>
        <AjustarMapa dados={dados.geojson} />
        <GeoJSON data={dados.geojson} style={estilo} onEachFeature={vincularTooltip} />
      </MapContainer>
      <div style={{ background: 'rgba(22, 25, 32, 0.94)', border: '1px solid var(--glass-border)', borderRadius: '8px', bottom: '1rem', color: 'var(--text-primary)', fontSize: '0.75rem', padding: '0.65rem 0.75rem', position: 'absolute', right: '1rem', zIndex: 500 }}>
        <strong style={{ display: 'block', marginBottom: '0.4rem' }}>IBP por bairro</strong>
        {faixas.map(({ cor, legenda }) => <div key={cor} style={{ alignItems: 'center', display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}><span style={{ background: cor, border: '1px solid rgba(255,255,255,0.2)', display: 'inline-block', height: '0.7rem', width: '0.7rem' }} />{legenda}</div>)}
      </div>
    </div>
  );
}
