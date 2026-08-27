import DashboardClient from '@/components/DashboardClient';

export default function Home() {
  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Dashboard Arariboia</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Bem-vindo ao painel de visualização da moeda social Arariboia em Niterói.
        </p>
      </header>

      <DashboardClient />
    </div>
  );
}
