import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MatchCard } from '@/components/match-card';
import { Standings } from '@/components/standings';
import { getUpcomingMatches } from '@/lib/match-service';
import { Activity, Trophy, Users } from 'lucide-react';
import { Header } from '@/components/header';

export const revalidate = 60; // Revalidate every 60 seconds

export const metadata: Metadata = {
  title: 'Padel LiveScore - Real-time Match Updates',
  description: 'Watch live padel match scores, check standings, and upcoming matches. Real-time score updates for padel tennis tournaments.',
};

async function getMatchesData() {
  try {
    const matches = await getUpcomingMatches(10);
    return matches;
  } catch (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
}

export default async function Home() {
  const matches = await getMatchesData();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Banner */}
        <section className="mb-16 relative overflow-hidden">
          <div className="relative bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
            </div>

            {/* Content */}
            <div className="relative p-12 md:p-16 text-center text-white">
              <div className="mb-4 inline-flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full">
                <Trophy className="w-5 h-5" />
                <span className="text-sm font-semibold">Turnamen Padel 2024</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
                Saksikan Pertandingan Terbaik
              </h2>
              <p className="text-lg md:text-xl text-white/90 mb-6 text-balance">
                Ikuti live score, statistik, dan peringkat pemain terbaik dalam waktu nyata
              </p>
              <Button size="lg" className="bg-white text-amber-600 hover:bg-slate-100 font-semibold">
                Lihat Jadwal Lengkap
              </Button>
            </div>
          </div>
        </section>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Left Column - Matches (2 columns on large screens) */}
          <div className="lg:col-span-2">
            {/* Upcoming & Live Matches Section */}
            <section>
              <div className="mb-8 flex items-center gap-2">
                <Activity className="w-6 h-6 text-amber-500" />
                <h3 className="text-2xl font-bold text-white">Live & Upcoming</h3>
                {matches.some(m => m.status === 'live') && (
                  <span className="ml-auto inline-flex items-center gap-1 text-red-500 text-sm font-semibold">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    LIVE NOW
                  </span>
                )}
              </div>

              {matches.length > 0 ? (
                <div className="grid gap-4">
                  {matches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
                  <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-300 mb-2">Tidak ada pertandingan saat ini</p>
                  <p className="text-sm text-slate-400">Kembali lagi nanti untuk melihat jadwal terbaru</p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column - Sponsor & Info */}
          <div className="space-y-8">
            {/* Sponsor Section */}
            <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Sponsor Resmi
              </h3>

              {/* Gold Sponsors */}
              <div className="mb-8">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-4">Sponsor Platinum</p>
                <div className="space-y-3">
                  {[1, 2].map((sponsor) => (
                    <div
                      key={sponsor}
                      className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-700/30 rounded-lg p-4 flex items-center justify-center min-h-24"
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-amber-600/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <span className="text-2xl font-bold text-amber-400">S{sponsor}</span>
                        </div>
                        <p className="text-xs text-slate-400">Sponsor Logo</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Silver Sponsors */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-4">Sponsor Gold</p>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((sponsor) => (
                    <div
                      key={sponsor}
                      className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 flex items-center justify-center aspect-square"
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-300">S{sponsor}</div>
                        <p className="text-xs text-slate-500 mt-1">Logo</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Quick Stats */}
            <section className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-amber-500 mb-1">
                  {matches.length}
                </div>
                <p className="text-sm text-slate-400">Pertandingan</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-500 mb-1">
                  {matches.filter(m => m.status === 'live').length}
                </div>
                <p className="text-sm text-slate-400">Live Sekarang</p>
              </div>
            </section>

            {/* Tournament Info */}
            <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Informasi</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>Turnamen terbuka untuk semua level</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>Update skor real-time</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>Pantau statistik pemain</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>Lihat peringkat global</span>
                </li>
              </ul>
            </section>
          </div>
        </div>

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

        {/* Footer Info */}
        <section className="border-t border-slate-700 pt-12 text-center text-slate-400">
          <p className="mb-4 text-white font-semibold">Padel LiveScore - Platform Skor Turnamen Padel Real-time</p>
          <p className="text-sm">
            Terakhir diperbarui:{' '}
            <span className="font-mono text-slate-300">
              {new Date().toLocaleTimeString('id-ID')}
            </span>
          </p>
        </section>
      </main>
    </div>
  );
}
