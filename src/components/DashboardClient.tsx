'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { BarChart, Bar, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Dynamically import the map to avoid SSR issues with window object
const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });

export default function DashboardClient() {
  const [data, setData] = useState<{totalUsuarios: number, evolucao: any[]}>({ totalUsuarios: 0, evolucao: [] });
  const [beneficiosData, setBeneficiosData] = useState<{evolucao: any[]}>({ evolucao: [] });
  const [comerciosData, setComerciosData] = useState<{mapData: any[], maxQtd: number, totalComercios: number}>({ mapData: [], maxQtd: 1, totalComercios: 0 });
  const [indicadoresData, setIndicadoresData] = useState<{evolucao: any[]}>({ evolucao: [] });
  const [transacoesData, setTransacoesData] = useState<{ranking: any[], comercio: {setores: any[], volumeGrande: number, quantidadePequeno: number}, lm3: {indice: number, onda1: number, onda2: number, onda3: number}, filtros: {periodos: string[], anos: string[]}}>({ ranking: [], comercio: { setores: [], volumeGrande: 0, quantidadePequeno: 0 }, lm3: { indice: 0, onda1: 0, onda2: 0, onda3: 0 }, filtros: { periodos: [], anos: [] } });
  const [anoRanking, setAnoRanking] = useState('');
  const [anoLm3, setAnoLm3] = useState('');
  const [perfilData, setPerfilData] = useState<{periodo: string, idade: any[], renda: any[], genero: any[], percentualNaoIdentificado: number}>({ periodo: '', idade: [], renda: [], genero: [], percentualNaoIdentificado: 0 });
  
  const [loading, setLoading] = useState(true);
  const [loadingBeneficios, setLoadingBeneficios] = useState(true);
  const [loadingComercios, setLoadingComercios] = useState(true);
  const [loadingIndicadores, setLoadingIndicadores] = useState(true);
  const [loadingTransacoes, setLoadingTransacoes] = useState(true);
  const [loadingPerfil, setLoadingPerfil] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/usuarios');
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Erro ao carregar os dados de usuários:', error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchBeneficios() {
      try {
        const response = await fetch('/api/beneficios');
        const result = await response.json();
        if (result.success) {
          setBeneficiosData(result.data);
        }
      } catch (error) {
        console.error("Erro ao carregar os dados de benefícios:", error);
      } finally {
        setLoadingBeneficios(false);
      }
    }

    async function fetchComercios() {
      try {
        const response = await fetch('/api/comercios');
        const result = await response.json();
        if (result.success) {
          setComerciosData(result.data);
        }
      } catch (error) {
        console.error("Erro ao carregar dados de comercios:", error);
      } finally {
        setLoadingComercios(false);
      }
    }

    async function fetchIndicadores() {
      try {
        const response = await fetch('/api/indicadores');
        const result = await response.json();
        if (result.success) {
          setIndicadoresData(result.data);
        }
      } catch (error) {
        console.error('Erro ao carregar os indicadores mensais:', error);
      } finally {
        setLoadingIndicadores(false);
      }
    }

    fetchData();
    fetchBeneficios();
    fetchComercios();
    fetchIndicadores();
    fetch('/api/perfil-usuarios').then((resposta) => resposta.json()).then((resultado) => { if (resultado.success) setPerfilData(resultado.data); }).finally(() => setLoadingPerfil(false));
  }, []);

  useEffect(() => {
    async function carregarTransacoes() {
      setLoadingTransacoes(true);
      const parametros = new URLSearchParams();
      if (anoRanking) parametros.set('rankingAno', anoRanking);
      if (anoLm3) parametros.set('ano', anoLm3);
      try { const resposta = await fetch(`/api/transacoes?${parametros}`); const resultado = await resposta.json(); if (resultado.success) setTransacoesData(resultado.data); }
      catch (error) { console.error('Erro ao carregar as transações:', error); }
      finally { setLoadingTransacoes(false); }
    }
    carregarTransacoes();
  }, [anoRanking, anoLm3]);

  return (
    <>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total de Usuários
          </h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '0.5rem' }}>
            {loading ? 'Carregando...' : data.totalUsuarios.toLocaleString('pt-BR')}
          </p>
        </div>

        {/* Futuramente conectaremos a API de indicadores para os próximos cards */}
        <div className="glass-panel" style={{ padding: '1.5rem', opacity: 0.7 }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Volume Transacionado
          </h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-success)', marginTop: '0.5rem' }}>
            R$ --
          </p>
        </div>
        
      </section>

      {/* Map Section */}
      <section className="glass-panel" style={{ padding: '2rem', minHeight: '500px', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Distribuição de Comércios por Bairro</h2>
        {loadingComercios ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
            <p className="animate-fade-in">Mapeando comércios...</p>
          </div>
        ) : (
          <div style={{ height: '400px', width: '100%' }} className="animate-fade-in">
             <MapComponent data={comerciosData.mapData} maxQtd={comerciosData.maxQtd} />
          </div>
        )}
      </section>

      <section className="glass-panel" style={{ padding: '2rem', minHeight: '430px', marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
          Evolução mensal
        </p>
        <h2 style={{ marginBottom: '0.35rem' }}>Beneficiários e comércios credenciados</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Contas ativas e somatório mensal de estabelecimentos credenciados na rede Arariboia.
        </p>

        {loadingIndicadores ? (
          <div style={{ alignItems: 'center', color: 'var(--text-muted)', display: 'flex', height: '300px', justifyContent: 'center' }}>
            <p className="animate-fade-in">Carregando indicadores...</p>
          </div>
        ) : (
          <div style={{ height: '300px', width: '100%' }} className="animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={indicadoresData.evolucao} margin={{ top: 10, right: 26, left: 12, bottom: 0 }}>
                <CartesianGrid stroke="var(--glass-border)" vertical={false} />
                <XAxis
                  dataKey="periodo"
                  stroke="var(--text-muted)"
                  fontSize={12}
                  minTickGap={28}
                  tickFormatter={(periodo) => {
                    const [ano, mes] = periodo.split('-');
                    return `${mes}/${ano.slice(2)}`;
                  }}
                  tickMargin={10}
                />
                <YAxis
                  yAxisId="comercios"
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickFormatter={(valor) => valor.toLocaleString('pt-BR')}
                  width={42}
                  label={{ value: 'Comércios', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="beneficiarios"
                  orientation="right"
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickFormatter={(valor) => `${Math.round(valor / 1000)} mil`}
                  width={54}
                  label={{ value: 'Usuários', angle: 90, position: 'insideRight', fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: '#fff' }}
                  formatter={(valor: number, nome: string) => [valor.toLocaleString('pt-BR'), nome === 'beneficiarios' ? 'Beneficiários' : 'Comércios credenciados acumulados']}
                  labelFormatter={(periodo) => {
                    const [ano, mes] = periodo.split('-');
                    return `${mes}/${ano}`;
                  }}
                />
                <Legend
                  formatter={(valor) => valor === 'beneficiarios' ? 'Beneficiários' : 'Comércios credenciados acumulados'}
                  wrapperStyle={{ paddingTop: '16px' }}
                />
                <Line yAxisId="comercios" type="monotone" dataKey="comercios" stroke="var(--accent-warning)" strokeWidth={3} dot={{ r: 2.5 }} activeDot={{ r: 5 }} />
                <Line yAxisId="beneficiarios" type="monotone" dataKey="beneficiarios" stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 2.5 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '0.35rem' }}>Bairros que mais recebem transações</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Volume e quantidade recebidos por bairros de Niterói.</p>
          <select aria-label="Ano do ranking" value={anoRanking} onChange={(event) => setAnoRanking(event.target.value)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '1rem', padding: '0.7rem 2.25rem 0.7rem 0.9rem', width: '100%', marginBottom: '1.25rem' }}><option value="">Ano mais recente</option>{transacoesData.filtros.anos.map((ano) => <option key={ano}>{ano}</option>)}</select>
          {loadingTransacoes ? <p style={{ color: 'var(--text-muted)' }}>Processando transações...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead><tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'left', textTransform: 'uppercase' }}><th style={{ padding: '0 0 0.75rem' }}>Bairro</th><th style={{ padding: '0 0 0.75rem', textAlign: 'right' }}>Volume</th><th style={{ padding: '0 0 0.75rem', textAlign: 'right' }}>Transações</th></tr></thead>
                <tbody>{transacoesData.ranking.map((item, index) => <tr key={item.bairro} style={{ borderTop: '1px solid var(--glass-border)' }}><td style={{ padding: '0.8rem 0' }}>{index + 1}. {item.bairro}</td><td style={{ padding: '0.8rem 0', color: 'var(--accent-success)', textAlign: 'right' }}>R$ {item.valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td><td style={{ padding: '0.8rem 0', textAlign: 'right' }}>{item.quantidade.toLocaleString('pt-BR')}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Indicador de circulação local</p>
          <h2 style={{ marginTop: '0.35rem' }}>LM3</h2>
          <select aria-label="Ano do LM3" value={anoLm3} onChange={(event) => setAnoLm3(event.target.value)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--accent-primary)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '1rem', marginTop: '0.75rem', padding: '0.7rem 2.25rem 0.7rem 0.9rem', width: '100%' }}><option value="">Ano mais recente</option>{transacoesData.filtros.anos.map((ano) => <option key={ano}>{ano}</option>)}</select>
          {loadingTransacoes ? <p style={{ color: 'var(--text-muted)', marginTop: '2rem' }}>Calculando...</p> : <>
            <p style={{ color: 'var(--accent-primary)', fontSize: '3.25rem', fontWeight: 700, margin: '1rem 0' }}>{transacoesData.lm3.indice.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</p>
            <p style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 }}>Valor usado para medir o efeito de circulação da moeda social na economia local.</p>
            <div style={{ borderTop: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginTop: '1.25rem', paddingTop: '1rem' }}>
              <p><strong style={{ color: 'var(--text-primary)' }}>Onda 1</strong> · benefícios recebidos · R$ {transacoesData.lm3.onda1.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
              <p><strong style={{ color: 'var(--text-primary)' }}>Onda 2</strong> · gasto PF → PJ local · R$ {transacoesData.lm3.onda2.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
              <p><strong style={{ color: 'var(--text-primary)' }}>Onda 3</strong> · transferência PJ → PJ local · R$ {transacoesData.lm3.onda3.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
            </div>
          </>}
        </div>
      </section>

      <section className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2>Setores que mais recebem de pessoas físicas</h2><p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.35rem 0 1.25rem' }}>Volume das transações PF → PJ no ano escolhido no ranking.</p>
        {loadingTransacoes ? <p style={{ color: 'var(--text-muted)' }}>Processando transações...</p> : <div style={{ height: '310px' }}><ResponsiveContainer><PieChart><Pie data={transacoesData.comercio.setores} dataKey="valor" nameKey="setor" outerRadius={105} label={({ setor }) => setor}>{transacoesData.comercio.setores.map((item, index) => <Cell key={item.setor} fill={['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'][index % 6]} />)}</Pie><Tooltip formatter={(valor: number) => [`R$ ${valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`, 'Volume']} /><Legend /></PieChart></ResponsiveContainer></div>}
      </section>

      <section className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2>Perfil dos usuários</h2><p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.35rem 0 1.25rem' }}>Somatório acumulado de todos os registros disponíveis.</p>
        {loadingPerfil ? <p style={{ color: 'var(--text-muted)' }}>Carregando perfil...</p> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}><div><h3>Faixa etária</h3><div style={{ height: '240px', marginTop: '-6px' }}><ResponsiveContainer><BarChart data={perfilData.idade} margin={{ top: 18, right: 8, left: -18, bottom: 0 }}><XAxis dataKey="categoria" tickMargin={8} /><YAxis /><Tooltip /><Bar dataKey="quantidade" fill="var(--accent-primary)" minPointSize={8} radius={[4, 4, 0, 0]} label={{ position: 'top', fill: 'var(--text-secondary)', fontSize: 11 }} /></BarChart></ResponsiveContainer></div></div><div><h3>Faixa de renda</h3><div style={{ height: '240px', marginTop: '-6px' }}><ResponsiveContainer><BarChart data={perfilData.renda} margin={{ top: 18, right: 8, left: -18, bottom: 0 }}><XAxis dataKey="categoria" tickMargin={8} /><YAxis /><Tooltip /><Bar dataKey="quantidade" fill="var(--accent-success)" minPointSize={8} radius={[4, 4, 0, 0]} label={{ position: 'top', fill: 'var(--text-secondary)', fontSize: 11 }} /></BarChart></ResponsiveContainer></div></div><div><h3>Gênero</h3><div style={{ height: '210px' }}><ResponsiveContainer><PieChart><Pie data={perfilData.genero} dataKey="quantidade" nameKey="categoria" outerRadius={72} label>{perfilData.genero.map((item, index) => <Cell key={item.categoria} fill={['#8b5cf6', '#ec4899'][index]} />)}</Pie><Legend /><Tooltip /></PieChart></ResponsiveContainer></div><p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}><strong style={{ color: 'var(--accent-warning)' }}>{perfilData.percentualNaoIdentificado.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong> sem gênero identificado</p></div></div>}
      </section>

      <section className="glass-panel" style={{ padding: '2rem', minHeight: '400px' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Evolução de Pagamentos de Benefícios (Volume em R$)</h2>
        
        {loadingBeneficios ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-muted)' }}>
            <p className="animate-fade-in">Processando arquivo (isso pode levar alguns segundos)...</p>
          </div>
        ) : (
          <div style={{ height: '300px', width: '100%' }} className="animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={beneficiosData.evolucao} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="periodo" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(val) => `R$ ${(val / 1000000).toFixed(1)}M`} />
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Valor Total']}
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: 'var(--accent-success)', fontWeight: 'bold' }}
                  cursor={{fill: 'var(--glass-border)'}}
                />
                <Bar dataKey="valorTotal" fill="var(--accent-success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </>
  );
}
