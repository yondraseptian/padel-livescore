'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Standings } from '@/components/standings';
import { TournamentStandings } from '@/components/tournament-standings';
import { Trophy, Medal, Target, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const categoryData = [
  {
    title: 'Kategori Pemula',
    icon: Target,
    topPlayer: {
      name: 'Alejandro Ponce',
      wins: 12,
      points: 456,
    },
  },
  {
    title: 'Kategori Menengah',
    icon: Medal,
    topPlayer: {
      name: 'Sergio Delgado',
      wins: 18,
      points: 678,
    },
  },
  {
    title: 'Kategori Profesional',
    icon: Trophy,
    topPlayer: {
      name: 'Juan Carlos Fernández',
      wins: 24,
      points: 892,
    },
  },
];

export default function KlasemenPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await fetch('/api/tournaments/active');
        const data = await res.json();
        setTournaments(data || []);
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Page Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Klasemen & Ranking</h1>
          <p className="text-slate-400">Lihat peringkat pemain dan statistik terkini</p>
        </div>

        

        {/* Standings Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500" />
            <p>Memuat klasemen...</p>
          </div>
        ) : tournaments.length > 0 ? (
          <section className="mb-16">
            <div className="mb-8 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              <h3 className="text-2xl font-bold text-white">Peringkat Turnamen</h3>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
              <Standings />
            </div>
            
            <TournamentStandings />
          </section>
        ) : (
          <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-xl mb-16">
            <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Tidak Ada Turnamen Aktif</h3>
            <p className="text-slate-400">Saat ini tidak ada turnamen yang sedang berlangsung.</p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Informasi Penting</h3>
          <ul className="space-y-3 text-slate-300">
            <li className="flex gap-3">
              <span className="text-amber-500 font-bold">•</span>
              <span>Klasemen diperbarui secara real-time setelah setiap pertandingan selesai</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-500 font-bold">•</span>
              <span>Poin dihitung berdasarkan set yang dimenangkan (Tim) atau match won (Americano/Mexicano)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-500 font-bold">•</span>
              <span>Di format Mexicano, pemain dengan poin berdekatan akan dipasangkan bersama di match selanjutnya</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-500 font-bold">•</span>
              <span>Top 3 pemain di setiap turnamen mendapat medali eksklusif</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
