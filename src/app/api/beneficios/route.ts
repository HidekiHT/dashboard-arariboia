import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Variável para cache em memória para evitar ler e parsear 6MB a cada requisição
let cachedData: any = null;

export async function GET() {
  try {
    if (!cachedData) {
      const dataPath = path.join(process.cwd(), 'dados_edinheiro', 'beneficios_empresa_131.json');
      const fileContents = fs.readFileSync(dataPath, 'utf8');
      const data = JSON.parse(fileContents);
      
      // Agrupar por Ano e Mês
      const evolucaoMap = data.reduce((acc: any, curr: any) => {
        const key = `${curr.ano}-${String(curr.mes).padStart(2, '0')}`;
        if (!acc[key]) {
          acc[key] = { periodo: key, valorTotal: 0, qtdPagamentos: 0 };
        }
        acc[key].valorTotal += (curr.valor_total || 0);
        acc[key].qtdPagamentos += (curr.qtd_pagamentos || 0);
        return acc;
      }, {});

      // Ordenar cronologicamente
      const evolucao = Object.values(evolucaoMap).sort((a: any, b: any) => a.periodo.localeCompare(b.periodo));
      
      cachedData = { evolucao };
    }

    return NextResponse.json({
      success: true,
      data: cachedData
    });

  } catch (error) {
    console.error("Erro ao ler dados de benefícios:", error);
    return NextResponse.json(
      { success: false, error: 'Falha ao carregar dados de benefícios' },
      { status: 500 }
    );
  }
}
