'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        if (Array.isArray(data)) setTournaments(data);
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

  if (loading) return <p className="text-[#282c90]/40 text-sm">Loading tournament standings...</p>;
  if (tournaments.length === 0) return null;

  return (
    <div className="space-y-6 mt-4">
      {tournaments.map(tournament => (
        <Card key={tournament.id} className="bg-white border border-[#48c4c4]/25 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#282c90]/5 to-[#48c4c4]/5 border-b border-[#48c4c4]/15 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#48c4c4]/15 rounded-lg">
                <Trophy className="w-4 h-4 text-[#48c4c4]" />
              </div>
              <div>
                <CardTitle className="text-[#282c90] text-base">{tournament.name}</CardTitle>
                <p className="text-xs uppercase text-[#48c4c4] font-semibold tracking-wider mt-0.5">
                  {tournament.format?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {tournament.format === 'knockout' ? (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4 text-[#282c90]/50">
                  <Network className="w-4 h-4" />
                  <span className="text-sm font-medium">Bagan Pertandingan</span>
                </div>
                <KnockoutBracket matches={tournament.matches || []} />
              </div>
            ) : tournament.format === 'group_stage' ? (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4 text-[#282c90]/50">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-sm font-medium">Klasemen Grup</span>
                </div>
                <GroupStandings players={tournament.players || []} />
              </div>
            ) : tournament.players?.length === 0 ? (
              <p className="text-[#282c90]/30 text-sm p-4">No players enrolled yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#48c4c4]/15 bg-[#282c90]/3 hover:bg-[#282c90]/5">
                      <TableHead className="w-10 text-[#282c90]/40 font-bold">#</TableHead>
                      <TableHead className="text-[#282c90]/40 font-bold">
                        {(['knockout', 'team_americano', 'team_mexicano', 'group_stage'].includes(tournament.format)) ? 'Team' : 'Player'}
                      </TableHead>
                      <TableHead className="text-right text-[#282c90]/40 font-bold" title="Games Played">G</TableHead>
                      <TableHead className="text-center text-[#282c90]/40 font-bold" title="Win-Loss-Tie">W-L-T</TableHead>
                      <TableHead className="text-right text-[#282c90]/40 font-bold" title="Point Difference">DIFF</TableHead>
                      <TableHead className="text-right text-[#48c4c4] font-bold" title="Points">P</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tournament.players.map((tp: any, index: number) => (
                      <TableRow key={tp.id} className="border-[#48c4c4]/10 hover:bg-[#282c90]/3 transition-colors">
                        <TableCell className="font-bold text-[#282c90]/30 text-sm">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div
                            className="flex items-center gap-2 cursor-pointer hover:text-[#48c4c4] transition-colors group"
                            onClick={() => handlePlayerClick(tp, index + 1)}
                          >
                            {tp.player?.avatar_url ? (
                              <img
                                src={tp.player.avatar_url}
                                alt={tp.player.name}
                                className="w-7 h-7 rounded-full object-cover border border-[#48c4c4]/20"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[#282c90]/10 flex items-center justify-center text-[10px] font-bold text-[#48c4c4]">
                                {tp.player?.name?.charAt(0)}
                              </div>
                            )}
                            <span className="font-semibold text-[#282c90] group-hover:text-[#48c4c4] transition-colors">
                              {tp.player?.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-[#282c90]/40 text-sm">
                          {tp.matches_played || 0}
                        </TableCell>
                        <TableCell className="text-center font-medium tracking-wide">
                          <span className="text-green-500">{tp.matches_won || 0}</span>
                          <span className="text-[#282c90]/20 mx-1">-</span>
                          <span className="text-red-400">{tp.matches_lost || 0}</span>
                          <span className="text-[#282c90]/20 mx-1">-</span>
                          <span className="text-[#282c90]/30">{Math.max(0, (tp.matches_played || 0) - (tp.matches_won || 0) - (tp.matches_lost || 0))}</span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm">
                          <span className={((tp.games_won || 0) - (tp.games_lost || 0)) > 0 ? 'text-green-500' : ((tp.games_won || 0) - (tp.games_lost || 0)) < 0 ? 'text-red-400' : 'text-[#282c90]/30'}>
                            {((tp.games_won || 0) - (tp.games_lost || 0)) > 0 ? '+' : ''}{(tp.games_won || 0) - (tp.games_lost || 0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-[#48c4c4] font-black text-lg">
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
