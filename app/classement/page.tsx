'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Standings } from '@/components/standings';
import { Trophy, Medal, Target } from 'lucide-react';

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
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Page Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Klasemen & Ranking</h1>
          <p className="text-slate-400">Lihat peringkat pemain dan statistik terkini</p>
        </div>

        {/* Category Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {categoryData.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card key={index} className="bg-slate-900 border-slate-700 hover:border-amber-500 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-6 h-6 text-amber-500" />
                    <CardTitle className="text-white">{category.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Top Pemain</p>
                      <p className="text-lg font-bold text-white">{category.topPlayer.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-700">
                      <div>
                        <p className="text-xs text-slate-400">Kemenangan</p>
                        <p className="text-xl font-bold text-amber-500">{category.topPlayer.wins}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Poin</p>
                        <p className="text-xl font-bold text-amber-500">{category.topPlayer.points}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div> */}

        {/* Standings Section */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h3 className="text-2xl font-bold text-white">Peringkat Turnamen</h3>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <Standings />
          </div>
        </section>

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
              <span>Poin dihitung berdasarkan set yang dimenangkan dan tingkat kesulitan lawan</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-500 font-bold">•</span>
              <span>Pemain dapat naik atau turun kategori berdasarkan performa bulanan</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-500 font-bold">•</span>
              <span>Top 3 pemain di setiap kategori mendapat hadiah eksklusif</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
