import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dashboard Arariboia | Niterói',
  description: 'Visualização de dados sobre o uso da moeda social Arariboia em Niterói.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="dashboard-layout">
          {/* Sidebar placeholder - transformaremos num componente em breve */}
          <aside className="glass-panel" style={{ 
            width: 'var(--sidebar-width)', 
            position: 'fixed', 
            top: 0, 
            bottom: 0, 
            left: 0, 
            padding: '2rem',
            borderTop: 'none',
            borderBottom: 'none',
            borderLeft: 'none',
            borderRadius: 0,
            zIndex: 10
          }}>
            <h2>Arariboia</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Dashboard de Dados</p>
            
            <nav style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <a href="#" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>Visão Geral</a>
              <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Usuários</a>
              <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Transações</a>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="dashboard-main animate-fade-in">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
