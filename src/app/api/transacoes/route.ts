import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

type Ranking = { bairro: string; quantidade: number; valor: number };
type Setor = { setor: string; quantidade: number; valor: number };
type FluxoBairro = { bairro: string; origem: number; destino: number };
type RankingIBP = { bairro: string; ibp: number };
type Periodo = { ranking: Map<string, Ranking>; setores: Map<string, Setor>; fluxos: Map<string, FluxoBairro>; onda2: number; onda3: number; volumeGrande: number; quantidadePequeno: number };
type CodigoBairroOficial = { codigo: string; bairro: string };
type BaseBairrosOficiais = { bairros: CodigoBairroOficial[] };
let base: { dados: Map<string, Periodo>; rankingIBP: RankingIBP[]; onda1: Map<string, number>; periodos: string[]; anos: string[] } | null = null;

export const dynamic = 'force-dynamic';

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

function carregarBase() {
  if (base) return base;
  const bairrosOficiais = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'dados_edinheiro', 'codigos_bairros_niteroi_oficiais.json'), 'utf8')) as BaseBairrosOficiais;
  const bairros = new Map(bairrosOficiais.bairros.map(({ codigo, bairro }) => [codigo, bairro]));
  const bairrosPorNomeNormalizado = new Map([...new Set(bairros.values())].map((bairro) => [normalizarBairro(bairro), bairro]));
  const rankingIBP = fs.readFileSync(path.join(process.cwd(), 'dados_edinheiro', 'IBPniteroi.csv'), 'utf8')
    .split(/\r?\n/)
    .slice(1)
    .map((linha) => linha.split(';'))
    .filter(([bairro, , ibp]) => bairro && ibp)
    .map(([bairro, , ibp]) => ({ bairro: bairrosPorNomeNormalizado.get(normalizarBairro(bairro)) ?? bairro, ibp: Number(ibp.replace(',', '.')) }))
    .filter(({ ibp }) => Number.isFinite(ibp))
    .sort((a, b) => b.ibp - a.ibp);
  const dados = new Map<string, Periodo>();
  for (const linha of fs.readFileSync(path.join(process.cwd(), 'dados_edinheiro', 'transacoes_bruto_niteroi_oficial.csv'), 'utf8').split(/\r?\n/).slice(1)) {
    if (!linha) continue;
    const item = linha.split(','); const periodo = item[0]; const origem = bairros.get(item[1]); const destino = bairros.get(item[2]);
    const atual = dados.get(periodo) ?? { ranking: new Map(), setores: new Map(), fluxos: new Map(), onda2: 0, onda3: 0, volumeGrande: 0, quantidadePequeno: 0 }; const qtd = Number(item[10]) || 0; const valor = Number(item[11]) || 0;
    if (destino) { const bairro = atual.ranking.get(destino) ?? { bairro: destino, quantidade: 0, valor: 0 }; bairro.quantidade += qtd; bairro.valor += valor; atual.ranking.set(destino, bairro); }
    if (origem) { const bairro = atual.fluxos.get(origem) ?? { bairro: origem, origem: 0, destino: 0 }; bairro.origem += qtd; atual.fluxos.set(origem, bairro); }
    if (destino) { const bairro = atual.fluxos.get(destino) ?? { bairro: destino, origem: 0, destino: 0 }; bairro.destino += qtd; atual.fluxos.set(destino, bairro); }
    if (destino && item[3] === 'PF' && item[4] === 'PJ') { atual.onda2 += valor; const setor = item[7] === 'CATEGORIZAR' || !item[7] ? 'Não categorizado' : item[7]; const atualSetor = atual.setores.get(setor) ?? { setor, quantidade: 0, valor: 0 }; atualSetor.quantidade += qtd; atualSetor.valor += valor; atual.setores.set(setor, atualSetor); }
    if (origem && destino && item[3] === 'PJ' && item[4] === 'PJ') atual.onda3 += valor;
    dados.set(periodo, atual);
  }
  const onda1 = new Map<string, number>();
  const beneficios = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'dados_edinheiro', 'beneficios_empresa_131.json'), 'utf8')) as Array<{ ano?: number; valor_total?: number }>;
  for (const item of beneficios) { const ano = String(item.ano); onda1.set(ano, (onda1.get(ano) ?? 0) + (item.valor_total ?? 0)); }
  base = { dados, rankingIBP, onda1, periodos: [...dados.keys()].sort(), anos: [...onda1.keys()].sort() }; return base;
}

export async function GET(request: Request) {
  try {
    const dados = carregarBase(); const params = new URL(request.url).searchParams;
    const inicio = params.get('inicio') && dados.periodos.includes(params.get('inicio')!) ? params.get('inicio')! : dados.periodos[0];
    const fim = params.get('fim') && dados.periodos.includes(params.get('fim')!) ? params.get('fim')! : dados.periodos.at(-1)!;
    const ano = params.get('ano') && dados.anos.includes(params.get('ano')!) ? params.get('ano')! : dados.anos.at(-1)!;
    const rankingAno = params.get('rankingAno') && dados.anos.includes(params.get('rankingAno')!) ? params.get('rankingAno')! : dados.anos.at(-1)!;
    const ibpAno = params.get('ibpAno') && dados.anos.includes(params.get('ibpAno')!) ? params.get('ibpAno')! : dados.anos.at(-1)!;
    const ranking = new Map<string, Ranking>(); const fluxosIbp = new Map<string, FluxoBairro>(); let onda2 = 0; let onda3 = 0;
    const setores = new Map<string, Setor>(); let volumeGrande = 0; let quantidadePequeno = 0;
    for (const periodo of dados.periodos.filter((item) => item.startsWith(`${rankingAno}-`))) {
      const item = dados.dados.get(periodo)!;
      for (const bairro of item.ranking.values()) { const atual = ranking.get(bairro.bairro) ?? { bairro: bairro.bairro, quantidade: 0, valor: 0 }; atual.quantidade += bairro.quantidade; atual.valor += bairro.valor; ranking.set(bairro.bairro, atual); }
      for (const setor of item.setores.values()) { const atual = setores.get(setor.setor) ?? { setor: setor.setor, quantidade: 0, valor: 0 }; atual.quantidade += setor.quantidade; atual.valor += setor.valor; setores.set(setor.setor, atual); }
      volumeGrande += item.volumeGrande; quantidadePequeno += item.quantidadePequeno;
    }
    for (const periodo of dados.periodos.filter((item) => item.startsWith(`${ibpAno}-`))) {
      const item = dados.dados.get(periodo)!;
      for (const bairro of item.fluxos.values()) { const atual = fluxosIbp.get(bairro.bairro) ?? { bairro: bairro.bairro, origem: 0, destino: 0 }; atual.origem += bairro.origem; atual.destino += bairro.destino; fluxosIbp.set(bairro.bairro, atual); }
    }
    for (const periodo of dados.periodos.filter((item) => item.startsWith(`${ano}-`))) { const item = dados.dados.get(periodo)!; onda2 += item.onda2; onda3 += item.onda3; }
    const onda1 = dados.onda1.get(ano) ?? 0;
    const ibpRanking = dados.rankingIBP.map(({ bairro, ibp }) => ({ ...(fluxosIbp.get(bairro) ?? { bairro, origem: 0, destino: 0 }), ibp }));
    const setoresOrdenados = [...setores.values()].sort((a, b) => b.valor - a.valor);
    const quantidadeTotalSetores = setoresOrdenados.reduce((total, setor) => total + setor.quantidade, 0);
    const quantidadeNaoCategorizada = setores.get('Não categorizado')?.quantidade ?? 0;
    const percentualNaoCategorizado = quantidadeTotalSetores ? (quantidadeNaoCategorizada / quantidadeTotalSetores) * 100 : 0;
    const setoresExibidos = setoresOrdenados.filter(({ setor }) => setor !== 'Não categorizado').slice(0, 5);
    return NextResponse.json({ success: true, data: { ranking: [...ranking.values()].sort((a, b) => b.valor - a.valor).slice(0, 10), ibpRanking, comercio: { setores: setoresExibidos, percentualNaoCategorizado, volumeGrande, quantidadePequeno }, lm3: { indice: onda1 ? (onda1 + onda2 + onda3) / onda1 : 0, onda1, onda2, onda3 }, filtros: { periodos: dados.periodos, anos: dados.anos } } });
  } catch (error) { console.error('Erro ao processar transações:', error); return NextResponse.json({ success: false }, { status: 500 }); }
}
