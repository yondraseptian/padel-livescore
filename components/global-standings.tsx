'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlayerClick = (player: GlobalStanding) => {
    setSelectedPlayer(player);
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
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
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
            onClick={() => handlePlayerClick(player)}
            className={`relative overflow-hidden rounded-2xl p-6 border cursor-pointer transform transition-all hover:scale-[1.02] active:scale-95 ${
              index === 0 ? 'bg-gradient-to-br from-amber-500/20 to-amber-900/40 border-amber-500/50' :
              index === 1 ? 'bg-gradient-to-br from-slate-400/20 to-slate-600/40 border-slate-400/50' :
              'bg-gradient-to-br from-orange-600/20 to-orange-900/40 border-orange-600/50'
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
                  index === 0 ? 'bg-amber-500 text-white' :
                  index === 1 ? 'bg-slate-300 text-slate-900' :
                  'bg-orange-500 text-white'
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
              index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-300' : 'text-orange-500'
            }`} />
          </div>
        ))}
      </div>

      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden backdrop-blur-sm">
        <CardHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Leaderboard Global
              </CardTitle>
              <CardDescription className="text-slate-400">
                Peringkat akumulatif dari semua kompetisi yang diikuti
              </CardDescription>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <div className="text-center px-4 py-1 rounded-full bg-slate-800 border border-slate-700">
                <p className="text-[10px] uppercase text-slate-500 font-bold">Total Players</p>
                <p className="text-sm font-bold text-white">{standings.length}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="w-16 text-center text-slate-500 uppercase text-[10px] font-bold">Rank</TableHead>
                  <TableHead className="text-slate-500 uppercase text-[10px] font-bold">Pemain</TableHead>
                  <TableHead className="text-center text-slate-500 uppercase text-[10px] font-bold">Turnamen</TableHead>
                  <TableHead className="text-center text-slate-500 uppercase text-[10px] font-bold">W-L</TableHead>
                  <TableHead className="text-center text-slate-500 uppercase text-[10px] font-bold">Diff</TableHead>
                  <TableHead className="text-right text-amber-500 uppercase text-[10px] font-bold">Total Poin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((player, index) => (
                  <TableRow key={player.id} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                    <TableCell className="text-center">
                      <span className={`inline-flex w-8 h-8 items-center justify-center rounded-full font-bold text-sm ${
                        index === 0 ? 'bg-amber-500/20 text-amber-500' :
                        index === 1 ? 'bg-slate-400/20 text-slate-300' :
                        index === 2 ? 'bg-orange-500/20 text-orange-500' :
                        'text-slate-500'
                      }`}>
                        {index + 1}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {player.avatar_url ? (
                            <img src={player.avatar_url} alt={player.name} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400">
                              {player.name.charAt(0)}
                            </div>
                          )}
                          {index < 3 && (
                            <div className="absolute -bottom-1 -right-1">
                              <div className={`w-4 h-4 rounded-full border-2 border-slate-900 ${
                                index === 0 ? 'bg-amber-500' :
                                index === 1 ? 'bg-slate-300' :
                                'bg-orange-500'
                              }`} />
                            </div>
                          )}
                        </div>
                        <div 
                          className="cursor-pointer group/name"
                          onClick={() => handlePlayerClick(player)}
                        >
                          <p className="font-bold text-white group-hover/name:text-amber-500 transition-colors">{player.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">ID: {player.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium text-slate-300">
                      {player.tournaments_played}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-300">
                          <span className="text-green-500">{player.total_matches_won}</span>
                          <span className="mx-1">/</span>
                          <span className="text-red-500">{player.total_matches_lost}</span>
                        </span>
                        <div className="w-12 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-green-500" 
                            style={{ width: `${(player.total_matches_won / (player.total_matches_played || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-mono text-xs ${
                        (player.total_games_won - player.total_games_lost) > 0 ? 'text-green-400' :
                        (player.total_games_won - player.total_games_lost) < 0 ? 'text-red-400' :
                        'text-slate-500'
                      }`}>
                        {(player.total_games_won - player.total_games_lost) > 0 ? '+' : ''}
                        {player.total_games_won - player.total_games_lost}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-black text-amber-500 italic tabular-nums">
                          {player.total_points}
                        </span>
                        <span className="text-[9px] uppercase text-slate-600 font-bold">Total Poin</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
      />
    </div>
  );
}
