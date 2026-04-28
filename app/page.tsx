import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MatchCard } from '@/components/match-card';
import { Standings } from '@/components/standings';
import { TournamentStandings } from '@/components/tournament-standings';
import { getUpcomingMatches } from '@/lib/match-service';
import { Activity, Trophy, Users, TrendingUp } from 'lucide-react';
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
        <section className="mb-16 relative overflow-hidden rounded-2xl aspect-[21/9] md:aspect-[3/1]">
          <img 
            src="/banners/padeloop logo.jpeg" 
            alt="Tournament Banner" 
            className="w-full h-full object-cover"
          />
        </section>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Left Column - Matches (2 columns on large screens) */}
          <div className="lg:col-span-2">
            
            {/* Live Matches */}
            <section className="mb-10">
              <div className="mb-6 flex items-center gap-2">
                <Activity className="w-6 h-6 text-red-500" />
                <h3 className="text-2xl font-bold text-white">Live Now</h3>
                <span className="ml-auto inline-flex items-center gap-1 text-red-500 text-sm font-semibold">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  {matches.filter(m => m.status === 'live').length} Matches
                </span>
              </div>
              <div className="grid gap-4">
                {matches.filter(m => m.status === 'live').length > 0 ? (
                  matches.filter(m => m.status === 'live').map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))
                ) : (
                  <div className="text-center py-8 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <p className="text-slate-400">Tidak ada pertandingan live saat ini</p>
                  </div>
                )}
              </div>
            </section>

            {/* Scheduled Matches */}
            <section className="mb-10">
              <div className="mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-amber-500" />
                <h3 className="text-2xl font-bold text-white">Scheduled Matches</h3>
              </div>
              <div className="grid gap-4">
                {matches.filter(m => m.status === 'scheduled').length > 0 ? (
                  matches.filter(m => m.status === 'scheduled').map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))
                ) : (
                  <div className="text-center py-8 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <p className="text-slate-400">Tidak ada pertandingan terjadwal</p>
                  </div>
                )}
              </div>
            </section>

            {/* Completed Matches */}
            <section>
              <div className="mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-green-500" />
                <h3 className="text-2xl font-bold text-white">Completed Matches</h3>
              </div>
              <div className="grid gap-4">
                {matches.filter(m => m.status === 'completed').length > 0 ? (
                  matches.filter(m => m.status === 'completed').map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))
                ) : (
                  <div className="text-center py-8 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <p className="text-slate-400">Belum ada pertandingan selesai</p>
                  </div>
                )}
              </div>
            </section>

            {/* Tournament Standings (Klasemen per Match) */}
            <section className="mt-16 bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 rounded-xl">
                    <Trophy className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">Klasemen Turnamen</h3>
                    <p className="text-sm text-slate-400">Peringkat real-time turnamen yang sedang berjalan</p>
                  </div>
                </div>
                <Link href="/classement">
                  <Button variant="ghost" size="sm" className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 font-semibold gap-2">
                    Lihat Peringkat Global
                    <TrendingUp className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <TournamentStandings />
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
