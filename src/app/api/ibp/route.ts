import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

type FeatureProperties = {
  tx_nome: string;
  tx_regiao?: string;
  ibp?: number | null;
  regiao?: string;
  populacaoEstimada2010?: number;
  setoresIntersectados?: number;
};

type IBPRow = { bairro: string; regiao: string; ibp: number; populacaoEstimada2010: number; setoresIntersectados: number };

let cachedData: { geojson: { type: string; features: Array<{ type: string; properties: FeatureProperties; geometry: unknown }> }; minimo: number; maximo: number } | null = null;

function normalizarBairro(bairro: string) {
  const normalizado = bairro.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const aliases = new Map([
    ['BAIRRODEFATIMA', 'FATIMA'],
    ['CACHOEIRAS', 'CACHOEIRA'],
    ['VITALBRAZIL', 'VITALBRASIL'],
    ['MATACAPA', 'MATAPACA'],
  ]);
  return aliases.get(normalizado) ?? normalizado;
}

function carregarIBP() {
  if (cachedData) return cachedData;
  const planilha = fs.readFileSync(path.join(process.cwd(), 'dados_edinheiro', 'IBPniteroi.csv'), 'utf8')
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean)
    .map((linha) => linha.split(';'))
    .map(([bairro, regiao, ibp, populacaoEstimada2010, setoresIntersectados]) => ({
      bairro,
      regiao,
      ibp: Number(ibp.replace(',', '.')),
      populacaoEstimada2010: Number(populacaoEstimada2010.replace(',', '.')),
      setoresIntersectados: Number(setoresIntersectados),
    }))
    .filter(({ bairro, ibp }) => bairro && Number.isFinite(ibp)) as IBPRow[];
  const dadosPorBairro = new Map(planilha.map((item) => [normalizarBairro(item.bairro), item]));
  const geojson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'dados_edinheiro', 'Limite_de_Bairros.geojson'), 'utf8')) as { type: string; features: Array<{ type: string; properties: FeatureProperties; geometry: unknown }> };
  const valores = planilha.map(({ ibp }) => ibp);
  cachedData = {
    geojson: {
      ...geojson,
      features: geojson.features.map((feature) => {
        const dados = dadosPorBairro.get(normalizarBairro(feature.properties.tx_nome));
        return {
          ...feature,
          properties: {
            ...feature.properties,
            ibp: dados?.ibp ?? null,
            regiao: dados?.regiao,
            populacaoEstimada2010: dados?.populacaoEstimada2010,
            setoresIntersectados: dados?.setoresIntersectados,
          },
        };
      }),
    },
    minimo: Math.min(...valores),
    maximo: Math.max(...valores),
  };
  return cachedData;
}

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: carregarIBP() });
  } catch (error) {
    console.error('Erro ao carregar os dados do IBP:', error);
    return NextResponse.json({ success: false, error: 'Falha ao carregar os dados do IBP' }, { status: 500 });
  }
}
