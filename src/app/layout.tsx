import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Transporte Edan | Control de Flota y Costos',
  description: 'Sistema de gestión de carga pesada, control de combustible, cauchos, choferes y mantenimiento.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
