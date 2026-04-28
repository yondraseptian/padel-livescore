import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MatchCard } from '@/components/match-card';
import { TournamentStandings } from '@/components/tournament-standings';
import { getUpcomingMatches } from '@/lib/match-service';
import { Activity, Trophy, Users, TrendingUp } from 'lucide-react';
import { Header } from '@/components/header';

export const revalidate = 60;

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
    <div className="min-h-screen bg-[#fefefe]">
      <Header />
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
          {/* Left Column - Matches */}
          <div className="lg:col-span-2">

            {/* Live Matches */}
            <section className="mb-10">
              <div className="mb-6 flex items-center gap-2">
                <Activity className="w-6 h-6 text-red-500" />
                <h3 className="text-2xl font-bold text-[#282c90]">Live Now</h3>
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
                  <div className="text-center py-8 bg-[#282c90]/5 rounded-lg border border-[#48c4c4]/20">
                    <p className="text-[#282c90]/40">Tidak ada pertandingan live saat ini</p>
                  </div>
                )}
              </div>
            </section>

            {/* Scheduled Matches */}
            <section className="mb-10">
              <div className="mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-[#48c4c4]" />
                <h3 className="text-2xl font-bold text-[#282c90]">Scheduled Matches</h3>
              </div>
              <div className="grid gap-4">
                {matches.filter(m => m.status === 'scheduled').length > 0 ? (
                  matches.filter(m => m.status === 'scheduled').map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))
                ) : (
                  <div className="text-center py-8 bg-[#282c90]/5 rounded-lg border border-[#48c4c4]/20">
                    <p className="text-[#282c90]/40">Tidak ada pertandingan terjadwal</p>
                  </div>
                )}
              </div>
            </section>

            {/* Completed Matches */}
            <section>
              <div className="mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-green-500" />
                <h3 className="text-2xl font-bold text-[#282c90]">Completed Matches</h3>
              </div>
              <div className="grid gap-4">
                {matches.filter(m => m.status === 'completed').length > 0 ? (
                  matches.filter(m => m.status === 'completed').map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))
                ) : (
                  <div className="text-center py-8 bg-[#282c90]/5 rounded-lg border border-[#48c4c4]/20">
                    <p className="text-[#282c90]/40">Belum ada pertandingan selesai</p>
                  </div>
                )}
              </div>
            </section>

            {/* Tournament Standings */}
            <section className="mt-16 bg-white border border-[#48c4c4]/25 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#48c4c4]/10 rounded-xl">
                    <Trophy className="w-6 h-6 text-[#48c4c4]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#282c90] tracking-tight">Klasemen Turnamen</h3>
                    <p className="text-sm text-[#282c90]/50">Peringkat real-time turnamen yang sedang berjalan</p>
                  </div>
                </div>
                <Link href="/classement">
                  <Button variant="ghost" size="sm" className="text-[#48c4c4] hover:text-[#48c4c4]/80 hover:bg-[#48c4c4]/10 font-semibold gap-2">
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
            <section className="bg-white border border-[#48c4c4]/25 rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-[#282c90] mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#48c4c4]" />
                Sponsor Resmi
              </h3>
              <div className="mb-8">
                <p className="text-xs font-semibold text-[#282c90]/40 uppercase mb-4">Sponsor Platinum</p>
                <div className="space-y-3">
                  {[1, 2].map((sponsor) => (
                    <div key={sponsor} className="bg-gradient-to-r from-[#48c4c4]/10 to-[#282c90]/5 border border-[#48c4c4]/25 rounded-lg p-4 flex items-center justify-center min-h-24">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-[#48c4c4]/15 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <span className="text-2xl font-bold text-[#48c4c4]">S{sponsor}</span>
                        </div>
                        <p className="text-xs text-[#282c90]/30">Sponsor Logo</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#282c90]/40 uppercase mb-4">Sponsor Gold</p>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((sponsor) => (
                    <div key={sponsor} className="bg-[#282c90]/5 border border-[#48c4c4]/20 rounded-lg p-3 flex items-center justify-center aspect-square">
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#282c90]/50">S{sponsor}</div>
                        <p className="text-xs text-[#282c90]/30 mt-1">Logo</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Quick Stats */}
            <section className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-[#48c4c4]/25 rounded-xl p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-[#48c4c4] mb-1">{matches.length}</div>
                <p className="text-sm text-[#282c90]/50">Pertandingan</p>
              </div>
              <div className="bg-white border border-[#48c4c4]/25 rounded-xl p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-green-500 mb-1">{matches.filter(m => m.status === 'live').length}</div>
                <p className="text-sm text-[#282c90]/50">Live Sekarang</p>
              </div>
            </section>

            {/* Info */}
            <section className="bg-white border border-[#48c4c4]/25 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#282c90] mb-4">Informasi</h3>
              <ul className="space-y-3 text-sm text-[#282c90]/60">
                <li className="flex gap-2"><span className="text-[#48c4c4] font-bold">•</span><span>Turnamen terbuka untuk semua level</span></li>
                <li className="flex gap-2"><span className="text-[#48c4c4] font-bold">•</span><span>Update skor real-time</span></li>
                <li className="flex gap-2"><span className="text-[#48c4c4] font-bold">•</span><span>Pantau statistik pemain</span></li>
                <li className="flex gap-2"><span className="text-[#48c4c4] font-bold">•</span><span>Lihat peringkat global</span></li>
              </ul>
            </section>
          </div>
        </div>

        {/* Footer Info */}
        <section className="border-t border-[#48c4c4]/20 pt-12 text-center text-[#282c90]/40">
          <p className="mb-4 text-[#282c90] font-semibold">Padel LiveScore - Platform Skor Turnamen Padel Real-time</p>
          <p className="text-sm">
            Terakhir diperbarui:{' '}
            <span className="font-mono text-[#48c4c4]">{new Date().toLocaleTimeString('id-ID')}</span>
          </p>
        </section>
      </main>
    </div>
  );
}
