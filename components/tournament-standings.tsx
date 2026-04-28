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
import { Trophy, LayoutGrid, Network } from 'lucide-react';
import { KnockoutBracket, GroupStandings } from './tournament-view';
import { PlayerCardModal } from './player-card-modal';

export function TournamentStandings() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlayer, setActivePlayer] = useState<any | null>(null);
  const [activeRank, setActiveRank] = useState<number | undefined>();

  const handlePlayerClick = (tp: any, rank: number) => {
    if (!tp?.player) return;
    // Merge player identity with tournament stats so the modal has all data
    const mergedPlayer = {
      ...tp.player,
      points: tp.points,
      matches_played: tp.matches_played,
      matches_won: tp.matches_won,
      matches_lost: tp.matches_lost,
      games_won: tp.games_won,
      games_lost: tp.games_lost,
    };
    setActivePlayer(mergedPlayer);
    setActiveRank(rank);
  };

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await fetch('/api/tournaments/active');
        const data = await res.json();
        if (Array.isArray(data)) {
          setTournaments(data);
        }
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
    const interval = setInterval(fetchTournaments, 120000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p className="text-muted-foreground">Loading tournament standings...</p>;
  if (tournaments.length === 0) return null;

  return (
    <div className="space-y-8 mt-8">
      {tournaments.map(tournament => (
        <Card key={tournament.id} className="bg-slate-900 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-white">{tournament.name}</CardTitle>
            </div>
            <CardDescription className="uppercase text-amber-500 font-semibold text-xs tracking-wider">
              Format: {tournament.format}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tournament.format === 'knockout' ? (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-6 text-slate-400">
                  <Network className="w-4 h-4" />
                  <span className="text-sm font-medium">Bagan Pertandingan</span>
                </div>
                <KnockoutBracket matches={tournament.matches || []} />
              </div>
            ) : tournament.format === 'group_stage' ? (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-6 text-slate-400">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-sm font-medium">Klasemen Grup</span>
                </div>
                <GroupStandings players={tournament.players || []} />
              </div>
            ) : tournament.players?.length === 0 ? (
              <p className="text-muted-foreground text-sm">No players enrolled yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-800/50">
                      <TableHead className="w-12 text-slate-400">#</TableHead>
                      <TableHead className="text-slate-400">{(['knockout', 'team_americano', 'team_mexicano', 'group_stage'].includes(tournament.format)) ? 'Team' : 'Player'}</TableHead>
                      <TableHead className="text-right text-slate-400" title="Games Played">G</TableHead>
                      <TableHead className="text-center text-slate-400" title="Win-Loss-Tie">W-L-T</TableHead>
                      <TableHead className="text-right text-slate-400" title="Point Difference">DIFF</TableHead>
                      <TableHead className="text-right text-amber-500 font-bold" title="Points">P</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tournament.players.map((tp: any, index: number) => (
                      <TableRow key={tp.id} className="border-slate-800 hover:bg-slate-800/50 transition-colors">
                        <TableCell className="font-bold text-slate-500">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                            <div 
                              className="flex items-center gap-2 cursor-pointer hover:text-amber-500 transition-colors"
                              onClick={() => handlePlayerClick(tp, index + 1)}
                            >
                              {tp.player?.avatar_url ? (
                                <img
                                  src={tp.player.avatar_url}
                                  alt={tp.player.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                  {tp.player?.name?.charAt(0)}
                                </div>
                              )}
                              <span className="font-medium text-slate-200">{tp.player?.name}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-right text-slate-400">
                          {tp.matches_played || 0}
                        </TableCell>
                        <TableCell className="text-center text-slate-300 font-medium tracking-wide">
                          <span className="text-green-500/80">{tp.matches_won || 0}</span>
                          <span className="text-slate-500 mx-1">-</span>
                          <span className="text-red-500/80">{tp.matches_lost || 0}</span>
                          <span className="text-slate-500 mx-1">-</span>
                          <span className="text-slate-400">{Math.max(0, (tp.matches_played || 0) - (tp.matches_won || 0) - (tp.matches_lost || 0))}</span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={((tp.games_won || 0) - (tp.games_lost || 0)) > 0 ? 'text-green-400' : ((tp.games_won || 0) - (tp.games_lost || 0)) < 0 ? 'text-red-400' : 'text-slate-400'}>
                            {((tp.games_won || 0) - (tp.games_lost || 0)) > 0 ? '+' : ''}{(tp.games_won || 0) - (tp.games_lost || 0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-amber-500 font-bold text-lg">
                          {tp.points || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <PlayerCardModal 
        player={activePlayer}
        isOpen={!!activePlayer}
        onClose={() => {
            setActivePlayer(null);
            setActiveRank(undefined);
        }}
        isGlobal={false}
        rank={activeRank}
      />
    </div>
  );
}
