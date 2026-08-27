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
          <main className="dashboard-main animate-fade-in">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
