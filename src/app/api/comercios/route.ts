import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCoords } from '@/lib/niteroi-coords';

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'dados_edinheiro', 'comercios_empresa_131.json');
    const fileContents = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileContents);
    
    // Aggregate max businesses per neighborhood (since data has snapshots per month)
    const bairroMap = data.reduce((acc: any, curr: any) => {
      const b = curr.bairro;
      if (!b) return acc;
      
      const normalized = b.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      
      if (!acc[normalized]) {
        acc[normalized] = {
          nome: b,
          qtd: 0,
          coords: getCoords(normalized)
        };
      }
      
      // Somamos ou pegamos o máximo? Vamos somar tudo para ter uma representação de densidade de transações/cadastros
      acc[normalized].qtd += (curr.qtd_comercios || 0);
      
      return acc;
    }, {});

    // Filter only those with coordinates mapped
    const mapData = Object.values(bairroMap)
      .filter((b: any) => b.coords !== null)
      .sort((a: any, b: any) => b.qtd - a.qtd); // Sort by quantity descending

    // Calculate max for normalization on the frontend (to size the circles)
    const maxQtd = mapData.length > 0 ? Math.max(...mapData.map((d: any) => d.qtd)) : 1;

    // Calculamos também o total de comércios para o stat card superior
    const totalComercios = Object.values(bairroMap).reduce((sum: number, b: any) => sum + b.qtd, 0);

    return NextResponse.json({
      success: true,
      data: {
        mapData,
        maxQtd,
        totalComercios
      }
    });

  } catch (error) {
    console.error("Erro ao ler dados de comercios:", error);
    return NextResponse.json(
      { success: false, error: 'Falha ao carregar dados de comercios' },
      { status: 500 }
    );
  }
}
