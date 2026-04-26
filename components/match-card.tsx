'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSocketMatch } from '@/hooks/use-socket-match';
import { getTeamInitials } from '@/lib/utils';
import type { Match } from '@/lib/db';

function getTennisScoreDisplay(teamPoints: number, oppPoints: number, isTiebreaker: boolean = false): string {
  if (isTiebreaker) {
    return teamPoints.toString();
  }
  
  if (teamPoints >= 3 && oppPoints >= 3) {
    if (teamPoints === oppPoints) return '40'; // Deuce
    if (teamPoints > oppPoints) return 'AD';
    return '40'; // Opponent has AD
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

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        {/* Status Badge */}
        <div className="flex justify-between items-center mb-4">
          <Badge
            variant={
              match.status === 'live'
                ? 'destructive'
                : match.status === 'completed'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {match.status === 'live' && 'LIVE'}
            {match.status === 'scheduled' && 'SCHEDULED'}
            {match.status === 'completed' && 'COMPLETED'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {formatDate(match.scheduled_at)}
          </span>
        </div>

        {/* Match Score Display */}
        <div className="grid grid-cols-3 gap-4 items-center">
          {/* Team 1 */}
          <div className="text-center flex flex-col items-center">
            <Avatar className="w-12 h-12 mb-2 rounded-lg">
              <AvatarImage 
                src={match.match_type === 'individual' ? (match.team1_player1?.avatar_url || '') : (match.team1?.logo_url || '')} 
                alt={match.match_type === 'individual' ? `${match.team1_player1?.name} & ${match.team1_player2?.name}` : match.team1?.name} 
                className="object-cover" 
              />
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-lg">
                {getTeamInitials(match.match_type === 'individual' 
                  ? `${match.team1_player1?.name?.charAt(0) || ''}${match.team1_player2?.name?.charAt(0) || ''}`
                  : (match.team1?.name || '')
                )}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold text-sm text-balance">
              {match.match_type === 'individual' 
                ? <span className="flex flex-col"><span>{match.team1_player1?.name}</span><span>& {match.team1_player2?.name}</span></span>
                : match.team1?.name}
            </p>
            {!loading && score && (
              <p className="text-2xl font-bold mt-2">
                {score.isPointScoring 
                  ? (score.allSets?.[0]?.team1Games || score.currentGame?.team1Points || 0)
                  : (score.matchComplete ? '' : getTennisScoreDisplay(score.currentGame?.team1Points || 0, score.currentGame?.team2Points || 0, score.currentSet.isTiebreaker))
                }
              </p>
            )}
          </div>

          {/* Score/Status */}
          <div className="text-center border-l border-r border-border py-4 px-2">
            {!loading && score ? (
              score.isPointScoring ? (
                 <div>
                   <p className="text-sm text-muted-foreground mb-1">Points</p>
                   <p className="text-xl font-bold">VS</p>
                 </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Sets</p>
                  <div className="flex gap-2 justify-center">
                    {score.allSets && score.allSets.length > 0 ? (
                      score.allSets.map((s, i) => (
                        <div key={i} className={`flex flex-col items-center ${i === score.allSets!.length - 1 && !score.matchComplete ? 'text-blue-500' : ''}`}>
                          <p className="text-lg font-bold">
                            {s.team1Games}-{s.team2Games}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-lg font-bold">
                        {score.currentSet.team1Games}-{score.currentSet.team2Games}
                      </p>
                    )}
                  </div>
                </div>
              )
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </div>

          {/* Team 2 */}
          <div className="text-center flex flex-col items-center">
            <Avatar className="w-12 h-12 mb-2 rounded-lg">
              <AvatarImage 
                src={match.match_type === 'individual' ? (match.team2_player1?.avatar_url || '') : (match.team2?.logo_url || '')} 
                alt={match.match_type === 'individual' ? `${match.team2_player1?.name} & ${match.team2_player2?.name}` : match.team2?.name} 
                className="object-cover" 
              />
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-lg">
                {getTeamInitials(match.match_type === 'individual' 
                  ? `${match.team2_player1?.name?.charAt(0) || ''}${match.team2_player2?.name?.charAt(0) || ''}`
                  : (match.team2?.name || '')
                )}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold text-sm text-balance">
              {match.match_type === 'individual' 
                ? <span className="flex flex-col"><span>{match.team2_player1?.name}</span><span>& {match.team2_player2?.name}</span></span>
                : match.team2?.name}
            </p>
            {!loading && score && (
              <p className="text-2xl font-bold mt-2">
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
