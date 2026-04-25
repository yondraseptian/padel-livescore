'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Match } from '@/lib/db';

interface ScoreInputProps {
  match: Match;
  onScoreUpdate?: () => void;
}

interface MatchState {
  team1Sets: number;
  team2Sets: number;
  currentSet: {
    team1Games: number;
    team2Games: number;
  };
  matchComplete: boolean;
}

export function ScoreInput({ match, onScoreUpdate }: ScoreInputProps) {
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const res = await fetch(`/api/admin/score?matchId=${match.id}`);
        const data = await res.json();
        if (data.matchState) {
          setMatchState(data.matchState);
        } else {
          // Initialize new match
          setMatchState({
            team1Sets: 0,
            team2Sets: 0,
            currentSet: {
              team1Games: 0,
              team2Games: 0,
            },
            matchComplete: false,
          });
        }
      } catch (err) {
        setError('Failed to load match scores');
      } finally {
        setLoading(false);
      }
    };

    fetchScore();
  }, [match.id]);

  const updateScore = async (team1Games: number, team2Games: number) => {
    if (!matchState) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          setNumber: matchState.team1Sets + matchState.team2Sets + 1,
          gameNumber: matchState.currentSet.team1Games + matchState.currentSet.team2Games + 1,
          team1Points: team1Games,
          team2Points: team2Games,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update score');
        return;
      }

      if (data.matchState) {
        setMatchState(data.matchState);
        setSuccess('Score updated successfully');
        setTimeout(() => setSuccess(''), 3000);
        onScoreUpdate?.();
      }
    } catch (err) {
      setError('Error updating score');
    } finally {
      setSaving(false);
    }
  };

  const resetMatch = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admin/score?matchId=${match.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset match');
        return;
      }

      // Re-initialize state
      setMatchState({
        team1Sets: 0,
        team2Sets: 0,
        currentSet: {
          team1Games: 0,
          team2Games: 0,
        },
        matchComplete: false,
      });
      setSuccess('Match reset successfully');
      setTimeout(() => setSuccess(''), 3000);
      onScoreUpdate?.();
    } catch (err) {
      setError('Error resetting match');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading match scores...</p>;
  }

  if (!matchState) {
    return <p className="text-muted-foreground">Unable to load match scores</p>;
  }

  const currentSetNum = matchState.team1Sets + matchState.team2Sets + 1;
  const currentGameNum = matchState.currentSet.team1Games + matchState.currentSet.team2Games + 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {match.team1?.name} vs {match.team2?.name}
        </CardTitle>
        <CardDescription>
          Set {currentSetNum}, Game {currentGameNum}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Sets Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Sets Won</p>
            <p className="text-3xl font-bold">{matchState.team1Sets}</p>
            <p className="text-sm text-muted-foreground">{match.team1?.name}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Sets Won</p>
            <p className="text-3xl font-bold">{matchState.team2Sets}</p>
            <p className="text-sm text-muted-foreground">{match.team2?.name}</p>
          </div>
        </div>

        {/* Current Game Score Input */}
        <div className="border-t border-border pt-6">
          <p className="text-sm font-medium mb-4">Current Game Score</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">{match.team1?.name}</p>
              <p className="text-4xl font-bold mb-4">
                {matchState.currentSet.team1Games}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">{match.team2?.name}</p>
              <p className="text-4xl font-bold mb-4">
                {matchState.currentSet.team2Games}
              </p>
            </div>
          </div>

          {/* Score Update Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {/* Team 1 Buttons */}
            <div className="space-y-2">
              <Button
                onClick={() =>
                  updateScore(
                    matchState.currentSet.team1Games + 1,
                    matchState.currentSet.team2Games
                  )
                }
                disabled={saving || matchState.matchComplete}
                className="w-full"
                variant="outline"
              >
                +1 {match.team1?.name}
              </Button>
            </div>

            {/* Team 2 Buttons */}
            <div className="space-y-2">
              <Button
                onClick={() =>
                  updateScore(
                    matchState.currentSet.team1Games,
                    matchState.currentSet.team2Games + 1
                  )
                }
                disabled={saving || matchState.matchComplete}
                className="w-full"
                variant="outline"
              >
                +1 {match.team2?.name}
              </Button>
            </div>
          </div>
        </div>

        {/* Match Status */}
        {matchState.matchComplete && (
          <div className="border-t border-border pt-6">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Match completed! {matchState.team1Sets > matchState.team2Sets ? match.team1?.name : match.team2?.name} wins {matchState.team1Sets}-{matchState.team2Sets}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Reset Button */}
        <div className="border-t border-border pt-6">
          <Button
            variant="destructive"
            className="w-full"
            disabled={saving}
            onClick={() => {
              if (confirm('Reset this match score? This cannot be undone.')) {
                resetMatch();
              }
            }}
          >
            Reset Match
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
