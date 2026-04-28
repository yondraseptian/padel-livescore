'use client';

import { Header } from '@/components/header';
import { Badge } from '@/components/ui/badge';
import { Standings } from '@/components/standings';
import { GlobalStandings } from '@/components/global-standings';
import { Trophy, Loader2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function KlasemenPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        await fetch('/api/tournaments/active');
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  return (
    <div className="min-h-screen bg-[#fefefe]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Page Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#282c90] mb-2">Klasemen &amp; Ranking</h1>
          <p className="text-[#282c90]/50">Lihat peringkat pemain dan statistik terkini</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#282c90]/40">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#48c4c4]" />
            <p>Memuat klasemen...</p>
          </div>
        ) : (
          <section className="mb-16">
            {/* Global Ranking Header */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#48c4c4]/10 rounded-lg">
                  <Trophy className="w-6 h-6 text-[#48c4c4]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#282c90]">Klasemen Lanjutan</h3>
                  <p className="text-sm text-[#282c90]/50">Peringkat akumulatif pemain dari seluruh kompetisi</p>
                </div>
              </div>
              <Badge variant="outline" className="border-[#48c4c4]/30 text-[#48c4c4] bg-[#48c4c4]/5 px-3 py-1">
                Global Ranking
              </Badge>
            </div>

            <GlobalStandings />

            {/* Team Standings */}
            <div className="mt-16 mb-8 flex items-center gap-3">
              <div className="p-2 bg-[#48c4c4]/10 rounded-lg">
                <Users className="w-6 h-6 text-[#48c4c4]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#282c90]">Peringkat Tim</h3>
                <p className="text-sm text-[#282c90]/50">Statistik performa tim di turnamen terbuka</p>
              </div>
            </div>
            <Standings />
          </section>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-white border border-[#48c4c4]/25 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#282c90] mb-4">Informasi Penting</h3>
          <ul className="space-y-3 text-[#282c90]/60">
            <li className="flex gap-3"><span className="text-[#48c4c4] font-bold">•</span><span>Klasemen diperbarui secara real-time setelah setiap pertandingan selesai</span></li>
            <li className="flex gap-3"><span className="text-[#48c4c4] font-bold">•</span><span>Poin dihitung berdasarkan set yang dimenangkan (Tim) atau match won (Americano/Mexicano)</span></li>
            <li className="flex gap-3"><span className="text-[#48c4c4] font-bold">•</span><span>Di format Mexicano, pemain dengan poin berdekatan akan dipasangkan bersama di match selanjutnya</span></li>
            <li className="flex gap-3"><span className="text-[#48c4c4] font-bold">•</span><span>Top 3 pemain di setiap turnamen mendapat medali eksklusif</span></li>
          </ul>
        </div>
      </main>
    </div>
  );
}
