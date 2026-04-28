'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Trophy, Medal, Star, TrendingUp, Users } from 'lucide-react';
import { PlayerCardModal } from './player-card-modal';

interface GlobalStanding {
  id: string;
  name: string;
  avatar_url?: string;
  total_points: number;
  total_matches_played: number;
  total_matches_won: number;
  total_matches_lost: number;
  total_games_won: number;
  total_games_lost: number;
  tournaments_played: number;
}

export function GlobalStandings() {
  const [standings, setStandings] = useState<GlobalStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<GlobalStanding | null>(null);
  const [selectedRank, setSelectedRank] = useState<number | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlayerClick = (player: GlobalStanding, rank: number) => {
    setSelectedPlayer(player);
    setSelectedRank(rank);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const fetchGlobalStandings = async () => {
      try {
        const res = await fetch('/api/standings/global');
        const data = await res.json();
        if (Array.isArray(data)) {
          setStandings(data);
        }
      } catch (error) {
        console.error('Error fetching global standings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalStandings();
    const interval = setInterval(fetchGlobalStandings, 120000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="w-8 h-8 border-4 border-[#48c4c4]/30 border-t-[#48c4c4] rounded-full animate-spin mb-4" />
        <p>Memuat klasemen global...</p>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-xl">
        <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
        <p className="text-slate-400">Belum ada data pemain tersedia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {standings.slice(0, 3).map((player, index) => (
          <div 
            key={player.id} 
            onClick={() => handlePlayerClick(player, index + 1)}
            className={`relative overflow-hidden rounded-2xl p-4 sm:p-6 border cursor-pointer transform transition-all hover:scale-[1.02] active:scale-95 ${
              index === 0 ? 'bg-gradient-to-br from-[#48c4c4]/20 to-[#48c4c4]/5 border-[#48c4c4]/50' :
              index === 1 ? 'bg-gradient-to-br from-[#282c90]/40 to-[#1a1e6e]/60 border-[#48c4c4]/20' :
              'bg-gradient-to-br from-[#282c90]/20 to-[#48c4c4]/10 border-[#282c90]/40'
            }`}
          >
            <div className="relative z-10 flex items-center gap-4">
              <div className="relative">
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt={player.name} className="w-16 h-16 rounded-full border-2 border-white/20 object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-white/10 flex items-center justify-center text-xl font-bold">
                    {player.name.charAt(0)}
                  </div>
                )}
                <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                  index === 0 ? 'bg-[#48c4c4] text-[#282c90]' :
                  index === 1 ? 'bg-[#282c90] text-[#48c4c4]' :
                  'bg-[#1a1e6e] text-[#48c4c4]'
                }`}>
                  {index === 0 ? <Trophy className="w-4 h-4" /> : index + 1}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-lg text-white line-clamp-1">{player.name}</h4>
                <p className="text-sm text-slate-300 font-medium">
                  {player.total_points} Poin <span className="mx-1">•</span> {player.tournaments_played} Turnamen
                </p>
              </div>
            </div>
            {/* Background Icon */}
            <Trophy className={`absolute -bottom-4 -right-4 w-24 h-24 opacity-10 ${
              index === 0 ? 'text-[#48c4c4]' : index === 1 ? 'text-[#fefefe]' : 'text-[#48c4c4]'
            }`} />
          </div>
        ))}
      </div>

      <Card className="bg-[#1a1e6e]/80 border-[#282c90] overflow-hidden backdrop-blur-sm">
        <CardHeader className="border-b border-[#282c90] pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-[#fefefe] flex items-center gap-2">
                <Star className="w-5 h-5 text-[#48c4c4]" />
                Leaderboard Global
              </CardTitle>
              <CardDescription className="text-slate-400">
                Peringkat akumulatif dari semua kompetisi yang diikuti
              </CardDescription>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <div className="text-center px-4 py-1 rounded-full bg-[#282c90] border border-[#48c4c4]/30">
                <p className="text-[10px] uppercase text-[#48c4c4]/60 font-bold">Total Players</p>
                <p className="text-sm font-bold text-[#fefefe]">{standings.length}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card List */}
          <div className="divide-y divide-[#282c90]/60">
            {standings.map((player, index) => {
              const diff = player.total_games_won - player.total_games_lost;
              const winRate = player.total_matches_played
                ? Math.round((player.total_matches_won / player.total_matches_played) * 100)
                : 0;
              return (
                <div
                  key={player.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#282c90]/40 transition-colors cursor-pointer active:bg-[#282c90]/60"
                  onClick={() => handlePlayerClick(player, index + 1)}
                >
                  {/* Rank */}
                  <span className={`flex-shrink-0 inline-flex w-8 h-8 items-center justify-center rounded-full font-bold text-sm ${
                    index === 0 ? 'bg-[#48c4c4]/20 text-[#48c4c4]' :
                    index === 1 ? 'bg-[#fefefe]/10 text-[#fefefe]/70' :
                    index === 2 ? 'bg-[#282c90]/40 text-[#48c4c4]/80' :
                    'text-slate-500'
                  }`}>
                    {index + 1}
                  </span>

                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt={player.name} className="w-10 h-10 rounded-full object-cover border border-[#282c90]" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#282c90] border border-[#48c4c4]/20 flex items-center justify-center font-bold text-[#48c4c4]">
                        {player.name.charAt(0)}
                      </div>
                    )}
                    {index < 3 && (
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#1a1e6e] ${
                        index === 0 ? 'bg-[#48c4c4]' : index === 1 ? 'bg-[#fefefe]' : 'bg-[#282c90]'
                      }`} />
                    )}
                  </div>

                  {/* Name + ID */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#fefefe] text-sm truncate">{player.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-[#fefefe]/40">
                        <span className="text-green-400 font-bold">{player.total_matches_won}W</span>
                        <span className="text-[#fefefe]/20 mx-0.5">/</span>
                        <span className="text-red-400 font-bold">{player.total_matches_lost}L</span>
                      </span>
                      <span className="text-[#282c90]/60">•</span>
                      <span className={`text-[10px] font-mono font-bold ${
                        diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-[#fefefe]/30'
                      }`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                      <span className="text-[#282c90]/60">•</span>
                      <span className="text-[10px] text-[#fefefe]/30">{player.tournaments_played} trn</span>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="flex-shrink-0 text-right">
                    <span className="text-lg font-black text-[#48c4c4] italic tabular-nums leading-none">
                      {player.total_points}
                    </span>
                    <p className="text-[9px] uppercase text-[#48c4c4]/40 font-bold">Poin</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Legend / Info */}
      <div className="flex flex-wrap gap-4 text-[10px] text-slate-500 font-medium uppercase tracking-widest px-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>W: Menang</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>L: Kalah</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-500" />
          <span>Diff: Selisih Games</span>
        </div>
      </div>

      <PlayerCardModal 
        player={selectedPlayer}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isGlobal={true}
        rank={selectedRank}
      />
    </div>
  );
}
