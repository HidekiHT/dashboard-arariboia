import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

type IndicadorMensal = {
  ano: number;
  mes: number;
  qtd_contas_ativas: number | null;
  qtd_comercios_credenciados_ativos: number | null;
};

type PontoEvolucao = {
  periodo: string;
  beneficiarios: number;
  comercios: number;
};

let cachedData: { evolucao: PontoEvolucao[] } | null = null;

export async function GET() {
  try {
    if (!cachedData) {
      const dataPath = path.join(process.cwd(), 'dados_edinheiro', 'indicadores-mensais_empresa_131.json');
      const fileContents = fs.readFileSync(dataPath, 'utf8');
      const data: IndicadorMensal[] = JSON.parse(fileContents);

      const serieCompleta = data
        .filter((indicador) => Number.isFinite(indicador.qtd_contas_ativas) && Number.isFinite(indicador.qtd_comercios_credenciados_ativos))
        .map((indicador) => ({
          periodo: `${indicador.ano}-${String(indicador.mes).padStart(2, '0')}`,
          beneficiarios: indicador.qtd_contas_ativas ?? 0,
          comercios: indicador.qtd_comercios_credenciados_ativos ?? 0,
        }))
        .sort((a, b) => a.periodo.localeCompare(b.periodo));

      // O último período disponível corresponde ao mês em andamento e não entra na visualização.
      const evolucao = serieCompleta.slice(0, -1).reduce<PontoEvolucao[]>((acumulado, ponto) => {
        const totalAnterior = acumulado.at(-1)?.comercios ?? 0;
        acumulado.push({ ...ponto, comercios: totalAnterior + ponto.comercios });
        return acumulado;
      }, []);

      cachedData = { evolucao };
    }

    return NextResponse.json({ success: true, data: cachedData });
  } catch (error) {
    console.error('Erro ao ler os indicadores mensais:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao carregar os indicadores mensais' },
      { status: 500 },
    );
  }
}
