import DashboardClient from '@/components/DashboardClient';

export default function Home() {
  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Visão Geral</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Bem-vindo ao painel de controle da moeda social Arariboia em Niterói.
        </p>
      </header>

      <DashboardClient />
    </div>
  );
}
