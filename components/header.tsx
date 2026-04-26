import Link from 'next/link';
import { Activity } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-8 h-8 text-amber-500" />
          <h1 className="text-2xl font-bold text-white">Padel LiveScore</h1>
        </div>
        <nav className="flex gap-8">
          <Link href="/" className="text-slate-300 hover:text-amber-500 transition-colors font-semibold">
            Jadwal
          </Link>
          <Link href="/classement" className="text-slate-300 hover:text-amber-500 transition-colors font-semibold">
            Klasemen
          </Link>
          <Link href="/roles" className="text-slate-300 hover:text-amber-500 transition-colors font-semibold">
            Aturan
          </Link>
        </nav>
      </div>
    </header>
  );
}
