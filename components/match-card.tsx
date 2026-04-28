'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSocketMatch } from '@/hooks/use-socket-match';
import { getTeamInitials } from '@/lib/utils';
import type { Match } from '@/lib/db';

function getTennisScoreDisplay(teamPoints: number, oppPoints: number, isTiebreaker: boolean = false): string {
  if (isTiebreaker) return teamPoints.toString();
  if (teamPoints >= 3 && oppPoints >= 3) {
    if (teamPoints === oppPoints) return '40';
    if (teamPoints > oppPoints) return 'AD';
    return '40';
  }
  const scoreMap = ['0', '15', '30', '40'];
  return scoreMap[teamPoints] || '40';
}

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const { score, loading } = useSocketMatch(match.id);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';

  return (
    <Card className={`overflow-hidden transition-all shadow-sm hover:shadow-md border ${
      isLive
        ? 'border-red-400/40 bg-white'
        : isCompleted
          ? 'border-[#48c4c4]/20 bg-white'
          : 'border-[#282c90]/10 bg-white'
    }`}>
      <CardContent className="p-5">
        {/* Status Badge + Date */}
        <div className="flex justify-between items-center mb-4">
          <Badge
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border-0 ${
              isLive
                ? 'bg-red-500/10 text-red-600'
                : isCompleted
                  ? 'bg-[#48c4c4]/10 text-[#48c4c4]'
                  : 'bg-[#282c90]/10 text-[#282c90]'
            }`}
          >
            {isLive && (
              <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-1.5" />
            )}
            {isLive ? 'LIVE' : isCompleted ? 'SELESAI' : 'TERJADWAL'}
          </Badge>
          <span className="text-xs text-[#282c90]/40 font-medium">
            {formatDate(match.scheduled_at)}
          </span>
        </div>

        {/* Match Score Display */}
        <div className="grid grid-cols-3 gap-4 items-center">
          {/* Team 1 */}
          <div className="text-center flex flex-col items-center">
            <Avatar className="w-12 h-12 mb-2 rounded-xl border border-[#48c4c4]/20">
              <AvatarImage
                src={match.match_type === 'individual' ? (match.team1_player1?.avatar_url || '') : (match.team1?.logo_url || '')}
                alt={match.match_type === 'individual' ? `${match.team1_player1?.name}` : match.team1?.name}
                className="object-cover"
              />
              <AvatarFallback className="rounded-xl bg-[#282c90]/10 text-[#282c90] font-bold text-lg">
                {getTeamInitials(match.match_type === 'individual'
                  ? (match.team1_player2?.name
                      ? `${match.team1_player1?.name?.charAt(0) || ''}${match.team1_player2?.name?.charAt(0) || ''}`
                      : (match.team1_player1?.name || ''))
                  : (match.team1?.name || '')
                )}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold text-sm text-[#282c90] text-balance leading-tight">
              {match.match_type === 'individual'
                ? (
                  <span className="flex flex-col">
                    <span>{match.team1_player1?.name}</span>
                    {match.team1_player2?.name && <span className="text-[#282c90]/50"> - {match.team1_player2?.name}</span>}
                  </span>
                )
                : match.team1?.name}
            </p>
            {!loading && score && (
              <p className="text-2xl font-black mt-2 text-[#282c90]">
                {score.isPointScoring
                  ? (score.allSets?.[0]?.team1Games || score.currentGame?.team1Points || 0)
                  : (score.matchComplete ? '' : getTennisScoreDisplay(score.currentGame?.team1Points || 0, score.currentGame?.team2Points || 0, score.currentSet.isTiebreaker))
                }
              </p>
            )}
          </div>

          {/* VS / Score Center */}
          <div className="text-center border-l border-r border-[#282c90]/8 py-4 px-2">
            {!loading && score ? (
              score.isPointScoring ? (
                <div>
                  <p className="text-xs text-[#282c90]/40 mb-1">Points</p>
                  <p className="text-xl font-black text-[#282c90]">VS</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-[#282c90]/40 mb-1">Sets</p>
                  <div className="flex gap-2 justify-center">
                    {score.allSets && score.allSets.length > 0 ? (
                      score.allSets.map((s, i) => (
                        <div key={i} className={`flex flex-col items-center ${i === score.allSets!.length - 1 && !score.matchComplete ? 'text-[#48c4c4]' : 'text-[#282c90]'}`}>
                          <p className="text-lg font-bold">{s.team1Games}-{s.team2Games}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-lg font-bold text-[#282c90]">
                        {score.currentSet.team1Games}-{score.currentSet.team2Games}
                      </p>
                    )}
                  </div>
                </div>
              )
            ) : (
              <p className="text-lg font-black text-[#282c90]/20">VS</p>
            )}
          </div>

          {/* Team 2 */}
          <div className="text-center flex flex-col items-center">
            <Avatar className="w-12 h-12 mb-2 rounded-xl border border-[#48c4c4]/20">
              <AvatarImage
                src={match.match_type === 'individual' ? (match.team2_player1?.avatar_url || '') : (match.team2?.logo_url || '')}
                alt={match.match_type === 'individual' ? `${match.team2_player1?.name}` : match.team2?.name}
                className="object-cover"
              />
              <AvatarFallback className="rounded-xl bg-[#282c90]/10 text-[#282c90] font-bold text-lg">
                {getTeamInitials(match.match_type === 'individual'
                  ? (match.team2_player2?.name
                      ? `${match.team2_player1?.name?.charAt(0) || ''}${match.team2_player2?.name?.charAt(0) || ''}`
                      : (match.team2_player1?.name || ''))
                  : (match.team2?.name || '')
                )}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold text-sm text-[#282c90] text-balance leading-tight">
              {match.match_type === 'individual'
                ? (
                  <span className="flex flex-col">
                    <span>{match.team2_player1?.name}</span>
                    {match.team2_player2?.name && <span className="text-[#282c90]/50">- {match.team2_player2?.name}</span>}
                  </span>
                )
                : match.team2?.name}
            </p>
            {!loading && score && (
              <p className="text-2xl font-black mt-2 text-[#282c90]">
                {score.isPointScoring
                  ? (score.allSets?.[0]?.team2Games || score.currentGame?.team2Points || 0)
                  : (score.matchComplete ? '' : getTennisScoreDisplay(score.currentGame?.team2Points || 0, score.currentGame?.team1Points || 0, score.currentSet.isTiebreaker))
                }
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
