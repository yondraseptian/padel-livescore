'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSocketMatch } from '@/hooks/use-socket-match';
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
    return date.toLocaleTimeString('id-ID', {
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
          <div className="text-center">
            {match.team1?.logo_url && (
              <img
                src={match.team1.logo_url}
                alt={match.team1?.name}
                className="w-12 h-12 mx-auto rounded-lg mb-2 object-cover"
              />
            )}
            <p className="font-semibold text-sm text-balance">
              {match.team1?.name}
            </p>
            {!loading && score && (
              <p className="text-2xl font-bold mt-2">
                {getTennisScoreDisplay(score.currentGame?.team1Points || 0, score.currentGame?.team2Points || 0, score.currentSet.isTiebreaker)}
              </p>
            )}
          </div>

          {/* Score/Status */}
          <div className="text-center border-l border-r border-border py-4">
            {!loading && score ? (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Sets</p>
                <p className="text-xl font-bold">
                  {score.currentSet.team1Games}-{score.currentSet.team2Games}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </div>

          {/* Team 2 */}
          <div className="text-center">
            {match.team2?.logo_url && (
              <img
                src={match.team2.logo_url}
                alt={match.team2?.name}
                className="w-12 h-12 mx-auto rounded-lg mb-2 object-cover"
              />
            )}
            <p className="font-semibold text-sm text-balance">
              {match.team2?.name}
            </p>
            {!loading && score && (
              <p className="text-2xl font-bold mt-2">
                {getTennisScoreDisplay(score.currentGame?.team2Points || 0, score.currentGame?.team1Points || 0, score.currentSet.isTiebreaker)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
