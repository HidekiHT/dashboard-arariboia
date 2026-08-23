import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

type Usuario = { ano: number; mes: number; faixa_etaria?: string; faixa_renda?: string; genero?: string; qtd_usuarios?: number };
const agrupar = (dados: Usuario[], campo: 'faixa_etaria' | 'faixa_renda' | 'genero') => Object.values(dados.reduce((acumulado: Record<string, { categoria: string; quantidade: number }>, item) => {
  const bruto = item[campo] || 'NÃO INFORMADO';
  const categoria = campo === 'genero' && bruto === 'POR ATUALIZAR' ? 'Não informado' : bruto;
  acumulado[categoria] ??= { categoria, quantidade: 0 }; acumulado[categoria].quantidade += item.qtd_usuarios ?? 0; return acumulado;
}, {}));

const ordenar = (dados: Array<{ categoria: string; quantidade: number }>, ordem: string[]) => dados.sort((a, b) => ordem.indexOf(a.categoria) - ordem.indexOf(b.categoria));
const excluirCategoriasSemDado = (dados: Array<{ categoria: string; quantidade: number }>) => dados.filter(({ categoria }) => {
  const categoriaNormalizada = categoria.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\s-]+/g, '_');
  return categoriaNormalizada !== 'nao_informado' && categoriaNormalizada !== 'sem_transacao';
});

export async function GET() {
  try {
    const usuarios = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'dados_edinheiro', 'usuarios_niteroi.json'), 'utf8')) as Usuario[];
    const generoCompleto = agrupar(usuarios, 'genero');
    const totalGenero = generoCompleto.reduce((total, item) => total + item.quantidade, 0);
    const naoIdentificado = generoCompleto.find((item) => item.categoria === 'Não informado')?.quantidade ?? 0;
    return NextResponse.json({ success: true, data: {
      idade: ordenar(excluirCategoriasSemDado(agrupar(usuarios, 'faixa_etaria')), ['<18', '18-24', '25-34', '35-44', '45-59', '60+']),
      renda: ordenar(excluirCategoriasSemDado(agrupar(usuarios, 'faixa_renda')), ['<100', '100-300', '300-800', '800-2k', '>2k']),
      genero: generoCompleto.filter((item) => item.categoria === 'MASCULINO' || item.categoria === 'FEMININO'),
      percentualNaoIdentificado: totalGenero ? (naoIdentificado / totalGenero) * 100 : 0,
    } });
  } catch { return NextResponse.json({ success: false }, { status: 500 }); }
}
