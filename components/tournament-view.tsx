"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  points: number;
  group_name?: string;
}

interface Match {
  id: string;
  round_number: number;
  team1_player1?: { name: string };
  team1_player2?: { name: string };
  team2_player1?: { name: string };
  team2_player2?: { name: string };
  status: string;
  winner_id?: string;
}

export function KnockoutBracket({ matches }: { matches: Match[] }) {
  // Group matches by round
  const rounds: Record<number, Match[]> = {};
  matches.forEach(m => {
    if (!rounds[m.round_number]) rounds[m.round_number] = [];
    rounds[m.round_number].push(m);
  });

  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);

  return (
    <div className="flex gap-8 overflow-x-auto pb-8 snap-x">
      {roundNumbers.map((roundNum) => (
        <div key={roundNum} className="min-w-[280px] space-y-6 snap-center">
          <div className="text-center">
            <h3 className="text-lg font-bold text-amber-500 uppercase tracking-wider">
              {roundNum === Math.max(...roundNumbers) ? 'Final' : `Babak ${roundNum}`}
            </h3>
          </div>
          <div className="space-y-4">
            {rounds[roundNum].map((match) => (
              <div key={match.id} className="relative">
                <Card className="bg-slate-900 border-slate-700 overflow-hidden">
                  <CardContent className="p-0">
                    <div className={`p-3 border-b border-slate-800 flex justify-between items-center ${match.winner_id && (match.winner_id === match.team1_player1?.name || '') ? 'bg-amber-500/10' : ''}`}>
                      <div className="truncate text-sm font-semibold">
                        {match.team1_player1?.name}
                        {match.team1_player2?.name && ` / ${match.team1_player2.name}`}
                      </div>
                      {match.status === 'completed' && match.winner_id && (match.winner_id === match.team1_player1?.name) && (
                        <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className={`p-3 flex justify-between items-center ${match.winner_id && (match.winner_id === match.team2_player1?.name || '') ? 'bg-amber-500/10' : ''}`}>
                      <div className="truncate text-sm font-semibold">
                        {match.team2_player1?.name}
                        {match.team2_player2?.name && ` / ${match.team2_player2.name}`}
                      </div>
                      {match.status === 'completed' && match.winner_id && (match.winner_id === match.team2_player1?.name) && (
                        <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GroupStandings({ players }: { players: any[] }) {
  // Group players by group_name
  const groups: Record<string, any[]> = {};
  players.forEach(p => {
    const groupName = p.group_name || 'Tanpa Grup';
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(p);
  });

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {Object.entries(groups).sort().map(([groupName, groupPlayers]) => (
        <Card key={groupName} className="bg-slate-900 border-slate-700">
          <CardHeader className="border-b border-slate-800 pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              {groupName}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-slate-400 bg-slate-950/50">
                <tr>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3 text-center">M</th>
                  <th className="px-4 py-3 text-center text-amber-500">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {groupPlayers.sort((a, b) => b.points - a.points).map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 w-4">{idx + 1}</span>
                        {p.player?.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-400">{p.matches_played}</td>
                    <td className="px-4 py-3 text-center font-bold text-amber-500">{p.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
