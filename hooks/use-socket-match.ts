import { useEffect, useState, useCallback } from 'react';

export interface MatchScore {
  team1Sets: number;
  team2Sets: number;
  currentSet: {
    team1Games: number;
    team2Games: number;
    isTiebreaker?: boolean;
  };
  allSets: {
    team1Games: number;
    team2Games: number;
  }[];
  isPointScoring: boolean;
  matchComplete: boolean;
  winner?: 'team1' | 'team2';
  currentGame?: {
    team1Points: number;
    team2Points: number;
  };
}

export function useSocketMatch(matchId: string) {
  const [score, setScore] = useState<MatchScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial score
  const fetchScore = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/score?matchId=${matchId}`);
      const data = await res.json();
      if (data.matchState) {
        setScore({
          team1Sets: data.matchState.team1Sets,
          team2Sets: data.matchState.team2Sets,
          currentSet: {
            team1Games: data.matchState.currentSet.team1Games,
            team2Games: data.matchState.currentSet.team2Games,
            isTiebreaker: data.matchState.currentSet.isTiebreaker,
          },
          allSets: data.matchState.allSets || [],
          isPointScoring: data.matchState.isPointScoring || false,
          matchComplete: data.matchState.matchComplete,
          winner: data.matchState.winner,
          currentGame: {
            team1Points: data.matchState.currentGame?.team1Points || 0,
            team2Points: data.matchState.currentGame?.team2Points || 0,
          }
        });
      }
      setError(null);
    } catch (err) {
      console.error('[v0] Error fetching score:', err);
      setError('Failed to fetch score');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchScore();

    // Poll for updates every 5 seconds (fallback if WebSocket not available)
    const interval = setInterval(fetchScore, 5000);

    return () => clearInterval(interval);
  }, [fetchScore]);

  return { score, loading, error, refetch: fetchScore };
}
