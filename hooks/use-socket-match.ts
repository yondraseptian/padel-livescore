import { useEffect, useState, useCallback } from 'react';

export interface MatchScore {
  team1Sets: number;
  team2Sets: number;
  currentSet: {
    team1Games: number;
    team2Games: number;
  };
  matchComplete: boolean;
  winner?: 'team1' | 'team2';
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
          },
          matchComplete: data.matchState.matchComplete,
          winner: data.matchState.winner,
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
