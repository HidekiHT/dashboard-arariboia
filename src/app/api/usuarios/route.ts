import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Caminho absoluto para a pasta de dados na raiz do projeto
    const dataPath = path.join(process.cwd(), 'dados_edinheiro', 'usuarios_niteroi.json');
    const fileContents = fs.readFileSync(dataPath, 'utf8');
    
    // Parseia os dados
    const data = JSON.parse(fileContents);
    
    // Processamento básico para o dashboard:
    // 1. Total de Usuários
    const totalUsuarios = data.reduce((acc: number, curr: any) => acc + (curr.qtd_usuarios || 0), 0);
    
    // 2. Evolução de Usuários (agrupando por ano e mês para o gráfico)
    // Agrupamento simplificado para exemplo
    const evolucaoMap = data.reduce((acc: any, curr: any) => {
      const key = `${curr.ano}-${String(curr.mes).padStart(2, '0')}`;
      if (!acc[key]) {
        acc[key] = { periodo: key, usuarios: 0 };
      }
      acc[key].usuarios += (curr.qtd_usuarios || 0);
      return acc;
    }, {});
    
    // Ordenar cronologicamente
    const evolucao = Object.values(evolucaoMap).sort((a: any, b: any) => a.periodo.localeCompare(b.periodo));

    return NextResponse.json({
      success: true,
      data: {
        totalUsuarios,
        evolucao
      }
    });

  } catch (error) {
    console.error("Erro ao ler dados de usuários:", error);
    return NextResponse.json(
      { success: false, error: 'Falha ao carregar dados de usuários' },
      { status: 500 }
    );
  }
}
